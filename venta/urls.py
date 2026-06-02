from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'clientes',       views.ClienteViewSet)
router.register(r'pasajes',        views.PasajeViewSet)
router.register(r'detalle-ventas', views.DetalleVentaViewSet)

urlpatterns = [
    # ── ViewSets ──────────────────────────────
    path('api/', include(router.urls)),

    # ── Rutas y compras públicas ──────────────
    path('api/registrar-pasaje/',         views.registrar_pasaje),
    path('api/recuperar-pasaje-publico/', views.recuperar_pasaje_publico),
    path('api/tipos-pasajero/',           views.listar_tipos_pasajero),
]
