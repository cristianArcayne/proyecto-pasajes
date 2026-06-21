from rest_framework import serializers
from .models import Bus, Ruta, Conductor, Horario, Pasajero

class BusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bus
        fields = "__all__"

class RutaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ruta
        fields = "__all__"

class ConductorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Conductor
        fields = "__all__"

class HorarioSerializer(serializers.ModelSerializer):
    fecha  = serializers.DateField()
    hora   = serializers.TimeField()
    class Meta:
        model = Horario
        fields = "__all__"

class PasajeroSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pasajero
        fields = "__all__"
