from django.db import models

class Tipo_Encomienda(models.Model):
    id_encomienda = models.IntegerField(primary_key=True)
    descripcion = models.CharField(max_length=100, blank=True, null=True)
    precio_inicial = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'tipo_encomienda'

    def __str__(self):
        return self.descripcion or f"Tipo #{self.id_encomienda}"


class Encomienda(models.Model):
    nro_encomienda = models.IntegerField(primary_key=True)
    peso_kg = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    precio_total = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    descripcion_carga = models.CharField(max_length=200, blank=True, null=True)
    ci_remitente = models.ForeignKey('logistica.Pasajero', models.DO_NOTHING, db_column='ci_remitente', blank=True, null=True)
    id_encomienda = models.ForeignKey(Tipo_Encomienda, models.DO_NOTHING, db_column='id_encomienda', blank=True, null=True)
    id_viaje = models.ForeignKey('logistica.Horario', models.DO_NOTHING, db_column='id_viaje', blank=True, null=True)
    id_detalle_venta = models.ForeignKey('ventas.DetalleVenta', models.DO_NOTHING, db_column='id_detalle_venta', blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'encomienda'
