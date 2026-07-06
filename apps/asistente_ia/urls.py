from django.urls import path
from .views import AsistenteIAView

urlpatterns = [
    path("api/asistente-ia/consultar/", AsistenteIAView.as_view(), name="asistente-ia-consultar"),
]
