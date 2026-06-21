from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
# Registros adicionales de viewsets si se quiere
# router.register(r'usuarios', views.GestionUsuariosViewSet, basename='usuarios')

urlpatterns = [
    # ── Auth (CU01, CU02, CU03, CU04) ──────────────────────
    path('api/login/',                    views.LoginViewSet.as_view({'post': 'create'})),
    path('api/logout/',                   views.SesionViewSet.as_view({'post': 'create'})),
    path('api/cambiar-credenciales/',     views.cambiar_credenciales, name='cambiar_credenciales'),
    path('api/recuperar-password/',       views.RecuperacionViewSet.as_view({'post': 'enviarEnlaceRecuperacion'})),
    path('api/reset-password/',           views.RecuperacionViewSet.as_view({'post': 'actualizarContrasena'})),
    path('api/mi-perfil/',                views.mi_perfil),

    # ── Bitácora ──────────────────────────────
    path('api/bitacora/',                 views.obtener_bitacora),

    # ── Gestión de subusuarios (CU05) ──────────────
    path('api/usuarios/',                              views.GestionUsuariosViewSet.as_view({'get': 'list'})),
    path('api/usuarios/crear/',                        views.RegistroViewSet.as_view({'post': 'create'})),
    path('api/usuarios/<int:pk>/permisos/',            views.GestionUsuariosViewSet.as_view({'put': 'update'})),
    path('api/usuarios/<int:pk>/eliminar/',            views.GestionUsuariosViewSet.as_view({'delete': 'destroy'})),
    path('api/usuarios/<int:pk>/desbloquear/',         views.GestionUsuariosViewSet.as_view({'post': 'cambiarEstadoUsuario'})),
]
