from rest_framework import serializers
from .models import PerfilAdmin, BitacoraSesion, Usuario

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id', 'username', 'email']

class PerfilAdminSerializer(serializers.ModelSerializer):
    usuario = UsuarioSerializer()
    class Meta:
        model = PerfilAdmin
        fields = '__all__'
