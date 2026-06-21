from django.db import models

class Estado(models.Model):
    id_estado = models.IntegerField(primary_key=True)
    nombre_estado = models.CharField(max_length=100)

    class Meta:
        managed = True
        db_table = 'estado'

    def __str__(self):
        return self.nombre_estado


class Bus(models.Model):
    placa = models.CharField(primary_key=True, max_length=20)
    modelo = models.CharField(max_length=50, blank=True, null=True)
    capacidad_asientos = models.IntegerField(blank=True, null=True)
    id_estado = models.ForeignKey(Estado, models.DO_NOTHING, db_column='id_estado', blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'flota'

    def __str__(self):
        return f"{self.placa} ({self.modelo})"


class Ruta(models.Model):
    id_ruta = models.IntegerField(primary_key=True)
    origen = models.CharField(max_length=100)
    destino = models.CharField(max_length=100)
    precio_ruta = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'rutas'

    def __str__(self):
        return f"{self.origen} - {self.destino}"


class Conductor(models.Model):
    ci = models.IntegerField(primary_key=True)
    nombre = models.CharField(max_length=100)
    telefono = models.CharField(max_length=20)
    edad = models.IntegerField()
    licencia = models.CharField(max_length=50)

    class Meta:
        managed = True
        db_table = 'conductor'

    def __str__(self):
        return self.nombre


class Horario(models.Model):
    id_viaje = models.IntegerField(primary_key=True)
    fecha = models.DateField()
    hora = models.TimeField()
    id_ruta = models.ForeignKey(Ruta, models.DO_NOTHING, db_column='id_ruta', blank=True, null=True)
    placa = models.ForeignKey(Bus, models.DO_NOTHING, db_column='placa', blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'viaje'

    def __str__(self):
        return f"Viaje #{self.id_viaje} - {self.fecha} {self.hora}"


class Asiento(models.Model):
    id = models.AutoField(primary_key=True)
    nro_asiento = models.IntegerField()
    placa = models.ForeignKey(Bus, models.DO_NOTHING, db_column='placa')
    piso = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'asiento'
        unique_together = (('nro_asiento', 'placa'),)


class Pasajero(models.Model):
    ci = models.IntegerField(primary_key=True)
    nombre = models.CharField(max_length=60)
    telefono = models.CharField(max_length=20)
    comentario = models.TextField(blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'cliente'

    def __str__(self):
        return self.nombre


class ViajeConductor(models.Model):
    id_viaje = models.ForeignKey(Horario, models.DO_NOTHING, db_column='id_viaje', primary_key=True)
    ci_conductor = models.ForeignKey(Conductor, models.DO_NOTHING, db_column='ci_conductor')

    class Meta:
        managed = True
        db_table = 'viaje_conductor'
        unique_together = (('id_viaje', 'ci_conductor'),)
