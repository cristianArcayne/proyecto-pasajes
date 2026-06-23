import random
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Encomienda, Tipo_Encomienda
from .serializers import EncomiendaSerializer

from apps.seguridad.views import registrar_bitacora, verificar_permiso

class RegistroEncomiendaViewSet(viewsets.ModelViewSet):
    queryset = Encomienda.objects.all()
    serializer_class = EncomiendaSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        if not verificar_permiso(request.user, 'encomiendas', 'crear'):
            return Response({"mensaje": "Sin permiso para registrar encomiendas."}, status=403)
        # Lógica de cálculo y guía
        peso_kg = request.data.get("peso_kg")
        tipo_base_id = request.data.get("id_encomienda")
        
        try:
            peso_kg = float(peso_kg)
        except (ValueError, TypeError):
            return Response({"mensaje": "Peso inválido"}, status=400)

        precio_calculado = self.calcularCostoPorPeso(peso_kg, tipo_base_id)
        nro_guia = self.generarNumeroGuia()

        request.data["precio_total"] = precio_calculado
        request.data["nro_encomienda"] = nro_guia

        response = super().create(request, *args, **kwargs)
        if response.status_code == 201:
            registrar_bitacora(request.user.username, 'crear', 'encomiendas', f'Registró encomienda Guía={nro_guia}', request)
        return response

    def calcularCostoPorPeso(self, peso_kg, tipo_base_id=None):
        base = 15
        if tipo_base_id:
            try:
                tipo = Tipo_Encomienda.objects.get(id_encomienda=tipo_base_id)
                base = tipo.precio_inicial or 15
            except Tipo_Encomienda.DoesNotExist:
                pass
        return base + (peso_kg * 3)

    def generarNumeroGuia(self):
        # Generar número de guía único de 6 dígitos
        while True:
            nro = random.randint(100000, 999999)
            if not Encomienda.objects.filter(nro_encomienda=nro).exists():
                return nro


class GestionEncomiendaViewSet(RegistroEncomiendaViewSet):
    def list(self, request, *args, **kwargs):
        if not verificar_permiso(request.user, 'encomiendas', 'ver'):
            return Response({"mensaje": "Sin permiso para ver encomiendas."}, status=403)
        registrar_bitacora(request.user.username, 'ver', 'encomiendas', 'Listó encomiendas', request)
        return super().list(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if not verificar_permiso(request.user, 'encomiendas', 'eliminar'):
            return Response({"mensaje": "Sin permiso para eliminar encomiendas."}, status=403)
        nro = kwargs.get("pk")
        registrar_bitacora(request.user.username, 'eliminar', 'encomiendas', f'Anuló encomienda Guía={nro}', request)
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'], url_path='actualizar-estado')
    def actualizarEstadoLogistico(self, request, pk=None):
        # Simulación de actualización de estado logístico en tránsito / arribado
        registrar_bitacora(request.user.username, 'modificar', 'encomiendas', f'Actualizó estado de encomienda Guía={pk}', request)
        return Response({"mensaje": "Estado logístico de la encomienda actualizado correctamente."})

    @action(detail=True, methods=['post'], url_path='validar-entrega')
    def validarEntrega(self, request, pk=None):
        # Simulación de validación de entrega al destinatario con firma
        registrar_bitacora(request.user.username, 'modificar', 'encomiendas', f'Validó entrega de encomienda Guía={pk}', request)
        return Response({"mensaje": "Entrega de la encomienda validada con éxito."})
