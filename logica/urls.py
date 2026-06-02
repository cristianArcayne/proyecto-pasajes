from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'flotas',         views.FlotaViewSet)
router.register(r'viajes-admin',   views.ViajeViewSet)
router.register(r'choferes',       views.ConductorViewSet)
router.register(r'encomiendas',    views.EncomiendaViewSet)

urlpatterns = [
    # ── ViewSets ──────────────────────────────
    path('api/', include(router.urls)),

    # ── Rutas y viajes públicos ───────────────
    path('api/rutas/',                    views.listar_rutas),
    path('api/viajes-disponibles/',       views.listar_viajes),
    path('api/asientos-disponibles/',     views.asientos_disponibles),
]
