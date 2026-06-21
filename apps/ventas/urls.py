from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'pasajes',        views.GestionVentasViewSet)
router.register(r'detalle-ventas', views.DetalleVentaViewSet)

urlpatterns = [
    # ── ViewSets ──────────────────────────────
    path('api/', include(router.urls)),

    # ── Rutas y compras públicas ──────────────
    path('api/registrar-pasaje/',         views.VentaViewSet.as_view({'post': 'create'})),
    path('api/recuperar-pasaje-publico/', views.recuperar_pasaje_publico),
    path('api/tipos-pasajero/',           views.listar_tipos_pasajero),
    path('api/asientos-disponibles/',     views.AsientosViewSet.as_view({'get': 'list'})),
]
