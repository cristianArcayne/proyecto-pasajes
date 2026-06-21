from django.db import connection
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response

from .models import Cliente, Pasaje, DetalleVenta, TipoPasajero
from .serializers import ClienteSerializer, PasajeSerializer, DetalleVentaSerializer

# Depende de logística para obtener viajes/rutas y de seguridad para bitácoras/permisos
from apps.logistica.models import Horario, Ruta
from apps.logistica.views import obtener_o_crear_viaje
from apps.seguridad.views import registrar_bitacora, verificar_permiso

# ─────────────────────────────────────────────
# VIEWSETS
# ─────────────────────────────────────────────

class AsientosViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    def list(self, request):
        return self.renderizarOcupacion(request)

    def renderizarOcupacion(self, request):
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

        asientos_ocupados = Pasaje.objects.filter(
            id_viaje=viaje, estado_pasaje="VENDIDO"
        ).values_list('nro_asiento', flat=True)

        data_asientos = [{"nro_asiento": row[0], "piso": row[1], "ocupado": row[0] in asientos_ocupados} for row in rows]
        return Response({"viaje": viaje.id_viaje, "placa": placa_str, "asientos": data_asientos}, status=200)

    @action(detail=False, methods=['post'], url_path='bloquear')
    def bloquearAsientoTemporal(self, request):
        nro_asiento = request.data.get("nro_asiento")
        placa = request.data.get("placa")
        return Response({"mensaje": f"Asiento {nro_asiento} del bus {placa} bloqueado temporalmente."}, status=200)


class VentaViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    def create(self, request):
        return self.procesarTransaccion(request)

    def procesarTransaccion(self, request):
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
            ruta = Ruta.objects.get(origen=origen, destino=destino)
        except Ruta.DoesNotExist:
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
            
            # Llamada al método confirmarPago del ViewSet
            self.confirmarPago(pasaje.id_pasaje)
            
        except Exception as e:
            return Response({"mensaje": f"Error al guardar: {str(e)}"}, status=500)
            
        return Response({"mensaje": "OK", "id_pasaje": pasaje.id_pasaje, "asiento": nro_asiento, "precio": precio_final}, status=201)

    def confirmarPago(self, pasaje_id):
        # Actualización o auditoría final del cobro
        pass


class GestionVentasViewSet(viewsets.ModelViewSet):
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
        registrar_bitacora(request.user.username, 'crear', 'ventas', f'Registró venta de pasaje: Pasajero={request.data.get("nombre_pasajero", "")}', request)
        return response

    def update(self, request, *args, **kwargs):
        if not verificar_permiso(request.user, 'ventas', 'modificar'):
            return Response({"mensaje": "Sin permiso para modificar ventas."}, status=403)
        response = super().update(request, *args, **kwargs)
        registrar_bitacora(request.user.username, 'modificar', 'ventas', f'Modificó venta de pasaje ID={kwargs.get("pk")}', request)
        return response

    def destroy(self, request, *args, **kwargs):
        return self.anularPasaje(request, *args, **kwargs)

    def anularPasaje(self, request, *args, **kwargs):
        if not verificar_permiso(request.user, 'ventas', 'eliminar'):
            return Response({"mensaje": "Sin permiso para eliminar ventas."}, status=403)
        
        pasaje_id = kwargs.get("pk")
        registrar_bitacora(request.user.username, 'eliminar', 'ventas', f'Canceló/Anuló venta de pasaje ID={pasaje_id}', request)
        
        self.liberarAsiento(pasaje_id)
        return super().destroy(request, *args, **kwargs)

    def liberarAsiento(self, pasaje_id):
        # Lógica de liberación de reserva de asiento si fuese necesario
        pass

    @action(detail=False, methods=['post'], url_path='enviar-correo', permission_classes=[AllowAny])
    def enviarCorreoBoleto(self, request):
        email_dest = request.data.get("email")
        imagen_base64 = request.data.get("imagen")
        id_pasaje = request.data.get("id_pasaje")

        if not email_dest or not imagen_base64 or not id_pasaje:
            return Response({"mensaje": "Datos insuficientes (email, imagen, id_pasaje requeridos)."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            import base64
            from django.core.mail import EmailMessage

            # Parse base64 image data
            if "," in imagen_base64:
                header, data = imagen_base64.split(",", 1)
            else:
                data = imagen_base64

            image_data = base64.b64decode(data)

            # Send Email
            email_msg = EmailMessage(
                subject=f"Boleto de Embarque Virtual - Pasaje #{id_pasaje}",
                body=f"Estimado cliente,\n\nAdjunto a este correo electrónico encontrará su boleto de embarque virtual correspondiente al pasaje #{id_pasaje}.\n\n¡Gracias por viajar con nosotros!\n\nAtentamente,\nSistema Terminal de Pasajes",
                from_email=None,
                to=[email_dest]
            )
            email_msg.attach(f"Boleto-Pasaje-{id_pasaje}.png", image_data, "image/png")
            email_msg.send()

            # Bitacora entry
            usuario_log = request.user.username if request.user.is_authenticated else "anonimo_publico"
            registrar_bitacora(usuario_log, 'enviar_email', 'ventas', f'Envió boleto #{id_pasaje} por email a {email_dest}', request)

            return Response({"mensaje": "Correo enviado exitosamente."})
        except Exception as e:
            return Response({"mensaje": f"Error al enviar el correo: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DetalleVentaViewSet(viewsets.ModelViewSet):
    queryset = DetalleVenta.objects.all()
    serializer_class = DetalleVentaSerializer
    permission_classes = [IsAuthenticated]


# ─────────────────────────────────────────────
# COMPATIBILITY WRAPPERS
# ─────────────────────────────────────────────

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
