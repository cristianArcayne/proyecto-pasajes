from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("seguridad", "0001_initial")]

    operations = [
        migrations.AddField(
            model_name="perfiladmin",
            name="bloqueado_hasta",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="perfiladmin",
            name="nivel_bloqueo",
            field=models.PositiveIntegerField(default=0),
        ),
    ]
