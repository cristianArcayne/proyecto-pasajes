from django.db import models

class Estado(models.Model):
    id_estado = models.IntegerField(primary_key=True)
    nombre_estado = models.CharField(max_length=100)
    class Meta:
        managed = False
        db_table = 'estado'


class Flota(models.Model):
    placa = models.CharField(primary_key=True, max_length=20)
    modelo = models.CharField(max_length=50, blank=True, null=True)
    capacidad_asientos = models.IntegerField(blank=True, null=True)
    id_estado = models.ForeignKey(Estado, models.DO_NOTHING, db_column='id_estado', blank=True, null=True)
    class Meta:
        managed = False
        db_table = 'flota'


class Rutas(models.Model):
    id_ruta = models.IntegerField(primary_key=True)
    origen = models.CharField(max_length=100)
    destino = models.CharField(max_length=100)
    precio_ruta = models.IntegerField(blank=True, null=True)
    class Meta:
        managed = False
        db_table = 'rutas'


class Conductor(models.Model):
    ci = models.IntegerField(primary_key=True)
    nombre = models.CharField(max_length=100)
    telefono = models.CharField(max_length=20)
    edad = models.IntegerField()
    licencia = models.CharField(max_length=50)
    class Meta:
        managed = False
        db_table = 'conductor'


class Viaje(models.Model):
    id_viaje = models.IntegerField(primary_key=True)
    fecha = models.DateField()
    hora = models.TimeField()
    id_ruta = models.ForeignKey(Rutas, models.DO_NOTHING, db_column='id_ruta', blank=True, null=True)
    placa = models.ForeignKey(Flota, models.DO_NOTHING, db_column='placa', blank=True, null=True)
    class Meta:
        managed = False
        db_table = 'viaje'


class Asiento(models.Model):
    pk = models.CompositePrimaryKey('nro_asiento', 'placa')
    nro_asiento = models.IntegerField()
    placa = models.ForeignKey(Flota, models.DO_NOTHING, db_column='placa')
    piso = models.IntegerField(blank=True, null=True)
    class Meta:
        managed = False
        db_table = 'asiento'


class TipoEncomienda(models.Model):
    id_encomienda = models.IntegerField(primary_key=True)
    descripcion = models.CharField(max_length=100, blank=True, null=True)
    precio_inicial = models.IntegerField(blank=True, null=True)
    class Meta:
        managed = False
        db_table = 'tipo_encomienda'


class Encomienda(models.Model):
    nro_encomienda = models.IntegerField(primary_key=True)
    peso_kg = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    precio_total = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    descripcion_carga = models.CharField(max_length=200, blank=True, null=True)
    # ci_remitente de tipo Cliente (que está en venta) se referencia como string
    ci_remitente = models.ForeignKey('venta.Cliente', models.DO_NOTHING, db_column='ci_remitente', blank=True, null=True)
    id_encomienda = models.ForeignKey(TipoEncomienda, models.DO_NOTHING, db_column='id_encomienda', blank=True, null=True)
    id_viaje = models.ForeignKey(Viaje, models.DO_NOTHING, db_column='id_viaje', blank=True, null=True)
    # id_detalle_venta de tipo DetalleVenta (que está en venta) se referencia como string
    id_detalle_venta = models.ForeignKey('venta.DetalleVenta', models.DO_NOTHING, db_column='id_detalle_venta', blank=True, null=True)
    class Meta:
        managed = False
        db_table = 'encomienda'


class ViajeConductor(models.Model):
    pk = models.CompositePrimaryKey('id_viaje', 'ci_conductor')
    id_viaje = models.ForeignKey(Viaje, models.DO_NOTHING, db_column='id_viaje')
    ci_conductor = models.ForeignKey(Conductor, models.DO_NOTHING, db_column='ci_conductor')
    class Meta:
        managed = False
        db_table = 'viaje_conductor'
