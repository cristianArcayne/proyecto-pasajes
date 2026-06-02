from django.db import connection
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
import uuid
from django.utils import timezone
from datetime import timedelta
from django.core.mail import send_mail
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken

from .models import PerfilAdmin, Bitacora

# ─────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────

def get_ip(request):
    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    return x_forwarded.split(',')[0] if x_forwarded else request.META.get('REMOTE_ADDR', '')


def registrar_bitacora(usuario, accion, modulo, descripcion='', request=None):
    # Omitir el registro de acciones pasivas de visualización ('ver')
    if accion == 'ver':
        return
    ip = get_ip(request) if request else ''
    Bitacora.objects.create(
        usuario=usuario,
        accion=accion,
        modulo=modulo,
        descripcion=descripcion,
        ip=ip,
    )


def es_superusuario(user):
    try:
        return user.perfiladmin.rol == 'superusuario'
    except PerfilAdmin.DoesNotExist:
        return False


def verificar_permiso(user, modulo, accion):
    try:
        return user.perfiladmin.tiene_permiso(modulo, accion)
    except PerfilAdmin.DoesNotExist:
        return False


# ─────────────────────────────────────────────
# AUTH VIEWSETS AND APIS
# ─────────────────────────────────────────────

@api_view(["POST"])
@permission_classes([AllowAny])
def login_admin(request):
    username = request.data.get("username")
    password = request.data.get("password")
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({"mensaje": "Credenciales incorrectas"}, status=401)

    perfil, _ = PerfilAdmin.objects.get_or_create(usuario=user)

    if perfil.bloqueado:
        return Response({"mensaje": "Cuenta bloqueada. Recupera tu contraseña por correo."}, status=403)

    user_auth = authenticate(username=username, password=password)
    if not user_auth:
        perfil.intentos_fallidos += 1
        if perfil.intentos_fallidos >= 3:
            perfil.bloqueado = True
            perfil.save()
            registrar_bitacora(username, 'login', 'auth', 'Cuenta bloqueada por 3 intentos fallidos', request)
            return Response({"mensaje": "Cuenta bloqueada por 3 intentos fallidos."}, status=403)
        perfil.save()
        restantes = 3 - perfil.intentos_fallidos
        return Response({"mensaje": f"Contraseña incorrecta. Te quedan {restantes} intentos."}, status=401)

    perfil.intentos_fallidos = 0
    perfil.save()
    registrar_bitacora(username, 'login', 'auth', 'Inicio de sesión exitoso', request)

    refresh = RefreshToken.for_user(user_auth)
    return Response({
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "es_password_temporal": perfil.es_password_temporal,
        "username": user_auth.username,
        "rol": perfil.rol,
        "permisos": perfil.permisos,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_admin(request):
    registrar_bitacora(request.user.username, 'logout', 'auth', 'Cerró sesión', request)
    return Response({"mensaje": "Sesión cerrada correctamente"})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def cambiar_credenciales(request):
    password_actual = request.data.get("old_password")
    nueva_password = request.data.get("new_password")
    correo = request.data.get("correo")
    user = request.user

    perfil, _ = PerfilAdmin.objects.get_or_create(usuario=user)

    if correo:
        perfil.correo_recuperacion = correo
        user.email = correo
        user.save()
        perfil.save()

    if password_actual and nueva_password:
        if not user.check_password(password_actual):
            return Response({"mensaje": "La contraseña actual no es correcta"}, status=401)
        user.set_password(nueva_password)
        user.save()
        perfil.es_password_temporal = False
        perfil.save()
        registrar_bitacora(user.username, 'modificar', 'auth', 'Cambió su contraseña de forma segura', request)
        return Response({"mensaje": "Contraseña actualizada correctamente"})

    if correo:
        registrar_bitacora(user.username, 'modificar', 'auth', f'Actualizó su correo de recuperación a: {correo}', request)
        return Response({"mensaje": "Correo de recuperación actualizado correctamente"})

    return Response({"mensaje": "No se enviaron datos para actualizar"}, status=400)


@api_view(["POST"])
@permission_classes([AllowAny])
def solicitar_recuperacion(request):
    correo = request.data.get("correo")
    try:
        perfil = PerfilAdmin.objects.get(correo_recuperacion=correo)
    except PerfilAdmin.DoesNotExist:
        try:
            user = User.objects.get(email=correo)
            perfil = user.perfiladmin
        except (User.DoesNotExist, PerfilAdmin.DoesNotExist):
            return Response({"mensaje": "No existe una cuenta con ese correo"}, status=404)
    token = str(uuid.uuid4())
    perfil.token_recuperacion = token
    perfil.token_expira = timezone.now() + timedelta(hours=1)
    perfil.bloqueado = False
    perfil.intentos_fallidos = 0
    perfil.save()
    link = f"http://localhost:3000/reset-password?token={token}"
    send_mail(
        subject="Recuperación de contraseña - Sistema de Pasajes",
        message=f"Haz clic en el siguiente enlace:\n\n{link}\n\nExpira en 1 hora.",
        from_email=None,
        recipient_list=[correo],
    )
    return Response({"mensaje": "Correo de recuperación enviado"})


@api_view(["POST"])
@permission_classes([AllowAny])
def resetear_password(request):
    token          = request.data.get("token")
    nueva_password = request.data.get("nueva_password")
    try:
        perfil = PerfilAdmin.objects.get(token_recuperacion=token)
    except PerfilAdmin.DoesNotExist:
        return Response({"mensaje": "Token inválido"}, status=400)
    if timezone.now() > perfil.token_expira:
        return Response({"mensaje": "El enlace ha expirado"}, status=400)
    perfil.usuario.set_password(nueva_password)
    perfil.usuario.save()
    perfil.token_recuperacion = None
    perfil.token_expira = None
    perfil.bloqueado = False
    perfil.intentos_fallidos = 0
    perfil.save()
    registrar_bitacora(perfil.usuario.username, 'modificar', 'auth', 'Reseteó su contraseña', request)
    return Response({"mensaje": "Contraseña actualizada correctamente"})


# ─────────────────────────────────────────────
# BITÁCORA
# ─────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def obtener_bitacora(request):
    registros = Bitacora.objects.all()[:200]
    data = [
        {
            "usuario":    r.usuario,
            "accion":     r.accion,
            "modulo":     r.modulo,
            "descripcion":r.descripcion,
            "fecha_hora": r.fecha_hora.strftime("%d/%m/%Y %H:%M:%S"),
            "ip":         r.ip,
        }
        for r in registros
    ]
    return Response(data)


# ─────────────────────────────────────────────
# GESTIÓN DE SUBUSUARIOS
# ─────────────────────────────────────────────

PERMISOS_DEFAULT = {
    "clientes": {"ver": False, "crear": False, "modificar": False, "eliminar": False},
    "buses":    {"ver": False, "crear": False, "modificar": False, "eliminar": False},
    "choferes": {"ver": False, "crear": False, "modificar": False, "eliminar": False},
    "viajes":   {"ver": False, "crear": False, "modificar": False, "eliminar": False},
    "ventas":   {"ver": False, "crear": False, "modificar": False, "eliminar": False},
}


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def listar_subusuarios(request):
    if not es_superusuario(request.user):
        return Response({"mensaje": "Solo el superusuario puede gestionar usuarios."}, status=403)
    perfiles = PerfilAdmin.objects.select_related('usuario').filter(rol='subusuario')
    data = [{
        "id":                  p.usuario.id,
        "username":            p.usuario.username,
        "email":               p.usuario.email,
        "bloqueado":           p.bloqueado,
        "es_password_temporal":p.es_password_temporal,
        "permisos":            p.permisos,
    } for p in perfiles]
    return Response(data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def crear_subusuario(request):
    if request.user.perfiladmin.rol != 'superusuario':
        return Response({"mensaje": "Acceso denegado. Solo el superusuario puede crear cuentas."}, status=403)

    username = request.data.get("username")
    password = request.data.get("password")
    email    = request.data.get("email", "")
    permisos_recibidos = request.data.get("permisos") 

    if not username or not password:
        return Response({"mensaje": "Usuario y contraseña son obligatorios."}, status=400)
    
    if User.objects.filter(username=username).exists():
        return Response({"mensaje": "Este nombre de usuario ya está registrado."}, status=400)

    try:
        user = User.objects.create_user(username=username, password=password, email=email)
        permisos_finales = permisos_recibidos if permisos_recibidos else PERMISOS_DEFAULT.copy()

        perfil = PerfilAdmin.objects.create(
            usuario=user,
            rol='subusuario',
            es_password_temporal=False,
            correo_recuperacion=email,
            permisos=permisos_finales
        )

        registrar_bitacora(
            usuario=request.user.username, 
            accion='crear', 
            modulo='usuarios', 
            descripcion=f'Creó al trabajador: {username}. Permisos: {list(permisos_finales.keys())}', 
            request=request
        )

        return Response({
            "mensaje": f"Trabajador '{username}' registrado con éxito.",
            "id": user.id
        }, status=201)

    except Exception as e:
        return Response({"mensaje": f"Error interno: {str(e)}"}, status=500)


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def actualizar_permisos(request, user_id):
    if not es_superusuario(request.user):
        return Response({"mensaje": "Solo el superusuario puede modificar permisos."}, status=403)
    try:
        perfil = PerfilAdmin.objects.get(usuario__id=user_id)
    except PerfilAdmin.DoesNotExist:
        return Response({"mensaje": "Usuario no encontrado."}, status=404)

    nuevos_permisos = request.data.get("permisos")
    if not nuevos_permisos:
        return Response({"mensaje": "Debes enviar los permisos."}, status=400)

    perfil.permisos = nuevos_permisos
    perfil.save()
    registrar_bitacora(request.user.username, 'modificar', 'usuarios', f'Actualizó permisos de: {perfil.usuario.username}', request)
    return Response({"mensaje": "Permisos actualizados correctamente."})


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def eliminar_subusuario(request, user_id):
    if not es_superusuario(request.user):
        return Response({"mensaje": "Solo el superusuario puede eliminar usuarios."}, status=403)
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"mensaje": "Usuario no encontrado."}, status=404)
    if es_superusuario(user):
        return Response({"mensaje": "No puedes eliminar al superusuario."}, status=400)

    username = user.username
    user.delete()
    registrar_bitacora(request.user.username, 'eliminar', 'usuarios', f'Eliminó usuario: {username}', request)
    return Response({"mensaje": f"Usuario '{username}' eliminado correctamente."})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def desbloquear_usuario(request, user_id):
    if not es_superusuario(request.user):
        return Response({"mensaje": "Sin permiso."}, status=403)
    try:
        perfil = PerfilAdmin.objects.get(usuario__id=user_id)
    except PerfilAdmin.DoesNotExist:
        return Response({"mensaje": "Usuario no encontrado."}, status=404)
    perfil.bloqueado = False
    perfil.intentos_fallidos = 0
    perfil.save()
    registrar_bitacora(request.user.username, 'modificar', 'usuarios', f'Desbloqueó usuario: {perfil.usuario.username}', request)
    return Response({"mensaje": "Usuario desbloqueado correctamente."})


# ─────────────────────────────────────────────
# MI PERFIL
# ─────────────────────────────────────────────

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def mi_perfil(request):
    try:
        perfil = request.user.perfiladmin
        return Response({
            "username": request.user.username,
            "email":    request.user.email,
            "rol":      perfil.rol,
            "permisos": perfil.permisos,
        })
    except PerfilAdmin.DoesNotExist:
        return Response({"mensaje": "Perfil no encontrado."}, status=404)
