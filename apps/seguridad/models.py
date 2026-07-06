from django.db import models
from django.contrib.auth.models import User

class Rol(models.Model):
    nombre = models.CharField(max_length=50, primary_key=True)
    descripcion = models.TextField(blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'rol'

    def __str__(self):
        return self.nombre


class Usuario(User):
    class Meta:
        proxy = True

    def verificarCredenciales(self, password):
        return self.check_password(password)


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
    bloqueado_hasta      = models.DateTimeField(blank=True, null=True)
    nivel_bloqueo        = models.PositiveIntegerField(default=0)
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


class BitacoraSesion(models.Model):
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

    @classmethod
    def registrarIngreso(cls, usuario, ip, descripcion=""):
        return cls.objects.create(
            usuario=usuario,
            accion='login',
            modulo='auth',
            descripcion=descripcion,
            ip=ip
        )
