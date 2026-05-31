from rest_framework import serializers
from .models import Cliente, Pasaje, Viaje, Flota, DetalleVenta, Encomienda, Conductor

class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = "__all__"

class FlotaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Flota
        fields = "__all__"

class ViajeSerializer(serializers.ModelSerializer):
    fecha  = serializers.DateField()
    hora   = serializers.TimeField()
    class Meta:
        model = Viaje
        fields = "__all__"

class PasajeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pasaje
        fields = "__all__"

class DetalleVentaSerializer(serializers.ModelSerializer):
    class Meta:
        model = DetalleVenta
        fields = "__all__"

class EncomiendaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Encomienda
        fields = "__all__"


class ConductorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Conductor
        fields = "__all__"
