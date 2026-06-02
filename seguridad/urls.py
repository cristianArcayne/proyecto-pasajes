from django.urls import path
from . import views

urlpatterns = [
    # ── Auth ──────────────────────────────────
    path('api/login/',                    views.login_admin),
    path('api/logout/',                   views.logout_admin),
    path('api/cambiar-credenciales/',     views.cambiar_credenciales, name='cambiar_credenciales'),
    path('api/recuperar-password/',       views.solicitar_recuperacion),
    path('api/reset-password/',           views.resetear_password),
    path('api/mi-perfil/',                views.mi_perfil),

    # ── Bitácora ──────────────────────────────
    path('api/bitacora/',                 views.obtener_bitacora),

    # ── Gestión de subusuarios ────────────────
    path('api/usuarios/',                              views.listar_subusuarios),
    path('api/usuarios/crear/',                        views.crear_subusuario),
    path('api/usuarios/<int:user_id>/permisos/',       views.actualizar_permisos),
    path('api/usuarios/<int:user_id>/eliminar/',       views.eliminar_subusuario),
    path('api/usuarios/<int:user_id>/desbloquear/',    views.desbloquear_usuario),
]
