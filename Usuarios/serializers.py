from rest_framework import serializers
from .models import Cliente, Pasaje, Viaje, Flota, DetalleVenta, Encomienda

class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = "__all__"

class FlotaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Flota
        fields = "__all__"

class ViajeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Viaje
        fields = "__all__"

class PasajeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pasaje
        fields = "__all__"

class   DetalleVentaSerializer(serializers.ModelSerializer):
    class Meta:
        model = DetalleVenta
        fields = "__all__"

class EncomiendaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Encomienda
        fields = "__all__"