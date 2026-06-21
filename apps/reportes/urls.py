from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
# Mapeado como ViewSet
router.register(r'estadisticas', views.EstadisticasViewSet, basename='estadisticas')

urlpatterns = [
    path('api/', include(router.urls)),
]
