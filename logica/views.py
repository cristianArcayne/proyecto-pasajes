from django.db import connection
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import (
    Flota, Viaje, Rutas, Conductor, Encomienda, Asiento, TipoEncomienda
)
from .serializers import (
    FlotaSerializer, ViajeSerializer, ConductorSerializer, EncomiendaSerializer
)
# Depende del paquete de seguridad para auditar acciones y verificar permisos
from seguridad.views import registrar_bitacora, verificar_permiso

# ─────────────────────────────────────────────
# VIEWSETS CON PERMISOS + BITÁCORA
# ─────────────────────────────────────────────

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


class ConductorViewSet(viewsets.ModelViewSet):
    queryset = Conductor.objects.all()
    serializer_class = ConductorSerializer
    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        if not verificar_permiso(request.user, 'choferes', 'ver'):
            return Response({"mensaje": "Sin permiso para ver choferes."}, status=403)
        registrar_bitacora(request.user.username, 'ver', 'choferes', 'Listó choferes', request)
        return super().list(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        if not verificar_permiso(request.user, 'choferes', 'crear'):
            return Response({"mensaje": "Sin permiso para crear choferes."}, status=403)
        response = super().create(request, *args, **kwargs)
        registrar_bitacora(request.user.username, 'crear', 'choferes', 'Creó chofer', request)
        return response

    def update(self, request, *args, **kwargs):
        if not verificar_permiso(request.user, 'choferes', 'modificar'):
            return Response({"mensaje": "Sin permiso para modificar choferes."}, status=403)
        response = super().update(request, *args, **kwargs)
        registrar_bitacora(request.user.username, 'modificar', 'choferes', f'Modificó chofer CI={kwargs.get("pk")}', request)
        return response

    def destroy(self, request, *args, **kwargs):
        if not verificar_permiso(request.user, 'choferes', 'eliminar'):
            return Response({"mensaje": "Sin permiso para eliminar choferes."}, status=403)
        registrar_bitacora(request.user.username, 'eliminar', 'choferes', f'Eliminó chofer CI={kwargs.get("pk")}', request)
        return super().destroy(request, *args, **kwargs)


class EncomiendaViewSet(viewsets.ModelViewSet):
    queryset = Encomienda.objects.all()
    serializer_class = EncomiendaSerializer
    permission_classes = [IsAuthenticated]


# ─────────────────────────────────────────────
# VIAJES DINÁMICOS Y RUTAS PÚBLICAS
# ─────────────────────────────────────────────

def obtener_o_crear_viaje(ruta, hora_salida, fecha_viaje):
    if not fecha_viaje:
        return None
    viaje = Viaje.objects.filter(id_ruta=ruta, hora=hora_salida, fecha=fecha_viaje).first()
    if viaje:
        return viaje

    plantilla = Viaje.objects.filter(id_ruta=ruta, hora=hora_salida).first()
    if not plantilla:
        return None

    ultimo = Viaje.objects.order_by("-id_viaje").first()
    nuevo_id = (ultimo.id_viaje + 1) if ultimo else 1

    viaje = Viaje.objects.create(
        id_viaje=nuevo_id,
        fecha=fecha_viaje,
        hora=plantilla.hora,
        id_ruta=plantilla.id_ruta,
        placa=plantilla.placa
    )
    return viaje


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
    if not id_ruta:
        return Response({"error": "id_ruta es requerido"}, status=400)
    try:
        ruta = Rutas.objects.get(id_ruta=id_ruta)
    except Rutas.DoesNotExist:
        return Response({"error": "Ruta no existe"}, status=400)

    try:
        viajes_plantilla = Viaje.objects.filter(id_ruta=ruta)
        
        viajes_fecha = []
        for vp in viajes_plantilla:
            if fecha:
                v = obtener_o_crear_viaje(ruta, vp.hora, fecha)
                if v:
                    viajes_fecha.append(v)
            else:
                viajes_fecha.append(vp)

        viajes_fecha.sort(key=lambda x: x.hora)

        horas_vistas = set()
        viajes_unicos = []
        for v in viajes_fecha:
            if v.hora not in horas_vistas:
                horas_vistas.add(v.hora)
                viajes_unicos.append(v)

    except Exception as e:
        return Response({"error": str(e)}, status=500)

    data = [{"id_viaje": v.id_viaje, "fecha": fecha or str(v.fecha), "hora": str(v.hora), "placa": v.placa.placa} for v in viajes_unicos]
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

    viaje = obtener_o_crear_viaje(ruta, hora_salida, fecha_viaje)
    if not viaje:
        return Response({"mensaje": "No se encontró ese horario para esta ruta"}, status=400)

    placa_str = viaje.placa.placa
    with connection.cursor() as cursor:
        cursor.execute("SELECT nro_asiento, piso FROM asiento WHERE placa = %s", [placa_str])
        rows = cursor.fetchall()

    # Los pasajes comprados pertenecen a la app de Venta, pero hacemos la consulta SQL/ORM directamente
    # Django es capaz de realizar consultas cruzadas sin problemas usando strings
    from venta.models import Pasaje
    asientos_ocupados = Pasaje.objects.filter(
        id_viaje=viaje, estado_pasaje="VENDIDO"
    ).values_list('nro_asiento', flat=True)

    data_asientos = [{"nro_asiento": row[0], "piso": row[1], "ocupado": row[0] in asientos_ocupados} for row in rows]
    return Response({"viaje": viaje.id_viaje, "placa": placa_str, "asientos": data_asientos}, status=200)
