from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    ClienteViewSet,
    FlotaViewSet,
    ViajeViewSet,
    PasajeViewSet,
    EncomiendaViewSet,
    DetalleVentaViewSet,
    asientos_disponibles,
    listar_rutas,
    listar_viajes,
    registrar_pasaje,
    login_admin,
    cambiar_credenciales,
    solicitar_recuperacion,
    resetear_password,
    listar_tipos_pasajero,
  
)
from Usuarios import views

router = DefaultRouter()
router.register(r'clientes', ClienteViewSet)
router.register(r'flota', FlotaViewSet)
router.register(r'viajes', ViajeViewSet)
router.register(r'pasajes', PasajeViewSet)
router.register(r'encomiendas', EncomiendaViewSet)
router.register(r'ventas', DetalleVentaViewSet)

urlpatterns = [
    path("api/", include(router.urls)),
    path("api/rutas/", listar_rutas),
    path("api/viajes-disponibles/", listar_viajes),
    path("api/registrar-pasaje/", registrar_pasaje),
    path("api/asientos-disponibles/", asientos_disponibles),
    path("api/login-admin/", login_admin),
    path("api/cambiar-credenciales/", cambiar_credenciales),
    path('api/solicitar-recuperacion/', views.solicitar_recuperacion, name='solicitar_recuperacion'),
    path('api/reset-password/', views.resetear_password, name='reset_password'),
    path("api/tipos-pasajero/", listar_tipos_pasajero),

]