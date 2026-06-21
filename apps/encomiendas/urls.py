from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'encomiendas', views.GestionEncomiendaViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
]
