from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'flotas',         views.BusesViewSet)
router.register(r'viajes-admin',   views.HorariosViewSet)
router.register(r'choferes',       views.ConductorViewSet)
router.register(r'clientes',       views.PasajerosViewSet) # compatibilidad con /api/clientes/

urlpatterns = [
    # ── ViewSets ──────────────────────────────
    path('api/', include(router.urls)),

    # ── Rutas y viajes públicos ───────────────
    path('api/rutas/',                    views.listar_rutas),
    path('api/viajes-disponibles/',       views.ConsultaHorariosViewSet.as_view({'get': 'list'})),
    path('api/asientos-disponibles/',     views.asientos_disponibles),
]
