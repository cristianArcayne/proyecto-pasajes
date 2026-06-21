from rest_framework import serializers
from .models import Cliente, Pasaje, DetalleVenta, TipoPasajero

class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = "__all__"

class PasajeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pasaje
        fields = "__all__"

class DetalleVentaSerializer(serializers.ModelSerializer):
    class Meta:
        model = DetalleVenta
        fields = "__all__"

class TipoPasajeroSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoPasajero
        fields = "__all__"
