import os
import django
import sys
from pathlib import Path

# Obtener directorio del proyecto
BASE_DIR = Path(__file__).resolve().parent.parent

# Renombrar .env temporalmente para evitar que se cargue la URL de PostgreSQL de Render
env_path = BASE_DIR / '.env'
bak_path = BASE_DIR / '.env.bak'

renamed = False
if env_path.exists():
    env_path.rename(bak_path)
    renamed = True

try:
    # Inicializar Django
    sys.path.append(str(BASE_DIR))
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Principal.settings')
    django.setup()

    from django.core.management import call_command
    from django.contrib.auth.models import User
    from apps.seguridad.models import PerfilAdmin

    print("1. Ejecutando migraciones locales en SQLite...")
    call_command('migrate')

    print("\n2. Creando superusuario de administración...")
    username = "admin"
    password = "admin123"
    email = "admin@example.com"

    user, created = User.objects.get_or_create(username=username, defaults={"email": email, "is_superuser": True, "is_staff": True})
    user.set_password(password)
    user.is_superuser = True
    user.is_staff = True
    user.save()

    # Asegurar registro de PerfilAdmin como superusuario
    perfil, _ = PerfilAdmin.objects.get_or_create(usuario=user)
    perfil.rol = 'superusuario'
    perfil.bloqueado = False
    perfil.intentos_fallidos = 0
    perfil.es_password_temporal = False
    perfil.save()

    print(f"\n✅ Base de datos SQLite inicializada correctamente!")
    print(f"👤 Nombre de usuario: {username}")
    print(f"🔑 Contraseña: {password}")
    print(f"👑 Rol de sistema: {perfil.rol}")

finally:
    # Restaurar archivo .env
    if renamed and bak_path.exists():
        bak_path.rename(env_path)
