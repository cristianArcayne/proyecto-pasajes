from django.db import connection
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
import uuid
from django.utils import timezone
from datetime import timedelta
from django.core.mail import send_mail
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    Cliente, Pasaje, Viaje, Flota,
    Encomienda, DetalleVenta, Rutas, TipoPasajero, Asiento,
    Bitacora, PerfilAdmin, Conductor
)
from .serializers import (
    ClienteSerializer, PasajeSerializer, ViajeSerializer,
    FlotaSerializer, EncomiendaSerializer, DetalleVentaSerializer,
)


# ─────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────

def get_ip(request):
    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    return x_forwarded.split(',')[0] if x_forwarded else request.META.get('REMOTE_ADDR', '')


def registrar_bitacora(usuario, accion, modulo, descripcion='', request=None):
    ip = get_ip(request) if request else ''
    Bitacora.objects.create(
        usuario=usuario,
        accion=accion,
        modulo=modulo,
        descripcion=descripcion,
        ip=ip,
    )


def es_superusuario(user):
    try:
        return user.perfiladmin.rol == 'superusuario'
    except PerfilAdmin.DoesNotExist:
        return False


def verificar_permiso(user, modulo, accion):
    try:
        return user.perfiladmin.tiene_permiso(modulo, accion)
    except PerfilAdmin.DoesNotExist:
        return False


# ─────────────────────────────────────────────
# VIEWSETS CON PERMISOS + BITÁCORA
# ─────────────────────────────────────────────

class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer
    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        if not verificar_permiso(request.user, 'clientes', 'ver'):
            return Response({"mensaje": "Sin permiso para ver clientes."}, status=403)
        registrar_bitacora(request.user.username, 'ver', 'clientes', 'Listó todos los clientes', request)
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        if not verificar_permiso(request.user, 'clientes', 'ver'):
            return Response({"mensaje": "Sin permiso para ver clientes."}, status=403)
        registrar_bitacora(request.user.username, 'ver', 'clientes', f'Vio cliente CI={kwargs.get("pk")}', request)
        return super().retrieve(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        if not verificar_permiso(request.user, 'clientes', 'crear'):
            return Response({"mensaje": "Sin permiso para crear clientes."}, status=403)
        response = super().create(request, *args, **kwargs)
        registrar_bitacora(request.user.username, 'crear', 'clientes', f'Creó cliente: {request.data.get("nombre", "")}', request)
        return response

    def update(self, request, *args, **kwargs):
        if not verificar_permiso(request.user, 'clientes', 'modificar'):
            return Response({"mensaje": "Sin permiso para modificar clientes."}, status=403)
        response = super().update(request, *args, **kwargs)
        registrar_bitacora(request.user.username, 'modificar', 'clientes', f'Modificó cliente CI={kwargs.get("pk")}', request)
        return response

    def destroy(self, request, *args, **kwargs):
        if not verificar_permiso(request.user, 'clientes', 'eliminar'):
            return Response({"mensaje": "Sin permiso para eliminar clientes."}, status=403)
        registrar_bitacora(request.user.username, 'eliminar', 'clientes', f'Eliminó cliente CI={kwargs.get("pk")}', request)
        return super().destroy(request, *args, **kwargs)


class FlotaViewSet(viewsets.ModelViewSet):
    queryset = Flota.objects.all()
    serializer_class = FlotaSerializer
    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        if not verificar_permiso(request.user, 'buses', 'ver'):
            return Response({"mensaje": "Sin permiso para ver buses."}, status=403)
        registrar_bitacora(request.user.username, 'ver', 'buses', 'Listó todos los buses', request)
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        if not verificar_permiso(request.user, 'buses', 'ver'):
            return Response({"mensaje": "Sin permiso para ver buses."}, status=403)
        registrar_bitacora(request.user.username, 'ver', 'buses', f'Vio bus placa={kwargs.get("pk")}', request)
        return super().retrieve(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        if not verificar_permiso(request.user, 'buses', 'crear'):
            return Response({"mensaje": "Sin permiso para crear buses."}, status=403)
        response = super().create(request, *args, **kwargs)
        registrar_bitacora(request.user.username, 'crear', 'buses', f'Creó bus placa={request.data.get("placa", "")}', request)
        return response

    def update(self, request, *args, **kwargs):
        if not verificar_permiso(request.user, 'buses', 'modificar'):
            return Response({"mensaje": "Sin permiso para modificar buses."}, status=403)
        response = super().update(request, *args, **kwargs)
        registrar_bitacora(request.user.username, 'modificar', 'buses', f'Modificó bus placa={kwargs.get("pk")}', request)
        return response

    def destroy(self, request, *args, **kwargs):
        if not verificar_permiso(request.user, 'buses', 'eliminar'):
            return Response({"mensaje": "Sin permiso para eliminar buses."}, status=403)
        registrar_bitacora(request.user.username, 'eliminar', 'buses', f'Eliminó bus placa={kwargs.get("pk")}', request)
        return super().destroy(request, *args, **kwargs)


class ViajeViewSet(viewsets.ModelViewSet):
    queryset = Viaje.objects.all()
    serializer_class = ViajeSerializer
    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        if not verificar_permiso(request.user, 'viajes', 'ver'):
            return Response({"mensaje": "Sin permiso para ver viajes."}, status=403)
        registrar_bitacora(request.user.username, 'ver', 'viajes', 'Listó todos los viajes', request)
        return super().list(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        if not verificar_permiso(request.user, 'viajes', 'crear'):
            return Response({"mensaje": "Sin permiso para crear viajes."}, status=403)
        response = super().create(request, *args, **kwargs)
        registrar_bitacora(request.user.username, 'crear', 'viajes', f'Creó viaje', request)
        return response

    def update(self, request, *args, **kwargs):
        if not verificar_permiso(request.user, 'viajes', 'modificar'):
            return Response({"mensaje": "Sin permiso para modificar viajes."}, status=403)
        response = super().update(request, *args, **kwargs)
        registrar_bitacora(request.user.username, 'modificar', 'viajes', f'Modificó viaje id={kwargs.get("pk")}', request)
        return response

    def destroy(self, request, *args, **kwargs):
        if not verificar_permiso(request.user, 'viajes', 'eliminar'):
            return Response({"mensaje": "Sin permiso para eliminar viajes."}, status=403)
        registrar_bitacora(request.user.username, 'eliminar', 'viajes', f'Eliminó viaje id={kwargs.get("pk")}', request)
        return super().destroy(request, *args, **kwargs)


class PasajeViewSet(viewsets.ModelViewSet):
    queryset = Pasaje.objects.all()
    serializer_class = PasajeSerializer
    permission_classes = [IsAuthenticated]


class EncomiendaViewSet(viewsets.ModelViewSet):
    queryset = Encomienda.objects.all()
    serializer_class = EncomiendaSerializer
    permission_classes = [IsAuthenticated]


class DetalleVentaViewSet(viewsets.ModelViewSet):
    queryset = DetalleVenta.objects.all()
    serializer_class = DetalleVentaSerializer
    permission_classes = [IsAuthenticated]


# ─────────────────────────────────────────────
# RUTAS Y VIAJES PÚBLICOS (sin cambios)
# ─────────────────────────────────────────────

@api_view(["GET"])
@permission_classes([AllowAny])
def listar_rutas(request):
    rutas = Rutas.objects.all()
    data = [{"id_ruta": r.id_ruta, "origen": r.origen, "destino": r.destino, "precio_ruta": r.precio_ruta} for r in rutas]
    return Response(data)


@api_view(["GET"])
@permission_classes([AllowAny])
def listar_viajes(request):
    id_ruta = request.GET.get("id_ruta")
    fecha = request.GET.get("fecha")
    try:
        viajes = Viaje.objects.filter(id_ruta=id_ruta).order_by("hora")
    except Exception as e:
        return Response({"error": str(e)}, status=500)
    data = [{"id_viaje": v.id_viaje, "fecha": fecha, "hora": str(v.hora), "placa": v.placa.placa} for v in viajes]
    return Response(data)


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
    viaje = Viaje.objects.filter(hora=hora_salida, id_ruta=ruta).first()
    if not viaje:
        return Response({"mensaje": "No se encontró ese horario para esta ruta"}, status=400)
    placa_str = viaje.placa.placa
    with connection.cursor() as cursor:
        cursor.execute("SELECT nro_asiento, piso FROM asiento WHERE placa = %s", [placa_str])
        rows = cursor.fetchall()
    asientos_ocupados = Pasaje.objects.filter(
        id_viaje=viaje, estado_pasaje="VENDIDO", id_viaje__fecha=fecha_viaje
    ).values_list('nro_asiento', flat=True)
    data_asientos = [{"nro_asiento": row[0], "piso": row[1], "ocupado": row[0] in asientos_ocupados} for row in rows]
    return Response({"viaje": viaje.id_viaje, "placa": placa_str, "asientos": data_asientos}, status=200)


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
    viaje = Viaje.objects.filter(hora=hora_salida, id_ruta=ruta).first()
    if not viaje:
        return Response({"mensaje": "Viaje no encontrado"}, status=400)
    placa_str = viaje.placa.placa
    with connection.cursor() as cursor:
        cursor.execute("SELECT COUNT(*) FROM asiento WHERE nro_asiento = %s AND placa = %s", [nro_asiento, placa_str])
        existe = cursor.fetchone()[0]
    if not existe:
        return Response({"mensaje": "Asiento no existe"}, status=400)
    if Pasaje.objects.filter(id_viaje=viaje, nro_asiento=nro_asiento, estado_pasaje="VENDIDO", id_viaje__fecha=fecha_viaje).exists():
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
            id_pasaje=nuevo_id, precio_final=precio_final, estado_pasaje="VENDIDO",
            nombre_pasajero=nombre_pasajero, ci_pasajero=ci_pasajero,
            telefono_pasajero=telefono_pasajero, id_tipo=tipo, id_viaje=viaje,
            nro_asiento=nro_asiento, placa_bus=placa_str
        )
    except Exception as e:
        return Response({"mensaje": f"Error al guardar: {str(e)}"}, status=500)
    return Response({"mensaje": "OK", "id_pasaje": pasaje.id_pasaje, "asiento": nro_asiento, "precio": precio_final}, status=201)


@api_view(["GET"])
@permission_classes([AllowAny])
def listar_tipos_pasajero(request):
    tipos = TipoPasajero.objects.all()
    return Response([{"id_tipo": t.id_tipo, "nombre_tipo": t.nombre_tipo} for t in tipos])


# ─────────────────────────────────────────────
# AUTH
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
            registrar_bitacora(username, 'login', 'auth', 'Cuenta bloqueada por 3 intentos fallidos', request)
            return Response({"mensaje": "Cuenta bloqueada por 3 intentos fallidos."}, status=403)
        perfil.save()
        restantes = 3 - perfil.intentos_fallidos
        return Response({"mensaje": f"Contraseña incorrecta. Te quedan {restantes} intentos."}, status=401)

    perfil.intentos_fallidos = 0
    perfil.save()
    registrar_bitacora(username, 'login', 'auth', 'Inicio de sesión exitoso', request)

    refresh = RefreshToken.for_user(user_auth)
    return Response({
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "es_password_temporal": perfil.es_password_temporal,
        "username": user_auth.username,
        "rol": perfil.rol,
        "permisos": perfil.permisos,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_admin(request):
    registrar_bitacora(request.user.username, 'logout', 'auth', 'Cerró sesión', request)
    return Response({"mensaje": "Sesión cerrada correctamente"})


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
    registrar_bitacora(nuevo_username, 'modificar', 'auth', 'Actualizó sus credenciales', request)
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
    registrar_bitacora(perfil.usuario.username, 'modificar', 'auth', 'Reseteó su contraseña', request)
    return Response({"mensaje": "Contraseña actualizada correctamente"})


# ─────────────────────────────────────────────
# BITÁCORA
# ─────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def obtener_bitacora(request):
    registros = Bitacora.objects.all()[:200]
    data = [
        {
            "usuario":    r.usuario,
            "accion":     r.accion,
            "modulo":     r.modulo,
            "descripcion":r.descripcion,
            "fecha_hora": r.fecha_hora.strftime("%d/%m/%Y %H:%M:%S"),
            "ip":         r.ip,
        }
        for r in registros
    ]
    return Response(data)


# ─────────────────────────────────────────────
# GESTIÓN DE SUBUSUARIOS (solo superusuario)
# ─────────────────────────────────────────────

PERMISOS_DEFAULT = {
    "clientes": {"ver": False, "crear": False, "modificar": False, "eliminar": False},
    "buses":    {"ver": False, "crear": False, "modificar": False, "eliminar": False},
    "choferes": {"ver": False, "crear": False, "modificar": False, "eliminar": False},
    "viajes":   {"ver": False, "crear": False, "modificar": False, "eliminar": False},
}


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def listar_subusuarios(request):
    if not es_superusuario(request.user):
        return Response({"mensaje": "Solo el superusuario puede gestionar usuarios."}, status=403)
    perfiles = PerfilAdmin.objects.select_related('usuario').filter(rol='subusuario')
    data = [{
        "id":                  p.usuario.id,
        "username":            p.usuario.username,
        "email":               p.usuario.email,
        "bloqueado":           p.bloqueado,
        "es_password_temporal":p.es_password_temporal,
        "permisos":            p.permisos,
    } for p in perfiles]
    return Response(data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def crear_subusuario(request):
    # 1. Validación de Seguridad: Solo Cristian (SuperUsuario) entra aquí
    if request.user.perfiladmin.rol != 'superusuario':
        return Response({"mensaje": "Acceso denegado. Solo el superusuario puede crear cuentas."}, status=403)

    # 2. Obtener datos del Frontend
    username = request.data.get("username")
    password = request.data.get("password")
    email    = request.data.get("email", "")
    # Capturamos los permisos que mandaste desde los checks de React
    permisos_recibidos = request.data.get("permisos") 

    # 3. Validaciones básicas
    if not username or not password:
        return Response({"mensaje": "Usuario y contraseña son obligatorios."}, status=400)
    
    if User.objects.filter(username=username).exists():
        return Response({"mensaje": "Este nombre de usuario ya está registrado."}, status=400)

    try:
        # 4. Crear el usuario en la tabla de Django
        user = User.objects.create_user(username=username, password=password, email=email)
        
        # 5. Si no mandaste permisos desde React, usamos los DEFAULT
        permisos_finales = permisos_recibidos if permisos_recibidos else PERMISOS_DEFAULT.copy()

        # 6. Crear el PerfilAdmin vinculado
        perfil = PerfilAdmin.objects.create(
            usuario=user,
            rol='subusuario',
            es_password_temporal=True,
            permisos=permisos_finales # Aquí se guardan tus checks de React
        )

        # 7. REGISTRO EN BITÁCORA: Ahora sí guardará quién lo creó
        registrar_bitacora(
            usuario=request.user.username, 
            accion='crear', 
            modulo='usuarios', 
            descripcion=f'Creó al trabajador: {username}. Permisos: {list(permisos_finales.keys())}', 
            request=request
        )

        return Response({
            "mensaje": f"Trabajador '{username}' registrado con éxito.",
            "id": user.id
        }, status=201)

    except Exception as e:
        return Response({"mensaje": f"Error interno: {str(e)}"}, status=500)
@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def actualizar_permisos(request, user_id):
    if not es_superusuario(request.user):
        return Response({"mensaje": "Solo el superusuario puede modificar permisos."}, status=403)
    try:
        perfil = PerfilAdmin.objects.get(usuario__id=user_id)
    except PerfilAdmin.DoesNotExist:
        return Response({"mensaje": "Usuario no encontrado."}, status=404)

    nuevos_permisos = request.data.get("permisos")
    if not nuevos_permisos:
        return Response({"mensaje": "Debes enviar los permisos."}, status=400)

    perfil.permisos = nuevos_permisos
    perfil.save()
    registrar_bitacora(request.user.username, 'modificar', 'usuarios', f'Actualizó permisos de: {perfil.usuario.username}', request)
    return Response({"mensaje": "Permisos actualizados correctamente."})


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def eliminar_subusuario(request, user_id):
    if not es_superusuario(request.user):
        return Response({"mensaje": "Solo el superusuario puede eliminar usuarios."}, status=403)
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"mensaje": "Usuario no encontrado."}, status=404)
    if es_superusuario(user):
        return Response({"mensaje": "No puedes eliminar al superusuario."}, status=400)

    username = user.username
    user.delete()
    registrar_bitacora(request.user.username, 'eliminar', 'usuarios', f'Eliminó usuario: {username}', request)
    return Response({"mensaje": f"Usuario '{username}' eliminado correctamente."})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def desbloquear_usuario(request, user_id):
    if not es_superusuario(request.user):
        return Response({"mensaje": "Sin permiso."}, status=403)
    try:
        perfil = PerfilAdmin.objects.get(usuario__id=user_id)
    except PerfilAdmin.DoesNotExist:
        return Response({"mensaje": "Usuario no encontrado."}, status=404)
    perfil.bloqueado = False
    perfil.intentos_fallidos = 0
    perfil.save()
    registrar_bitacora(request.user.username, 'modificar', 'usuarios', f'Desbloqueó usuario: {perfil.usuario.username}', request)
    return Response({"mensaje": "Usuario desbloqueado correctamente."})


# ─────────────────────────────────────────────
# PERFIL PROPIO
# ─────────────────────────────────────────────

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def mi_perfil(request):
    try:
        perfil = request.user.perfiladmin
        return Response({
            "username": request.user.username,
            "email":    request.user.email,
            "rol":      perfil.rol,
            "permisos": perfil.permisos,
        })
    except PerfilAdmin.DoesNotExist:
        return Response({"mensaje": "Perfil no encontrado."}, status=404)

"""# En views.py
class ConductorViewSet(viewsets.ModelViewSet):
    queryset = Conductor.objects.all()
    serializer_class = ConductorSerializer # Crea este en serializers.py
    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        if not verificar_permiso(request.user, 'choferes', 'ver'):
            return Response({"mensaje": "Sin permiso."}, status=403)
        registrar_bitacora(request.user.username, 'ver', 'choferes', 'Listó choferes', request)
        return super().list(request, *args, **kwargs)
    
    # ... Repetir lógica de permisos para create, update y destroy
    """