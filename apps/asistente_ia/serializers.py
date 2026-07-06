from rest_framework import serializers
from .models import BitacoraAsistenteIA


class BitacoraAsistenteIASerializer(serializers.ModelSerializer):
    usuario = serializers.CharField(source="usuario.username", read_only=True)

    class Meta:
        model = BitacoraAsistenteIA
        fields = ("id_consulta", "usuario", "consulta", "respuesta",
                  "tipo_consulta", "fecha_hora")
        read_only_fields = fields
