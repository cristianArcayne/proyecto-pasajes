from django.db import models
from django.contrib.auth.models import User


class Asiento(models.Model):
    pk = models.CompositePrimaryKey('nro_asiento', 'placa')
    nro_asiento = models.IntegerField()
    placa = models.ForeignKey('Flota', models.DO_NOTHING, db_column='placa')
    piso = models.IntegerField(blank=True, null=True)
    class Meta:
        managed = False
        db_table = 'asiento'

class Cliente(models.Model):
    ci = models.IntegerField(primary_key=True)
    nombre = models.CharField(max_length=60)
    telefono = models.CharField(max_length=20)
    class Meta:
        managed = False
        db_table = 'cliente'

class Conductor(models.Model):
    ci = models.IntegerField(primary_key=True)
    nombre = models.CharField(max_length=100)
    telefono = models.CharField(max_length=20)
    edad = models.IntegerField()
    licencia = models.CharField(max_length=50)
    class Meta:
        managed = False
        db_table = 'conductor'

class DetalleVenta(models.Model):
    id_detalle_venta = models.IntegerField(primary_key=True)
    nr_factura = models.ForeignKey('Factura', models.DO_NOTHING, db_column='nr_factura', blank=True, null=True)
    cantidad = models.IntegerField(blank=True, null=True)
    subtotal = models.IntegerField(blank=True, null=True)
    class Meta:
        managed = False
        db_table = 'detalle_venta'

class Encomienda(models.Model):
    nro_encomienda = models.IntegerField(primary_key=True)
    peso_kg = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    precio_total = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    descripcion_carga = models.CharField(max_length=200, blank=True, null=True)
    ci_remitente = models.ForeignKey(Cliente, models.DO_NOTHING, db_column='ci_remitente', blank=True, null=True)
    id_encomienda = models.ForeignKey('TipoEncomienda', models.DO_NOTHING, db_column='id_encomienda', blank=True, null=True)
    id_viaje = models.ForeignKey('Viaje', models.DO_NOTHING, db_column='id_viaje', blank=True, null=True)
    id_detalle_venta = models.ForeignKey(DetalleVenta, models.DO_NOTHING, db_column='id_detalle_venta', blank=True, null=True)
    class Meta:
        managed = False
        db_table = 'encomienda'

class Estado(models.Model):
    id_estado = models.IntegerField(primary_key=True)
    nombre_estado = models.CharField(max_length=100)
    class Meta:
        managed = False
        db_table = 'estado'

class Factura(models.Model):
    nr_factura = models.IntegerField(primary_key=True)
    fecha_emision = models.DateField()
    total_factura = models.IntegerField()
    ci_cliente = models.ForeignKey(Cliente, models.DO_NOTHING, db_column='ci_cliente', blank=True, null=True)
    class Meta:
        managed = False
        db_table = 'factura'

class Flota(models.Model):
    placa = models.CharField(primary_key=True, max_length=20)
    modelo = models.CharField(max_length=50, blank=True, null=True)
    capacidad_asientos = models.IntegerField(blank=True, null=True)
    id_estado = models.ForeignKey(Estado, models.DO_NOTHING, db_column='id_estado', blank=True, null=True)
    class Meta:
        managed = False
        db_table = 'flota'

class HistorialPrecios(models.Model):
    id_historial = models.AutoField(primary_key=True)
    id_ruta = models.IntegerField(blank=True, null=True)
    precio_viejo = models.IntegerField(blank=True, null=True)
    precio_nuevo = models.IntegerField(blank=True, null=True)
    fecha_cambio = models.DateTimeField(blank=True, null=True)
    class Meta:
        managed = False
        db_table = 'historial_precios'

class Pasaje(models.Model):
    id_pasaje = models.AutoField(primary_key=True)
    precio_final = models.IntegerField(blank=True, null=True)
    estado_pasaje = models.CharField(max_length=20, blank=True, null=True)
    nombre_pasajero = models.CharField(max_length=100)
    ci_pasajero = models.IntegerField(blank=True, null=True)
    telefono_pasajero = models.CharField(max_length=20)
    id_tipo = models.ForeignKey('TipoPasajero', models.DO_NOTHING, db_column='id_tipo', blank=True, null=True)
    id_viaje = models.ForeignKey('Viaje', models.DO_NOTHING, db_column='id_viaje', blank=True, null=True)
    nro_asiento = models.IntegerField(blank=True, null=True)
    placa_bus = models.CharField(max_length=20, blank=True, null=True)
    id_detalle_venta = models.ForeignKey(DetalleVenta, models.DO_NOTHING, db_column='id_detalle_venta', blank=True, null=True)
    class Meta:
        managed = False
        db_table = 'pasaje'
        unique_together = (('id_viaje', 'nro_asiento', 'placa_bus'),)

class Rutas(models.Model):
    id_ruta = models.IntegerField(primary_key=True)
    origen = models.CharField(max_length=100)
    destino = models.CharField(max_length=100)
    precio_ruta = models.IntegerField(blank=True, null=True)
    class Meta:
        managed = False
        db_table = 'rutas'

class TipoEncomienda(models.Model):
    id_encomienda = models.IntegerField(primary_key=True)
    descripcion = models.CharField(max_length=100, blank=True, null=True)
    precio_inicial = models.IntegerField(blank=True, null=True)
    class Meta:
        managed = False
        db_table = 'tipo_encomienda'

class TipoPasajero(models.Model):
    id_tipo = models.IntegerField(primary_key=True)
    nombre_tipo = models.CharField(max_length=40)
    class Meta:
        managed = False
        db_table = 'tipo_pasajero'

class Viaje(models.Model):
    id_viaje = models.IntegerField(primary_key=True)
    fecha = models.DateField()
    hora = models.TimeField()
    id_ruta = models.ForeignKey(Rutas, models.DO_NOTHING, db_column='id_ruta', blank=True, null=True)
    placa = models.ForeignKey(Flota, models.DO_NOTHING, db_column='placa', blank=True, null=True)
    class Meta:
        managed = False
        db_table = 'viaje'

class ViajeConductor(models.Model):
    pk = models.CompositePrimaryKey('id_viaje', 'ci_conductor')
    id_viaje = models.ForeignKey(Viaje, models.DO_NOTHING, db_column='id_viaje')
    ci_conductor = models.ForeignKey(Conductor, models.DO_NOTHING, db_column='ci_conductor')
    class Meta:
        managed = False
        db_table = 'viaje_conductor'


# ──────────────────────────────────────────


class PerfilAdmin(models.Model):
    ROL_CHOICES = [
        ('superusuario', 'Super Usuario'),
        ('subusuario', 'Sub Usuario'),
    ]
    usuario              = models.OneToOneField(User, on_delete=models.CASCADE)
    rol                  = models.CharField(max_length=20, choices=ROL_CHOICES, default='subusuario')
    correo_recuperacion  = models.EmailField(blank=True, null=True)
    es_password_temporal = models.BooleanField(default=True)
    intentos_fallidos    = models.IntegerField(default=0)
    bloqueado            = models.BooleanField(default=False)
    token_recuperacion   = models.CharField(max_length=100, blank=True, null=True)
    token_expira         = models.DateTimeField(blank=True, null=True)
    # Permisos granulares por módulo
    # Ejemplo: {"clientes": {"ver": true, "crear": false, "modificar": true, "eliminar": false}}
    permisos             = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = 'perfil_admin'

    def __str__(self):
        return f"{self.usuario.username} ({self.rol})"

    def tiene_permiso(self, modulo, accion):
        if self.rol == 'superusuario':
            return True
        return self.permisos.get(modulo, {}).get(accion, False)


class Bitacora(models.Model):
    usuario    = models.CharField(max_length=150)
    accion     = models.CharField(max_length=20)   # login, logout, ver, crear, modificar, eliminar
    modulo     = models.CharField(max_length=20)   # auth, clientes, buses, choferes, viajes, usuarios
    descripcion= models.TextField(blank=True)
    fecha_hora = models.DateTimeField(auto_now_add=True)
    ip         = models.CharField(max_length=50, blank=True)

    class Meta:
        db_table = 'bitacora'
        ordering = ['-fecha_hora']

    def __str__(self):
        return f"{self.usuario} | {self.accion} | {self.modulo} | {self.fecha_hora}"
