from django.db import connection
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
import uuid
from django.utils import timezone
from datetime import timedelta
from django.core.mail import send_mail
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import PerfilAdmin
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import (
    Cliente, Pasaje, Viaje, Flota,
    Encomienda, DetalleVenta, Rutas, TipoPasajero, Asiento,Bitacora
)
from .serializers import (
    ClienteSerializer, PasajeSerializer, ViajeSerializer,
    FlotaSerializer, EncomiendaSerializer, DetalleVentaSerializer
)


class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

class FlotaViewSet(viewsets.ModelViewSet):
    queryset = Flota.objects.all()
    serializer_class = FlotaSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

class ViajeViewSet(viewsets.ModelViewSet):
    queryset = Viaje.objects.all()
    serializer_class = ViajeSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

class PasajeViewSet(viewsets.ModelViewSet):
    queryset = Pasaje.objects.all()
    serializer_class = PasajeSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

class EncomiendaViewSet(viewsets.ModelViewSet):
    queryset = Encomienda.objects.all()
    serializer_class = EncomiendaSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

class DetalleVentaViewSet(viewsets.ModelViewSet):
    queryset = DetalleVenta.objects.all()
    serializer_class = DetalleVentaSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]


# ─────────────────────────────────────────────
# RUTAS
# ─────────────────────────────────────────────
@api_view(["GET"])
@permission_classes([AllowAny])
def listar_rutas(request):
    rutas = Rutas.objects.all()
    data = [{
        "id_ruta": r.id_ruta,
        "origen": r.origen,
        "destino": r.destino,
        "precio_ruta": r.precio_ruta
    } for r in rutas]
    return Response(data)


# ─────────────────────────────────────────────
# VIAJES — devuelve horarios sin filtrar fecha
# ─────────────────────────────────────────────
@api_view(["GET"])
@permission_classes([AllowAny])
def listar_viajes(request):
    id_ruta = request.GET.get("id_ruta")
    fecha = request.GET.get("fecha")  # solo la recibimos, no filtramos por ella

    try:
        viajes = Viaje.objects.filter(id_ruta=id_ruta).order_by("hora")
    except Exception as e:
        return Response({"error": str(e)}, status=500)

    data = []
    for v in viajes:
        data.append({
            "id_viaje": v.id_viaje,
            "fecha": fecha,        # devolvemos la fecha que eligió el usuario
            "hora": str(v.hora),
            "placa": v.placa.placa
        })
    return Response(data)


# ─────────────────────────────────────────────
# ASIENTOS — busca viaje solo por ruta + hora
# ─────────────────────────────────────────────
@api_view(["GET"])
@permission_classes([AllowAny])
def asientos_disponibles(request):
    origen = request.GET.get("origen")
    destino = request.GET.get("destino")
    fecha_viaje = request.GET.get("fecha_viaje")
    hora_salida = request.GET.get("hora_salida")

    try:
        ruta = Rutas.objects.get(origen=origen, destino=destino)
    except Rutas.DoesNotExist:
        return Response({"mensaje": "Ruta no encontrada"}, status=400)

    # Buscar por hora y ruta, SIN filtrar por fecha
    viaje = Viaje.objects.filter(hora=hora_salida, id_ruta=ruta).first()

    if not viaje:
        return Response({"mensaje": "No se encontró ese horario para esta ruta"}, status=400)

    placa_str = viaje.placa.placa

    with connection.cursor() as cursor:
        cursor.execute("SELECT nro_asiento, piso FROM asiento WHERE placa = %s", [placa_str])
        rows = cursor.fetchall()

    # Asientos ocupados en esa fecha específica
    asientos_ocupados = Pasaje.objects.filter(
        id_viaje=viaje,
        estado_pasaje="VENDIDO",
        id_viaje__fecha=fecha_viaje   # filtramos la fecha aquí para saber qué está ocupado HOY
    ).values_list('nro_asiento', flat=True)

    data_asientos = [{
        "nro_asiento": row[0],
        "piso": row[1],
        "ocupado": row[0] in asientos_ocupados
    } for row in rows]

    return Response({
        "viaje": viaje.id_viaje,
        "placa": placa_str,
        "asientos": data_asientos
    }, status=200)


# ─────────────────────────────────────────────
# REGISTRAR PASAJE
# ─────────────────────────────────────────────
@api_view(["POST"])
@permission_classes([AllowAny])
def registrar_pasaje(request):
    data = request.data

    nombre_pasajero   = data.get("nombre_pasajero")
    ci_pasajero       = data.get("ci_pasajero")
    telefono_pasajero = data.get("telefono_pasajero")
    id_tipo           = data.get("id_tipo")
    origen            = data.get("origen")
    destino           = data.get("destino")
    fecha_viaje       = data.get("fecha_viaje")
    hora_salida       = data.get("hora_salida")
    nro_asiento       = data.get("nro_asiento")

    try:
        nro_asiento = int(nro_asiento)
    except:
        return Response({"mensaje": "Asiento inválido"}, status=400)

    telefono_pasajero = int(telefono_pasajero) if telefono_pasajero not in ["", None] else None

    try:
        ci_pasajero = int(ci_pasajero)
    except:
        return Response({"mensaje": "CI inválido"}, status=400)

    if origen == destino:
        return Response({"mensaje": "Origen y destino no pueden ser iguales"}, status=400)

    try:
        ruta = Rutas.objects.get(origen=origen, destino=destino)
    except Rutas.DoesNotExist:
        return Response({"mensaje": "Ruta no existe"}, status=400)

    # Buscar viaje por hora + ruta (sin fecha)
    viaje = Viaje.objects.filter(hora=hora_salida, id_ruta=ruta).first()
    if not viaje:
        return Response({"mensaje": "Viaje no encontrado"}, status=400)

    placa_str = viaje.placa.placa

    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT COUNT(*) FROM asiento WHERE nro_asiento = %s AND placa = %s",
            [nro_asiento, placa_str]
        )
        existe = cursor.fetchone()[0]

    if not existe:
        return Response({"mensaje": "Asiento no existe"}, status=400)

    # Verificar ocupado en esa fecha
    if Pasaje.objects.filter(
        id_viaje=viaje,
        nro_asiento=nro_asiento,
        estado_pasaje="VENDIDO",
        id_viaje__fecha=fecha_viaje
    ).exists():
        return Response({"mensaje": "Asiento ocupado para esa fecha"}, status=400)

    try:
        tipo = TipoPasajero.objects.get(id_tipo=int(id_tipo))
    except TipoPasajero.DoesNotExist:
        return Response({"mensaje": f"Tipo de pasajero {id_tipo} no existe"}, status=400)

    precio_final = ruta.precio_ruta

    try:
        ultimo = Pasaje.objects.order_by("-id_pasaje").first()
        nuevo_id = (ultimo.id_pasaje + 1) if ultimo else 1

        pasaje = Pasaje.objects.create(
            id_pasaje=nuevo_id,
            precio_final=precio_final,
            estado_pasaje="VENDIDO",
            nombre_pasajero=nombre_pasajero,
            ci_pasajero=ci_pasajero,
            telefono_pasajero=telefono_pasajero,
            id_tipo=tipo,
            id_viaje=viaje,
            nro_asiento=nro_asiento,
            placa_bus=placa_str
        )
    except Exception as e:
        return Response({"mensaje": f"Error al guardar: {str(e)}"}, status=500)

    return Response({
        "mensaje": "OK",
        "id_pasaje": pasaje.id_pasaje,
        "asiento": nro_asiento,
        "precio": precio_final
    }, status=201)


# ─────────────────────────────────────────────
# TIPOS DE PASAJERO
# ─────────────────────────────────────────────
@api_view(["GET"])
@permission_classes([AllowAny])
def listar_tipos_pasajero(request):
    tipos = TipoPasajero.objects.all()
    return Response([{"id_tipo": t.id_tipo, "nombre_tipo": t.nombre_tipo} for t in tipos])


# ─────────────────────────────────────────────
# AUTH ADMIN
# ─────────────────────────────────────────────
@api_view(["POST"])
@permission_classes([AllowAny])
def login_admin(request):
    username = request.data.get("username")
    password = request.data.get("password")

    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({"mensaje": "Credenciales incorrectas"}, status=401)

    perfil, _ = PerfilAdmin.objects.get_or_create(usuario=user)

    if perfil.bloqueado:
        return Response({"mensaje": "Cuenta bloqueada. Recupera tu contraseña por correo."}, status=403)

    user_auth = authenticate(username=username, password=password)

    if not user_auth:
        perfil.intentos_fallidos += 1
        if perfil.intentos_fallidos >= 3:
            perfil.bloqueado = True
            perfil.save()
            return Response({"mensaje": "Cuenta bloqueada por 3 intentos fallidos."}, status=403)
        perfil.save()
        restantes = 3 - perfil.intentos_fallidos
        return Response({"mensaje": f"Contraseña incorrecta. Te quedan {restantes} intentos."}, status=401)

    perfil.intentos_fallidos = 0
    perfil.save()

    refresh = RefreshToken.for_user(user_auth)
    return Response({
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "es_password_temporal": perfil.es_password_temporal,
        "username": user_auth.username
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def cambiar_credenciales(request):
    nuevo_username = request.data.get("nuevo_username")
    nueva_password = request.data.get("nueva_password")
    correo         = request.data.get("correo")

    if not all([nuevo_username, nueva_password, correo]):
        return Response({"mensaje": "Todos los campos son requeridos"}, status=400)

    user = request.user
    if User.objects.filter(username=nuevo_username).exclude(id=user.id).exists():
        return Response({"mensaje": "Ese nombre de usuario ya está en uso"}, status=400)

    user.username = nuevo_username
    user.set_password(nueva_password)
    user.email = correo
    user.save()

    perfil, _ = PerfilAdmin.objects.get_or_create(usuario=user)
    perfil.correo_recuperacion = correo
    perfil.es_password_temporal = False
    perfil.intentos_fallidos = 0
    perfil.save()

    return Response({"mensaje": "Credenciales actualizadas correctamente"})


@api_view(["POST"])
@permission_classes([AllowAny])
def solicitar_recuperacion(request):
    correo = request.data.get("correo")
    try:
        perfil = PerfilAdmin.objects.get(correo_recuperacion=correo)
    except PerfilAdmin.DoesNotExist:
        return Response({"mensaje": "No existe una cuenta con ese correo"}, status=404)

    token = str(uuid.uuid4())
    perfil.token_recuperacion = token
    perfil.token_expira = timezone.now() + timedelta(hours=1)
    perfil.bloqueado = False
    perfil.intentos_fallidos = 0
    perfil.save()

    link = f"http://localhost:3000/reset-password?token={token}"
    send_mail(
        subject="Recuperación de contraseña - Sistema de Pasajes",
        message=f"Haz clic en el siguiente enlace:\n\n{link}\n\nExpira en 1 hora.",
        from_email=None,
        recipient_list=[correo],
    )
    return Response({"mensaje": "Correo de recuperación enviado"})


@api_view(["POST"])
@permission_classes([AllowAny])
def resetear_password(request):
    token          = request.data.get("token")
    nueva_password = request.data.get("nueva_password")

    try:
        perfil = PerfilAdmin.objects.get(token_recuperacion=token)
    except PerfilAdmin.DoesNotExist:
        return Response({"mensaje": "Token inválido"}, status=400)

    if timezone.now() > perfil.token_expira:
        return Response({"mensaje": "El enlace ha expirado"}, status=400)

    perfil.usuario.set_password(nueva_password)
    perfil.usuario.save()
    perfil.token_recuperacion = None
    perfil.token_expira = None
    perfil.bloqueado = False
    perfil.intentos_fallidos = 0
    perfil.save()

    return Response({"mensaje": "Contraseña actualizada correctamente"})

def registrar_bitacora(usuario, accion, request=None):
    ip = ''
    if request:
        x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
        ip = x_forwarded.split(',')[0] if x_forwarded else request.META.get('REMOTE_ADDR', '')
    Bitacora.objects.create(usuario=usuario, accion=accion, ip=ip)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def obtener_bitacora(request):
    registros = Bitacora.objects.all()[:200]  # últimos 200
    data = [
        {
            "usuario": r.usuario,
            "accion": r.accion,
            "fecha_hora": r.fecha_hora.strftime("%d/%m/%Y %H:%M:%S"),
            "ip": r.ip,
        }
        for r in registros
    ]
    return Response(data)