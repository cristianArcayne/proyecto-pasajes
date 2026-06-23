import os
import sys
import shutil
import pathlib

# 1. Definir rutas
project_path = pathlib.Path(r"c:\Users\Cristian Arcayne\Downloads\Proyecto de SI1\proyecto-pasajes-master\proyecto-pasajes-master")
db_path = project_path / 'db.sqlite3'
apps_path = project_path / 'apps'

# 2. Borrar base de datos local
if db_path.exists():
    print(f"Eliminando {db_path}...")
    db_path.unlink()

# 3. Eliminar archivos de migración (excepto __init__.py)
for migration_file in apps_path.glob('**/migrations/*.py'):
    if migration_file.name != '__init__.py':
        print(f"Eliminando migración: {migration_file}")
        migration_file.unlink()

# 4. Eliminar directorios __pycache__ de migraciones
for pycache_dir in apps_path.glob('**/migrations/__pycache__'):
    print(f"Eliminando cache de migraciones: {pycache_dir}")
    shutil.rmtree(pycache_dir)

# 5. Inicializar Django y ejecutar comandos
sys.path.append(str(project_path))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Principal.settings')

# Limpiar variables de entorno para forzar SQLite local
if 'DATABASE_URL' in os.environ:
    del os.environ['DATABASE_URL']

import django
django.setup()

from django.core.management import call_command
from django.contrib.auth.models import User
from apps.seguridad.models import PerfilAdmin, Rol
from apps.logistica.models import Estado, Bus, Ruta, Conductor, Horario, Pasajero, Asiento
from apps.ventas.models import TipoPasajero
from apps.encomiendas.models import Tipo_Encomienda, Encomienda

print("\n--- Generando nuevas migraciones limpias ---")
call_command('makemigrations')

print("\n--- Ejecutando migraciones en SQLite ---")
call_command('migrate')

print("\n--- Creando Superusuario ---")
username = "admin"
password = "admin123"
email = "admin@example.com"

user, created = User.objects.get_or_create(username=username, defaults={"email": email, "is_superuser": True, "is_staff": True})
user.set_password(password)
user.is_superuser = True
user.is_staff = True
user.save()

# Asegurar PerfilAdmin
perfil, _ = PerfilAdmin.objects.get_or_create(usuario=user)
perfil.rol = 'superusuario'
perfil.bloqueado = False
perfil.intentos_fallidos = 0
perfil.es_password_temporal = False
perfil.save()

print(f"Usuario: {username} | Contrasena: {password}")

print("\n--- Insertando Datos de Prueba (Seeding) ---")

# 1. Roles
Rol.objects.get_or_create(nombre="superusuario", defaults={"descripcion": "Super Administrador"})
Rol.objects.get_or_create(nombre="subusuario", defaults={"descripcion": "Operador regular"})

# 2. Estados
est_activo, _ = Estado.objects.get_or_create(id_estado=1, defaults={"nombre_estado": "Activo"})
Estado.objects.get_or_create(id_estado=2, defaults={"nombre_estado": "Mantenimiento"})

# 3. Buses
bus1, _ = Bus.objects.get_or_create(placa="1234ABC", defaults={"modelo": "Scania Paradiso", "capacidad_asientos": 40, "id_estado": est_activo})
bus2, _ = Bus.objects.get_or_create(placa="5678XYZ", defaults={"modelo": "Mercedes-Benz", "capacidad_asientos": 40, "id_estado": est_activo})

# Crear algunos asientos para los buses
for i in range(1, 41):
    Asiento.objects.get_or_create(nro_asiento=i, placa=bus1, defaults={"piso": 1})
    Asiento.objects.get_or_create(nro_asiento=i, placa=bus2, defaults={"piso": 1})

# 4. Rutas
ruta1, _ = Ruta.objects.get_or_create(id_ruta=1, defaults={"origen": "La Paz", "destino": "Cochabamba", "precio_ruta": 60})
ruta2, _ = Ruta.objects.get_or_create(id_ruta=2, defaults={"origen": "Cochabamba", "destino": "Santa Cruz", "precio_ruta": 80})
ruta3, _ = Ruta.objects.get_or_create(id_ruta=3, defaults={"origen": "La Paz", "destino": "Santa Cruz", "precio_ruta": 120})

# 5. Conductores
cond1, _ = Conductor.objects.get_or_create(ci=1234567, defaults={"nombre": "Juan Perez Ramos", "telefono": "76543210", "edad": 38, "licencia": "Categoría C"})
cond2, _ = Conductor.objects.get_or_create(ci=7654321, defaults={"nombre": "Marcos Gomez Silva", "telefono": "65432100", "edad": 42, "licencia": "Categoría C"})

# 6. Viajes (Horarios)
import datetime
hoy = datetime.date.today()
viaje1, _ = Horario.objects.get_or_create(id_viaje=1, defaults={"fecha": hoy, "hora": datetime.time(8, 0), "id_ruta": ruta1, "placa": bus1})
viaje2, _ = Horario.objects.get_or_create(id_viaje=2, defaults={"fecha": hoy + datetime.timedelta(days=1), "hora": datetime.time(14, 0), "id_ruta": ruta2, "placa": bus2})
viaje3, _ = Horario.objects.get_or_create(id_viaje=3, defaults={"fecha": hoy + datetime.timedelta(days=2), "hora": datetime.time(20, 0), "id_ruta": ruta3, "placa": bus1})

# 7. Clientes (Pasajeros)
p1, _ = Pasajero.objects.get_or_create(ci=11065474, defaults={"nombre": "Carlos Perez Torrez", "telefono": "71122334", "comentario": "Pasajero frecuente"})
p2, _ = Pasajero.objects.get_or_create(ci=8888888, defaults={"nombre": "Ana Maria Lopez", "telefono": "60055443", "comentario": ""})

# 8. Tipos de Pasajero
TipoPasajero.objects.get_or_create(id_tipo=1, defaults={"nombre_tipo": "Normal"})
TipoPasajero.objects.get_or_create(id_tipo=2, defaults={"nombre_tipo": "Estudiante"})
TipoPasajero.objects.get_or_create(id_tipo=3, defaults={"nombre_tipo": "Adulto Mayor"})

# 9. Tipos de Encomienda
t1, _ = Tipo_Encomienda.objects.get_or_create(id_encomienda=1, defaults={"descripcion": "Sobre / Documentos", "precio_inicial": 15})
t2, _ = Tipo_Encomienda.objects.get_or_create(id_encomienda=2, defaults={"descripcion": "Caja Mediana", "precio_inicial": 30})
t3, _ = Tipo_Encomienda.objects.get_or_create(id_encomienda=3, defaults={"descripcion": "Carga Grande / Pesada", "precio_inicial": 60})

# 10. Encomiendas de muestra
Encomienda.objects.get_or_create(
    nro_encomienda=100201,
    defaults={
        "peso_kg": 5.50,
        "precio_total": 31.50,
        "descripcion_carga": "Caja con repuestos mecánicos",
        "ci_remitente": p1,
        "id_encomienda": t2,
        "id_viaje": viaje1
    }
)
Encomienda.objects.get_or_create(
    nro_encomienda=100202,
    defaults={
        "peso_kg": 1.20,
        "precio_total": 18.60,
        "descripcion_carga": "Sobre con documentos notariales",
        "ci_remitente": p2,
        "id_encomienda": t1,
        "id_viaje": viaje2
    }
)
Encomienda.objects.get_or_create(
    nro_encomienda=100203,
    defaults={
        "peso_kg": 25.00,
        "precio_total": 135.00,
        "descripcion_carga": "Caja grande de ropa",
        "ci_remitente": p1,
        "id_encomienda": t3,
        "id_viaje": viaje1
    }
)

print("\nBase de datos SQLite recreada e inicializada con datos de prueba de forma exitosa!")
