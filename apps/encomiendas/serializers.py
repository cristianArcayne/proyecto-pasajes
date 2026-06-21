from rest_framework import serializers
from .models import Encomienda, Tipo_Encomienda

class Tipo_EncomiendaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tipo_Encomienda
        fields = "__all__"

class EncomiendaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Encomienda
        fields = "__all__"
