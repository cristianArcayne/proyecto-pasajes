from django.db import connection
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
import uuid
from django.utils import timezone
from datetime import timedelta
from django.core.mail import send_mail
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken

from .models import PerfilAdmin, BitacoraSesion, Usuario
from .serializers import PerfilAdminSerializer

# ─────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────

def get_ip(request):
    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    return x_forwarded.split(',')[0] if x_forwarded else request.META.get('REMOTE_ADDR', '')


def registrar_bitacora(usuario, accion, modulo, descripcion='', request=None):
    if accion == 'ver':
        return
    ip = get_ip(request) if request else ''
    BitacoraSesion.objects.create(
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
# AUTH AND SESSION VIEWSETS
# ─────────────────────────────────────────────

class LoginViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    def create(self, request):
        return self.iniciarSesion(request)

    def iniciarSesion(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        
        try:
            user = Usuario.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"mensaje": "Credenciales incorrectas"}, status=status.HTTP_401_UNAUTHORIZED)

        perfil, _ = PerfilAdmin.objects.get_or_create(usuario=user)

        if perfil.bloqueado:
            return Response({"mensaje": "Cuenta bloqueada. Recupera tu contraseña por correo."}, status=status.HTTP_403_FORBIDDEN)

        user_auth = self.autenticarUsuario(username, password)
        if not user_auth:
            perfil.intentos_fallidos += 1
            if perfil.intentos_fallidos >= 3:
                perfil.bloqueado = True
                perfil.save()
                registrar_bitacora(username, 'login', 'auth', 'Cuenta bloqueada por 3 intentos fallidos', request)
                return Response({"mensaje": "Cuenta bloqueada por 3 intentos fallidos."}, status=status.HTTP_403_FORBIDDEN)
            perfil.save()
            restantes = 3 - perfil.intentos_fallidos
            return Response({"mensaje": f"Contraseña incorrecta. Te quedan {restantes} intentos."}, status=status.HTTP_401_UNAUTHORIZED)

        perfil.intentos_fallidos = 0
        perfil.save()
        
        # Auditoría con BitacoraSesion
        BitacoraSesion.registrarIngreso(
            usuario=username,
            ip=get_ip(request),
            descripcion="Inicio de sesión exitoso"
        )

        refresh = RefreshToken.for_user(user_auth)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "es_password_temporal": perfil.es_password_temporal,
            "username": user_auth.username,
            "rol": perfil.rol,
            "permisos": perfil.permisos,
        })

    def autenticarUsuario(self, username, password):
        return authenticate(username=username, password=password)


class SesionViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def create(self, request):
        return self.cerrarSesion(request)

    def cerrarSesion(self, request):
        registrar_bitacora(request.user.username, 'logout', 'auth', 'Cerró sesión', request)
        self.invalidarToken(request)
        return Response({"mensaje": "Sesión cerrada correctamente"})

    def invalidarToken(self, request):
        # En una arquitectura JWT pura, el cliente borra el token. Podríamos blacklistearlo aquí.
        pass


class RegistroViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def create(self, request):
        return self.registrarUsuario(request)

    def registrarUsuario(self, request):
        if request.user.perfiladmin.rol != 'superusuario':
            return Response({"mensaje": "Acceso denegado. Solo el superusuario puede crear cuentas."}, status=status.HTTP_403_FORBIDDEN)

        username = request.data.get("username")
        password = request.data.get("password")
        email    = request.data.get("email", "")
        permisos_recibidos = request.data.get("permisos")

        if not username or not password:
            return Response({"mensaje": "Usuario y contraseña son obligatorios."}, status=status.HTTP_400_BAD_REQUEST)

        if self.verificarDuplicidad(username):
            return Response({"mensaje": "Este nombre de usuario ya está registrado."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.create_user(username=username, password=password, email=email)
            
            from .views import PERMISOS_DEFAULT
            permisos_finales = permisos_recibidos if permisos_recibidos else PERMISOS_DEFAULT.copy()

            PerfilAdmin.objects.create(
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
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"mensaje": f"Error interno: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def verificarDuplicidad(self, username):
        return User.objects.filter(username=username).exists()


class RecuperacionViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    @action(detail=False, methods=['post'], url_path='recuperar-password')
    def enviarEnlaceRecuperacion(self, request):
        correo = request.data.get("correo")
        try:
            perfil = PerfilAdmin.objects.get(correo_recuperacion=correo)
        except PerfilAdmin.DoesNotExist:
            try:
                user = User.objects.get(email=correo)
                perfil = user.perfiladmin
            except (User.DoesNotExist, PerfilAdmin.DoesNotExist):
                return Response({"mensaje": "No existe una cuenta con ese correo"}, status=status.HTTP_404_NOT_FOUND)

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

    @action(detail=False, methods=['post'], url_path='reset-password')
    def actualizarContrasena(self, request):
        token          = request.data.get("token")
        nueva_password = request.data.get("nueva_password")
        try:
            perfil = PerfilAdmin.objects.get(token_recuperacion=token)
        except PerfilAdmin.DoesNotExist:
            return Response({"mensaje": "Token inválido"}, status=status.HTTP_400_BAD_REQUEST)
        if timezone.now() > perfil.token_expira:
            return Response({"mensaje": "El enlace ha expirado"}, status=status.HTTP_400_BAD_REQUEST)
        
        perfil.usuario.set_password(nueva_password)
        perfil.usuario.save()
        perfil.token_recuperacion = None
        perfil.token_expira = None
        perfil.bloqueado = False
        perfil.intentos_fallidos = 0
        perfil.save()
        registrar_bitacora(perfil.usuario.username, 'modificar', 'auth', 'Reseteó su contraseña', request)
        return Response({"mensaje": "Contraseña actualizada correctamente"})


class GestionUsuariosViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = PerfilAdminSerializer

    def get_queryset(self):
        return PerfilAdmin.objects.select_related('usuario').filter(rol='subusuario')

    def list(self, request, *args, **kwargs):
        if not es_superusuario(request.user):
            return Response({"mensaje": "Solo el superusuario puede gestionar usuarios."}, status=status.HTTP_403_FORBIDDEN)
        queryset = self.get_queryset()
        data = [{
            "id":                  p.usuario.id,
            "username":            p.usuario.username,
            "email":               p.usuario.email,
            "bloqueado":           p.bloqueado,
            "is_active":           not p.bloqueado,
            "rol":                 p.rol,
            "es_password_temporal":p.es_password_temporal,
            "permisos":            p.permisos,
        } for p in queryset]
        return Response(data)

    def destroy(self, request, *args, **kwargs):
        if not es_superusuario(request.user):
            return Response({"mensaje": "Solo el superusuario puede eliminar usuarios."}, status=status.HTTP_403_FORBIDDEN)
        
        user_id = kwargs.get("pk")
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"mensaje": "Usuario no encontrado."}, status=status.HTTP_404_NOT_FOUND)
        
        if es_superusuario(user):
            return Response({"mensaje": "No puedes eliminar al superusuario."}, status=status.HTTP_400_BAD_REQUEST)

        username = user.username
        user.delete()
        registrar_bitacora(request.user.username, 'eliminar', 'usuarios', f'Eliminó usuario: {username}', request)
        return Response({"mensaje": f"Usuario '{username}' eliminado correctamente."})

    def update(self, request, *args, **kwargs):
        if not es_superusuario(request.user):
            return Response({"mensaje": "Solo el superusuario puede modificar permisos."}, status=status.HTTP_403_FORBIDDEN)
        
        user_id = kwargs.get("pk")
        try:
            perfil = PerfilAdmin.objects.get(usuario__id=user_id)
        except PerfilAdmin.DoesNotExist:
            return Response({"mensaje": "Usuario no encontrado."}, status=status.HTTP_404_NOT_FOUND)

        nuevos_permisos = request.data.get("permisos")
        if not nuevos_permisos:
            return Response({"mensaje": "Debes enviar los permisos."}, status=status.HTTP_400_BAD_REQUEST)

        perfil.permisos = nuevos_permisos
        perfil.save()
        registrar_bitacora(request.user.username, 'modificar', 'usuarios', f'Actualizó permisos de: {perfil.usuario.username}', request)
        return Response({"mensaje": "Permisos actualizados correctamente."})

    @action(detail=True, methods=['post'], url_path='desbloquear')
    def cambiarEstadoUsuario(self, request, pk=None):
        if not es_superusuario(request.user):
            return Response({"mensaje": "Sin permiso."}, status=status.HTTP_403_FORBIDDEN)
        try:
            perfil = PerfilAdmin.objects.get(usuario__id=pk)
        except PerfilAdmin.DoesNotExist:
            return Response({"mensaje": "Usuario no encontrado."}, status=status.HTTP_404_NOT_FOUND)
        
        # Desbloquear usuario / cambiar su estado
        perfil.bloqueado = False
        perfil.intentos_fallidos = 0
        perfil.save()
        registrar_bitacora(request.user.username, 'modificar', 'usuarios', f'Desbloqueó usuario: {perfil.usuario.username}', request)
        return Response({"mensaje": "Usuario desbloqueado correctamente."})


# ─────────────────────────────────────────────
# COMPATIBILITY FUNCTIONS
# ─────────────────────────────────────────────

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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def obtener_bitacora(request):
    registros = BitacoraSesion.objects.all()[:200]
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


PERMISOS_DEFAULT = {
    "clientes": {"ver": False, "crear": False, "modificar": False, "eliminar": False},
    "buses":    {"ver": False, "crear": False, "modificar": False, "eliminar": False},
    "choferes": {"ver": False, "crear": False, "modificar": False, "eliminar": False},
    "viajes":   {"ver": False, "crear": False, "modificar": False, "eliminar": False},
    "ventas":   {"ver": False, "crear": False, "modificar": False, "eliminar": False},
    "encomiendas": {"ver": False, "crear": False, "modificar": False, "eliminar": False},
    "reportes": {"ver": False},
    "bitacora": {"ver": False},
}
