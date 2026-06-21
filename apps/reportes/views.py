from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.ventas.models import Pasaje
from apps.encomiendas.models import Encomienda
from apps.seguridad.views import registrar_bitacora

class EstadisticasViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        return self.agruparDatosConsolidados(request)

    def agruparDatosConsolidados(self, request):
        pasajes = Pasaje.objects.all()
        encomiendas = Encomienda.objects.all()

        ingresos_totales = self.calcularIngresosTotales(pasajes, encomiendas)

        # Auditoría limpia sin alterar la bitácora
        registrar_bitacora(
            usuario=request.user.username,
            accion='ver_reporte',
            modulo='reportes',
            descripcion='Consultó estadísticas consolidadas',
            request=request
        )

        return Response({
            "total_pasajes_vendidos": pasajes.count(),
            "ingresos_pasajes": sum(float(p.precio_final or 0) for p in pasajes),
            "total_encomiendas_enviadas": encomiendas.count(),
            "ingresos_encomiendas": sum(float(e.precio_total or 0) for e in encomiendas),
            "ingresos_totales": ingresos_totales,
        })

    def calcularIngresosTotales(self, pasajes, encomiendas):
        ingresos_pasajes = sum(float(p.precio_final or 0) for p in pasajes)
        ingresos_encomiendas = sum(float(e.precio_total or 0) for e in encomiendas)
        return ingresos_pasajes + ingresos_encomiendas
