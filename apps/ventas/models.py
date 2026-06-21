from django.db import models

# Importar y alinear entidades de logística requeridas
from apps.logistica.models import Horario as Viaje
from apps.logistica.models import Asiento
from apps.logistica.models import Pasajero as Cliente

class Factura(models.Model):
    nr_factura = models.IntegerField(primary_key=True)
    fecha_emision = models.DateField()
    total_factura = models.IntegerField()
    ci_cliente = models.ForeignKey(Cliente, models.DO_NOTHING, db_column='ci_cliente', blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'factura'


class DetalleVenta(models.Model):
    id_detalle_venta = models.IntegerField(primary_key=True)
    nr_factura = models.ForeignKey(Factura, models.DO_NOTHING, db_column='nr_factura', blank=True, null=True)
    cantidad = models.IntegerField(blank=True, null=True)
    subtotal = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'detalle_venta'


class TipoPasajero(models.Model):
    id_tipo = models.IntegerField(primary_key=True)
    nombre_tipo = models.CharField(max_length=40)

    class Meta:
        managed = True
        db_table = 'tipo_pasajero'

    def __str__(self):
        return self.nombre_tipo


class Pasaje(models.Model):
    id_pasaje = models.AutoField(primary_key=True)
    precio_final = models.IntegerField(blank=True, null=True)
    estado_pasaje = models.CharField(max_length=20, blank=True, null=True)
    nombre_pasajero = models.CharField(max_length=100)
    ci_pasajero = models.IntegerField(blank=True, null=True)
    telefono_pasajero = models.CharField(max_length=20)
    id_tipo = models.ForeignKey(TipoPasajero, models.DO_NOTHING, db_column='id_tipo', blank=True, null=True)
    id_viaje = models.ForeignKey(Viaje, models.DO_NOTHING, db_column='id_viaje', blank=True, null=True)
    nro_asiento = models.IntegerField(blank=True, null=True)
    placa_bus = models.CharField(max_length=20, blank=True, null=True)
    id_detalle_venta = models.ForeignKey(DetalleVenta, models.DO_NOTHING, db_column='id_detalle_venta', blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'pasaje'
        unique_together = (('id_viaje', 'nro_asiento', 'placa_bus'),)
