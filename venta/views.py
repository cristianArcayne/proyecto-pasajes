from django.db import connection
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import Cliente, Pasaje, DetalleVenta, TipoPasajero
from .serializers import ClienteSerializer, PasajeSerializer, DetalleVentaSerializer

# Depende de la lógica para obtener viajes/rutas y de seguridad para bitácoras/permisos
from logica.models import Viaje, Rutas
from logica.views import obtener_o_crear_viaje
from seguridad.views import registrar_bitacora, verificar_permiso

# ─────────────────────────────────────────────
# VIEWSETS CON PERMISOS Y BITÁCORA
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


class PasajeViewSet(viewsets.ModelViewSet):
    queryset = Pasaje.objects.all()
    serializer_class = PasajeSerializer
    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        if not verificar_permiso(request.user, 'ventas', 'ver'):
            return Response({"mensaje": "Sin permiso para ver ventas."}, status=403)
        registrar_bitacora(request.user.username, 'ver', 'ventas', 'Listó todas las ventas de pasajes', request)
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        if not verificar_permiso(request.user, 'ventas', 'ver'):
            return Response({"mensaje": "Sin permiso para ver ventas."}, status=403)
        registrar_bitacora(request.user.username, 'ver', 'ventas', f'Vio venta de pasaje ID={kwargs.get("pk")}', request)
        return super().retrieve(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        if not verificar_permiso(request.user, 'ventas', 'crear'):
            return Response({"mensaje": "Sin permiso para registrar ventas."}, status=403)
        response = super().create(request, *args, **kwargs)
        registrar_bitacora(request.user.username, 'crear', 'ventas', f'Registró venta de pasaje: Pasajero={request.data.get("nombre_pasajero", "")}, Asiento={request.data.get("nro_asiento")}', request)
        return response

    def update(self, request, *args, **kwargs):
        if not verificar_permiso(request.user, 'ventas', 'modificar'):
            return Response({"mensaje": "Sin permiso para modificar ventas."}, status=403)
        response = super().update(request, *args, **kwargs)
        registrar_bitacora(request.user.username, 'modificar', 'ventas', f'Modificó venta de pasaje ID={kwargs.get("pk")}', request)
        return response

    def destroy(self, request, *args, **kwargs):
        if not verificar_permiso(request.user, 'ventas', 'eliminar'):
            return Response({"mensaje": "Sin permiso para eliminar ventas."}, status=403)
        registrar_bitacora(request.user.username, 'eliminar', 'ventas', f'Canceló/Eliminó venta de pasaje ID={kwargs.get("pk")}', request)
        return super().destroy(request, *args, **kwargs)


class DetalleVentaViewSet(viewsets.ModelViewSet):
    queryset = DetalleVenta.objects.all()
    serializer_class = DetalleVentaSerializer
    permission_classes = [IsAuthenticated]


# ─────────────────────────────────────────────
# PROCEDIMIENTO DE VENTA Y BOLETERÍA
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

    # Buscar/crear viaje exacto para esa fecha
    viaje = obtener_o_crear_viaje(ruta, hora_salida, fecha_viaje)
    if not viaje:
        return Response({"mensaje": "Viaje no encontrado"}, status=400)

    placa_str = viaje.placa.placa
    with connection.cursor() as cursor:
        cursor.execute("SELECT COUNT(*) FROM asiento WHERE nro_asiento = %s AND placa = %s", [nro_asiento, placa_str])
        existe = cursor.fetchone()[0]
    if not existe:
        return Response({"mensaje": "Asiento no existe"}, status=400)

    # Verificar si el asiento está ocupado para este viaje en particular
    if Pasaje.objects.filter(id_viaje=viaje, nro_asiento=nro_asiento, estado_pasaje="VENDIDO").exists():
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
def recuperar_pasaje_publico(request):
    ci = request.GET.get("ci_pasajero")
    if not ci:
        return Response({"mensaje": "C.I. es requerido"}, status=400)
    try:
        ci = int(ci)
    except ValueError:
        return Response({"mensaje": "C.I. inválido"}, status=400)
        
    pasajes = Pasaje.objects.filter(ci_pasajero=ci).order_by('-id_pasaje')[:5]
    data = []
    for p in pasajes:
        data.append({
            "id_pasaje": p.id_pasaje,
            "nombre_pasajero": p.nombre_pasajero,
            "ci_pasajero": p.ci_pasajero,
            "telefono_pasajero": p.telefono_pasajero,
            "nro_asiento": p.nro_asiento,
            "placa_bus": p.placa_bus,
            "precio_final": p.precio_final,
            "estado_pasaje": p.estado_pasaje,
            "tipo_pasajero": p.id_tipo.nombre_tipo if p.id_tipo else "Normal",
            "fecha": p.id_viaje.fecha.strftime("%Y-%m-%d") if p.id_viaje else "",
            "hora": p.id_viaje.hora.strftime("%H:%M:%S") if p.id_viaje else "",
            "origen": p.id_viaje.id_ruta.origen if p.id_viaje and p.id_viaje.id_ruta else "",
            "destino": p.id_viaje.id_ruta.destino if p.id_viaje and p.id_viaje.id_ruta else "",
        })
    return Response(data)


@api_view(["GET"])
@permission_classes([AllowAny])
def listar_tipos_pasajero(request):
    tipos = TipoPasajero.objects.all()
    return Response([{"id_tipo": t.id_tipo, "nombre_tipo": t.nombre_tipo} for t in tipos])
