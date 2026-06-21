from django.db import connection
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response

from .models import Bus, Ruta, Conductor, Horario, Pasajero, Estado
from .serializers import BusSerializer, RutaSerializer, ConductorSerializer, HorarioSerializer, PasajeroSerializer

# Depende de seguridad para bitácoras/permisos
from apps.seguridad.views import registrar_bitacora, verificar_permiso

# ─────────────────────────────────────────────
# VIAJES DINÁMICOS Y RUTAS PÚBLICAS HELPERS
# ─────────────────────────────────────────────

def obtener_o_crear_viaje(ruta, hora_salida, fecha_viaje):
    if not fecha_viaje:
        return None
    viaje = Horario.objects.filter(id_ruta=ruta, hora=hora_salida, fecha=fecha_viaje).first()
    if viaje:
        return viaje

    plantilla = Horario.objects.filter(id_ruta=ruta, hora=hora_salida).first()
    if not plantilla:
        return None

    ultimo = Horario.objects.order_by("-id_viaje").first()
    nuevo_id = (ultimo.id_viaje + 1) if ultimo else 1

    viaje = Horario.objects.create(
        id_viaje=nuevo_id,
        fecha=fecha_viaje,
        hora=plantilla.hora,
        id_ruta=plantilla.id_ruta,
        placa=plantilla.placa
    )
    return viaje


# ─────────────────────────────────────────────
# VIEWSETS
# ─────────────────────────────────────────────

class RutasViewSet(viewsets.ModelViewSet):
    queryset = Ruta.objects.all()
    serializer_class = RutaSerializer
    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        if not verificar_permiso(request.user, 'buses', 'ver'): # Usa el mismo permiso que rutas
            return Response({"mensaje": "Sin permiso para ver rutas."}, status=403)
        return super().list(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        return self.definirNuevaRuta(request, *args, **kwargs)

    def definirNuevaRuta(self, request, *args, **kwargs):
        if not verificar_permiso(request.user, 'buses', 'crear'):
            return Response({"mensaje": "Sin permiso para crear rutas."}, status=403)
        
        origen = request.data.get("origen")
        destino = request.data.get("destino")
        if self.validarRutaDuplicada(origen, destino):
            return Response({"mensaje": "Ruta duplicada origen-destino."}, status=400)

        # Autogenerar ID
        ultimo = Ruta.objects.order_by("-id_ruta").first()
        nuevo_id = (ultimo.id_ruta + 1) if ultimo else 1
        
        request.data["id_ruta"] = nuevo_id
        response = super().create(request, *args, **kwargs)
        registrar_bitacora(request.user.username, 'crear', 'buses', f'Definió nueva ruta {origen}-{destino}', request)
        return response

    def validarRutaDuplicada(self, origen, destino):
        return Ruta.objects.filter(origen=origen, destino=destino).exists()


class HorariosViewSet(viewsets.ModelViewSet):
    queryset = Horario.objects.all()
    serializer_class = HorarioSerializer
    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        if not verificar_permiso(request.user, 'viajes', 'ver'):
            return Response({"mensaje": "Sin permiso para ver viajes."}, status=403)
        registrar_bitacora(request.user.username, 'ver', 'viajes', 'Listó todos los viajes', request)
        return super().list(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        fecha = request.data.get("fecha")
        hora = request.data.get("hora")
        placa = request.data.get("placa")
        
        if self.validarCruceHorarios(fecha, hora, placa):
            return Response({"mensaje": "Cruce de horario para el bus seleccionado."}, status=400)
            
        return self.asignarBusYChofer(request)

    def validarCruceHorarios(self, fecha, hora, placa):
        if not fecha or not hora or not placa:
            return False
        return Horario.objects.filter(fecha=fecha, hora=hora, placa=placa).exists()

    def asignarBusYChofer(self, request):
        if not verificar_permiso(request.user, 'viajes', 'crear'):
            return Response({"mensaje": "Sin permiso para crear viajes."}, status=403)
        
        ultimo = Horario.objects.order_by("-id_viaje").first()
        nuevo_id = (ultimo.id_viaje + 1) if ultimo else 1
        request.data["id_viaje"] = nuevo_id

        response = super().create(request)
        if response.status_code == 201:
            registrar_bitacora(request.user.username, 'crear', 'viajes', f'Creó viaje programado ID={nuevo_id}', request)
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


class ConsultaHorariosViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    def list(self, request):
        return self.buscarDisponibilidad(request)

    def buscarDisponibilidad(self, request):
        id_ruta = request.GET.get("id_ruta")
        fecha = request.GET.get("fecha")
        if not id_ruta:
            return Response({"error": "id_ruta es requerido"}, status=400)
        try:
            ruta = Ruta.objects.get(id_ruta=id_ruta)
        except Ruta.DoesNotExist:
            return Response({"error": "Ruta no existe"}, status=400)

        try:
            viajes_plantilla = Horario.objects.filter(id_ruta=ruta)
            
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


class BusesViewSet(viewsets.ModelViewSet):
    queryset = Bus.objects.all()
    serializer_class = BusSerializer
    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        if not verificar_permiso(request.user, 'buses', 'ver'):
            return Response({"mensaje": "Sin permiso para ver buses."}, status=403)
        registrar_bitacora(request.user.username, 'ver', 'buses', 'Listó todos los buses', request)
        return super().list(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        placa = request.data.get("placa")
        if self.validarPlacaUnica(placa):
            return Response({"mensaje": "Placa ya registrada en la flota."}, status=400)
        
        if not verificar_permiso(request.user, 'buses', 'crear'):
            return Response({"mensaje": "Sin permiso para crear buses."}, status=403)
        
        response = super().create(request, *args, **kwargs)
        registrar_bitacora(request.user.username, 'crear', 'buses', f'Creó bus placa={placa}', request)
        return response

    def validarPlacaUnica(self, placa):
        if not placa:
            return False
        return Bus.objects.filter(placa=placa).exists()

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

    @action(detail=True, methods=['post'], url_path='cambiar-estado')
    def cambiarEstadoFlota(self, request, pk=None):
        if not verificar_permiso(request.user, 'buses', 'modificar'):
            return Response({"mensaje": "Sin permiso."}, status=403)
        try:
            bus = Bus.objects.get(placa=pk)
        except Bus.DoesNotExist:
            return Response({"mensaje": "Bus no encontrado"}, status=404)
        
        nuevo_estado_id = request.data.get("id_estado")
        if nuevo_estado_id:
            try:
                estado = Estado.objects.get(id_estado=nuevo_estado_id)
                bus.id_estado = estado
                bus.save()
                registrar_bitacora(request.user.username, 'modificar', 'buses', f'Cambió estado de bus {pk} a {estado.nombre_estado}', request)
                return Response({"mensaje": "Estado de bus actualizado"})
            except Estado.DoesNotExist:
                return Response({"mensaje": "Estado inválido"}, status=400)
        return Response({"mensaje": "id_estado es requerido"}, status=400)


class PasajerosViewSet(viewsets.ModelViewSet):
    queryset = Pasajero.objects.all()
    serializer_class = PasajeroSerializer
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

    @action(detail=True, methods=['get'], url_path='viajes')
    def buscarHistorialViajes(self, request, pk=None):
        # Consulta cruzada con la app de ventas para ver el historial de boletos comprados
        from apps.ventas.models import Pasaje
        pasajes = Pasaje.objects.filter(ci_pasajero=pk).order_by('-id_pasaje')
        data = [{
            "id_pasaje": p.id_pasaje,
            "origen": p.id_viaje.id_ruta.origen if p.id_viaje else "",
            "destino": p.id_viaje.id_ruta.destino if p.id_viaje else "",
            "fecha": p.id_viaje.fecha.strftime("%Y-%m-%d") if p.id_viaje else "",
            "precio": p.precio_final,
            "estado": p.estado_pasaje
        } for p in pasajes]
        return Response(data)


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


# ─────────────────────────────────────────────
# COMPATIBILITY WRAPPERS
# ─────────────────────────────────────────────

@api_view(["GET"])
@permission_classes([AllowAny])
def listar_rutas(request):
    rutas = Ruta.objects.all()
    data = [{"id_ruta": r.id_ruta, "origen": r.origen, "destino": r.destino, "precio_ruta": r.precio_ruta} for r in rutas]
    return Response(data)


@api_view(["GET"])
@permission_classes([AllowAny])
def asientos_disponibles(request):
    origen = request.GET.get("origen")
    destino = request.GET.get("destino")
    fecha_viaje = request.GET.get("fecha_viaje")
    hora_salida = request.GET.get("hora_salida")
    try:
        ruta = Ruta.objects.get(origen=origen, destino=destino)
    except Ruta.DoesNotExist:
        return Response({"mensaje": "Ruta no encontrada"}, status=400)

    viaje = obtener_o_crear_viaje(ruta, hora_salida, fecha_viaje)
    if not viaje:
        return Response({"mensaje": "No se encontró ese horario para esta ruta"}, status=400)

    placa_str = viaje.placa.placa
    with connection.cursor() as cursor:
        cursor.execute("SELECT nro_asiento, piso FROM asiento WHERE placa = %s", [placa_str])
        rows = cursor.fetchall()

    from apps.ventas.models import Pasaje
    asientos_ocupados = Pasaje.objects.filter(
        id_viaje=viaje, estado_pasaje="VENDIDO"
    ).values_list('nro_asiento', flat=True)

    data_asientos = [{"nro_asiento": row[0], "piso": row[1], "ocupado": row[0] in asientos_ocupados} for row in rows]
    return Response({"viaje": viaje.id_viaje, "placa": placa_str, "asientos": data_asientos}, status=200)
