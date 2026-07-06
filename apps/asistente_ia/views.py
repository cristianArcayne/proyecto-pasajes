import re
import unicodedata

from django.db.models import Count, Sum
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.encomiendas.models import Encomienda
from apps.logistica.models import Bus, Conductor, Horario, Pasajero as Cliente, Ruta
from apps.ventas.models import Pasaje
from .models import BitacoraAsistenteIA
from .serializers import BitacoraAsistenteIASerializer


class AsistenteIAView(APIView):
    permission_classes = [IsAuthenticated]
    PALABRAS_CLIENTES = {"cliente", "clientes", "pasajero", "pasajeros", "ci", "nombre"}
    PALABRAS_REPORTES = {
        "reporte", "reportes", "venta", "ventas", "ingreso", "ingresos",
        "financiero", "encomienda", "encomiendas", "chofer", "choferes",
        "conductor", "conductores", "bus", "buses", "flota", "viaje", "viajes",
        "ruta", "rutas", "consolidado", "estadistica", "estadisticas",
    }
    RESPUESTA_NO_RECONOCIDA = (
        "No se pudo interpretar la solicitud. El asistente solo puede consultar "
        "información de clientes y reportes."
    )

    def post(self, request):
        consulta = str(request.data.get("consulta", "")).strip()
        if not consulta:
            return Response({"consulta": ["Este campo es obligatorio."]},
                            status=status.HTTP_400_BAD_REQUEST)
        texto = self._normalizar(consulta)
        palabras = set(re.findall(r"\w+", texto))
        if palabras & self.PALABRAS_REPORTES:
            tipo, respuesta = "reportes", self._consultar_reportes(texto, palabras)
        elif palabras & self.PALABRAS_CLIENTES:
            tipo, respuesta = "clientes", self._consultar_clientes(texto)
        else:
            tipo, respuesta = "no_reconocida", self.RESPUESTA_NO_RECONOCIDA
        registro = BitacoraAsistenteIA.objects.create(
            usuario=request.user, consulta=consulta, respuesta=respuesta, tipo_consulta=tipo)
        resultado = BitacoraAsistenteIASerializer(registro).data
        if tipo in {"clientes", "reportes"}:
            resultado["tabla"] = self._crear_tabla(texto, palabras)
        return Response(resultado)

    @staticmethod
    def _normalizar(texto):
        return "".join(c for c in unicodedata.normalize("NFD", texto.lower())
                       if unicodedata.category(c) != "Mn")

    def _consultar_clientes(self, texto):
        coincidencia = re.search(r"\b(?:ci\s*)?(\d{5,12})\b", texto)
        clientes = Cliente.objects.all().order_by("nombre")
        if coincidencia:
            cliente = clientes.filter(ci=int(coincidencia.group(1))).first()
            if not cliente:
                return f"No se encontró un cliente con CI {coincidencia.group(1)}."
            return (f"Cliente encontrado: {cliente.nombre}, CI {cliente.ci}, teléfono "
                    f"{cliente.telefono or 'sin teléfono registrado'}.")
        total = clientes.count()
        if not total:
            return "No hay clientes registrados."
        listado = "; ".join(f"{c.nombre} (CI {c.ci})" for c in clientes[:10])
        sufijo = f" Se muestran 10 de {total}." if total > 10 else ""
        return f"Clientes registrados: {total}. {listado}.{sufijo}"

    def _consultar_reportes(self, texto, palabras):
        pasajes, encomiendas = Pasaje.objects.all(), Encomienda.objects.all()
        ingreso_p = pasajes.aggregate(total=Sum("precio_final"))["total"] or 0
        ingreso_e = encomiendas.aggregate(total=Sum("precio_total"))["total"] or 0

        if palabras & {"chofer", "choferes", "conductor", "conductores"}:
            choferes = Conductor.objects.all().order_by("nombre")
            if not choferes.exists():
                return "El reporte de choferes no tiene registros."
            lista = "; ".join(
                f"{chofer.nombre}, CI {chofer.ci}, licencia {chofer.licencia}"
                for chofer in choferes[:10]
            )
            return f"Reporte de choferes: {choferes.count()} registrados. {lista}."

        if (palabras & {"pasajero", "pasajeros"}) and (palabras & {"bus", "buses", "flota"}):
            pasajeros_por_bus = (
                pasajes.exclude(placa_bus__isnull=True).exclude(placa_bus="")
                .values("placa_bus").annotate(total=Count("id_pasaje"))
                .order_by("-total")
            )
            if not pasajeros_por_bus.exists():
                return "El reporte de pasajeros por bus no tiene registros."
            lista = "; ".join(
                f"bus {fila['placa_bus']}: {fila['total']} pasajeros"
                for fila in pasajeros_por_bus[:10]
            )
            return f"Reporte de pasajeros por bus. {lista}."

        if palabras & {"bus", "buses", "flota"}:
            buses = Bus.objects.select_related("id_estado").all().order_by("placa")
            activos = sum(
                1 for bus in buses
                if bus.id_estado and "activ" in bus.id_estado.nombre_estado.lower()
            )
            lista = "; ".join(
                f"{bus.placa}, modelo {bus.modelo or 'no registrado'}, "
                f"{bus.capacidad_asientos or 0} asientos"
                for bus in buses[:10]
            )
            return f"Reporte de flota: {buses.count()} buses, {activos} activos. {lista}."

        if palabras & {"viaje", "viajes", "ruta", "rutas"}:
            viajes = Horario.objects.select_related("id_ruta", "placa").order_by("-fecha", "-hora")
            rutas = Ruta.objects.all()
            lista = "; ".join(
                f"viaje {viaje.id_viaje}, {viaje.id_ruta.origen} a {viaje.id_ruta.destino}, "
                f"{viaje.fecha} a las {viaje.hora}"
                for viaje in viajes[:10] if viaje.id_ruta
            )
            return f"Reporte de viajes y rutas: {viajes.count()} viajes y {rutas.count()} rutas. {lista}."

        if palabras & {"cliente", "clientes", "pasajero", "pasajeros"}:
            return self._consultar_clientes(texto)

        if palabras & {"encomienda", "encomiendas"}:
            return (f"Reporte de encomiendas: {encomiendas.count()} registradas, con ingresos "
                    f"totales de {ingreso_e:.2f} Bs.")

        if palabras & {"venta", "ventas"} and not palabras & {"ingreso", "ingresos", "financiero"}:
            vendidos = pasajes.filter(estado_pasaje__iexact="VENDIDO")
            return (f"Reporte de ventas: {pasajes.count()} pasajes registrados, "
                    f"{vendidos.count()} vendidos e ingresos de {ingreso_p:.2f} Bs.")

        if palabras & {"ingreso", "ingresos", "financiero"}:
            return (f"Reporte financiero: ingresos por pasajes de {ingreso_p:.2f} Bs, ingresos por "
                    f"encomiendas de {ingreso_e:.2f} Bs e ingresos totales de "
                    f"{ingreso_p + ingreso_e:.2f} Bs.")

        return (f"Resumen de reportes: {pasajes.count()} pasajes vendidos, "
                f"{encomiendas.count()} encomiendas registradas, ingresos por pasajes de "
                f"{ingreso_p:.2f} Bs, ingresos por encomiendas de {ingreso_e:.2f} Bs e ingresos "
                f"totales de {ingreso_p + ingreso_e:.2f} Bs.")

    def _crear_tabla(self, texto, palabras):
        def tabla(titulo, columnas, filas):
            return {"titulo": titulo, "columnas": columnas, "filas": filas}

        if palabras & {"chofer", "choferes", "conductor", "conductores"}:
            filas = [{
                "nombre": c.nombre, "ci": c.ci, "telefono": c.telefono,
                "edad": c.edad, "licencia": c.licencia,
            } for c in Conductor.objects.all().order_by("nombre")]
            return tabla("Reporte de choferes", [
                {"clave": "nombre", "etiqueta": "Nombre"}, {"clave": "ci", "etiqueta": "CI"},
                {"clave": "telefono", "etiqueta": "Teléfono"}, {"clave": "edad", "etiqueta": "Edad"},
                {"clave": "licencia", "etiqueta": "Licencia"},
            ], filas)

        if (palabras & {"pasajero", "pasajeros"}) and (palabras & {"bus", "buses", "flota"}):
            filas = list(Pasaje.objects.exclude(placa_bus__isnull=True).exclude(placa_bus="")
                         .values("placa_bus").annotate(total=Count("id_pasaje")).order_by("-total"))
            return tabla("Pasajeros por bus", [
                {"clave": "placa_bus", "etiqueta": "Bus"},
                {"clave": "total", "etiqueta": "Cantidad de pasajeros"},
            ], filas)

        if palabras & {"bus", "buses", "flota"}:
            filas = [{
                "placa": b.placa, "modelo": b.modelo or "N/A",
                "capacidad": b.capacidad_asientos or 0,
                "estado": b.id_estado.nombre_estado if b.id_estado else "N/A",
            } for b in Bus.objects.select_related("id_estado").all().order_by("placa")]
            return tabla("Reporte de flota", [
                {"clave": "placa", "etiqueta": "Placa"}, {"clave": "modelo", "etiqueta": "Modelo"},
                {"clave": "capacidad", "etiqueta": "Capacidad"}, {"clave": "estado", "etiqueta": "Estado"},
            ], filas)

        if palabras & {"viaje", "viajes", "ruta", "rutas"}:
            filas = [{
                "id": v.id_viaje,
                "ruta": f"{v.id_ruta.origen} - {v.id_ruta.destino}" if v.id_ruta else "N/A",
                "fecha": v.fecha, "hora": v.hora, "bus": v.placa_id or "N/A",
            } for v in Horario.objects.select_related("id_ruta", "placa").order_by("-fecha", "-hora")]
            return tabla("Reporte de viajes y rutas", [
                {"clave": "id", "etiqueta": "Viaje"}, {"clave": "ruta", "etiqueta": "Ruta"},
                {"clave": "fecha", "etiqueta": "Fecha"}, {"clave": "hora", "etiqueta": "Hora"},
                {"clave": "bus", "etiqueta": "Bus"},
            ], filas)

        if palabras & {"cliente", "clientes", "pasajero", "pasajeros"}:
            clientes = Cliente.objects.all().order_by("nombre")
            coincidencia = re.search(r"\b(?:ci\s*)?(\d{5,12})\b", texto)
            if coincidencia:
                clientes = clientes.filter(ci=int(coincidencia.group(1)))
            filas = [{"nombre": c.nombre, "ci": c.ci, "telefono": c.telefono,
                      "comentario": c.comentario or ""} for c in clientes]
            return tabla("Reporte de clientes", [
                {"clave": "nombre", "etiqueta": "Nombre"}, {"clave": "ci", "etiqueta": "CI"},
                {"clave": "telefono", "etiqueta": "Teléfono"},
                {"clave": "comentario", "etiqueta": "Comentario"},
            ], filas)

        if palabras & {"encomienda", "encomiendas"}:
            filas = [{
                "numero": e.nro_encomienda, "peso": e.peso_kg or 0,
                "precio": e.precio_total or 0, "descripcion": e.descripcion_carga or "",
                "remitente": e.ci_remitente_id or "N/A",
            } for e in Encomienda.objects.all().order_by("nro_encomienda")]
            return tabla("Reporte de encomiendas", [
                {"clave": "numero", "etiqueta": "Número"}, {"clave": "peso", "etiqueta": "Peso (kg)"},
                {"clave": "precio", "etiqueta": "Precio (Bs)"},
                {"clave": "descripcion", "etiqueta": "Descripción"},
                {"clave": "remitente", "etiqueta": "CI remitente"},
            ], filas)

        pasajes = Pasaje.objects.all().order_by("-id_pasaje")
        if palabras & {"venta", "ventas"} and not palabras & {"ingreso", "ingresos", "financiero"}:
            filas = [{
                "id": p.id_pasaje, "pasajero": p.nombre_pasajero, "ci": p.ci_pasajero,
                "precio": p.precio_final or 0, "estado": p.estado_pasaje or "N/A",
                "bus": p.placa_bus or "N/A",
            } for p in pasajes]
            return tabla("Reporte de ventas", [
                {"clave": "id", "etiqueta": "Venta"}, {"clave": "pasajero", "etiqueta": "Pasajero"},
                {"clave": "ci", "etiqueta": "CI"}, {"clave": "precio", "etiqueta": "Precio (Bs)"},
                {"clave": "estado", "etiqueta": "Estado"}, {"clave": "bus", "etiqueta": "Bus"},
            ], filas)

        ingreso_p = pasajes.aggregate(total=Sum("precio_final"))["total"] or 0
        encomiendas = Encomienda.objects.all()
        ingreso_e = encomiendas.aggregate(total=Sum("precio_total"))["total"] or 0
        filas = [
            {"concepto": "Pasajes", "cantidad": pasajes.count(), "ingresos": f"{ingreso_p:.2f}"},
            {"concepto": "Encomiendas", "cantidad": encomiendas.count(), "ingresos": f"{ingreso_e:.2f}"},
            {"concepto": "Total", "cantidad": pasajes.count() + encomiendas.count(),
             "ingresos": f"{ingreso_p + ingreso_e:.2f}"},
        ]
        return tabla("Reporte consolidado", [
            {"clave": "concepto", "etiqueta": "Concepto"},
            {"clave": "cantidad", "etiqueta": "Cantidad"},
            {"clave": "ingresos", "etiqueta": "Ingresos (Bs)"},
        ], filas)
