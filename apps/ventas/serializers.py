from rest_framework import serializers
from .models import Cliente, Pasaje, DetalleVenta, TipoPasajero

class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = "__all__"

class PasajeSerializer(serializers.ModelSerializer):
    precio = serializers.IntegerField(source='precio_final', read_only=True)
    fecha_viaje = serializers.SerializerMethodField()
    origen = serializers.SerializerMethodField()
    destino = serializers.SerializerMethodField()
    nro_factura = serializers.SerializerMethodField()

    class Meta:
        model = Pasaje
        fields = "__all__"

    def get_fecha_viaje(self, obj):
        if obj.id_viaje:
            return obj.id_viaje.fecha.strftime("%Y-%m-%d")
        return ""

    def get_origen(self, obj):
        if obj.id_viaje and obj.id_viaje.id_ruta:
            return obj.id_viaje.id_ruta.origen
        return ""

    def get_destino(self, obj):
        if obj.id_viaje and obj.id_viaje.id_ruta:
            return obj.id_viaje.id_ruta.destino
        return ""

    def get_nro_factura(self, obj):
        if obj.id_detalle_venta and obj.id_detalle_venta.nr_factura:
            return obj.id_detalle_venta.nr_factura.nr_factura
        return None

class DetalleVentaSerializer(serializers.ModelSerializer):
    class Meta:
        model = DetalleVenta
        fields = "__all__"

class TipoPasajeroSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoPasajero
        fields = "__all__"
