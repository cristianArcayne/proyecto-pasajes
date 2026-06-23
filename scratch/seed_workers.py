import os
import sys
import django

# Configurar Django
project_path = r"c:\Users\Cristian Arcayne\Downloads\Proyecto de SI1\proyecto-pasajes-master\proyecto-pasajes-master"
sys.path.append(project_path)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Principal.settings')
django.setup()

from django.contrib.auth.models import User
from apps.seguridad.models import PerfilAdmin

print("Insertando Trabajadores de Prueba...")

trabajadores = [
    {
        "username": "juan_ventas",
        "email": "juan@example.com",
        "password": "operador123",
        "permisos": {
            "clientes": {"ver": True, "crear": True, "modificar": True, "eliminar": False},
            "buses": {"ver": True, "crear": False, "modificar": False, "eliminar": False},
            "choferes": {"ver": True, "crear": False, "modificar": False, "eliminar": False},
            "viajes": {"ver": True, "crear": False, "modificar": False, "eliminar": False},
            "ventas": {"ver": True, "crear": True, "modificar": True, "eliminar": True},
            "encomiendas": {"ver": False, "crear": False, "modificar": False, "eliminar": False},
            "reportes": {"ver": False},
            "bitacora": {"ver": False},
        }
    },
    {
        "username": "maria_carga",
        "email": "maria@example.com",
        "password": "operador123",
        "permisos": {
            "clientes": {"ver": True, "crear": True, "modificar": False, "eliminar": False},
            "buses": {"ver": True, "crear": True, "modificar": True, "eliminar": False},
            "choferes": {"ver": True, "crear": True, "modificar": True, "eliminar": False},
            "viajes": {"ver": True, "crear": True, "modificar": True, "eliminar": False},
            "ventas": {"ver": False, "crear": False, "modificar": False, "eliminar": False},
            "encomiendas": {"ver": True, "crear": True, "modificar": True, "eliminar": True},
            "reportes": {"ver": True},
            "bitacora": {"ver": False},
        }
    }
]

for t in trabajadores:
    user, created = User.objects.get_or_create(
        username=t["username"],
        defaults={"email": t["email"], "is_staff": True}
    )
    user.set_password(t["password"])
    user.save()
    
    perfil, _ = PerfilAdmin.objects.update_or_create(
        usuario=user,
        defaults={
            "rol": "subusuario",
            "es_password_temporal": False,
            "correo_recuperacion": t["email"],
            "permisos": t["permisos"],
            "bloqueado": False,
            "intentos_fallidos": 0
        }
    )
    print(f"Creado/Actualizado trabajador: {t['username']} | Contrasena: {t['password']}")

print("Trabajadores creados con exito!")
