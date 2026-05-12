from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'clientes',  views.ClienteViewSet)
router.register(r'flotas',    views.FlotaViewSet)
router.register(r'viajes-admin', views.ViajeViewSet)
router.register(r'pasajes',   views.PasajeViewSet)
router.register(r'encomiendas', views.EncomiendaViewSet)
router.register(r'detalle-ventas', views.DetalleVentaViewSet)

urlpatterns = [
    # ── ViewSets ──────────────────────────────
    path('api/', include(router.urls)),

    # ── Rutas y viajes públicos ───────────────
    path('api/rutas/',               views.listar_rutas),
    path('api/viajes/',              views.listar_viajes),
    path('api/asientos/',            views.asientos_disponibles),
    path('api/registrar-pasaje/',    views.registrar_pasaje),
    path('api/tipos-pasajero/',      views.listar_tipos_pasajero),

    # ── Auth ──────────────────────────────────
    path('api/login/',               views.login_admin),
    path('api/logout/',              views.logout_admin),
    path('api/cambiar-credenciales/',views.cambiar_credenciales),
    path('api/recuperar-password/',  views.solicitar_recuperacion),
    path('api/reset-password/',      views.resetear_password),
    path('api/mi-perfil/',           views.mi_perfil),

    # ── Bitácora ──────────────────────────────
    path('api/bitacora/',            views.obtener_bitacora),

    # ── Gestión de subusuarios ────────────────
    path('api/usuarios/',                          views.listar_subusuarios),
    path('api/usuarios/crear/',                    views.crear_subusuario),
    path('api/usuarios/<int:user_id>/permisos/',   views.actualizar_permisos),
    path('api/usuarios/<int:user_id>/eliminar/',   views.eliminar_subusuario),
    path('api/usuarios/<int:user_id>/desbloquear/',views.desbloquear_usuario),
]
