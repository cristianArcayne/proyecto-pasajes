from django.conf import settings
from django.db import models


class BitacoraAsistenteIA(models.Model):
    id_consulta = models.AutoField(primary_key=True)
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT,
                                related_name="consultas_asistente_ia")
    consulta = models.TextField()
    respuesta = models.TextField()
    tipo_consulta = models.CharField(max_length=20)
    fecha_hora = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "bitacora_asistente_ia"
        ordering = ["-fecha_hora"]

    def __str__(self):
        return f"{self.usuario.username} | {self.tipo_consulta} | {self.fecha_hora}"
