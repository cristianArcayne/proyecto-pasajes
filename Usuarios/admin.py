from django.contrib import admin
from .models import Pasaje, Cliente, Conductor, TipoPasajero, Viaje, Rutas, Flota


@admin.register(Pasaje)
class PasajeAdmin(admin.ModelAdmin):
    list_display = ('id_pasaje', 'nombre_pasajero', 'ci_pasajero', 'estado_pasaje', 'placa_bus')
    list_editable = ('estado_pasaje',) 
    search_fields = ('nombre_pasajero', 'ci_pasajero')

@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ('ci', 'nombre', 'telefono')
    search_fields = ('nombre', 'ci')

@admin.register(Conductor)
class ConductorAdmin(admin.ModelAdmin):
    list_display = ('ci', 'nombre', 'licencia', 'telefono')

@admin.register(Viaje)
class ViajeAdmin(admin.ModelAdmin):
    list_display = ('id_viaje', 'fecha', 'hora', 'placa')
    list_filter = ('fecha',)

@admin.register(Rutas)
class RutasAdmin(admin.ModelAdmin):
    list_display = ('origen', 'destino', 'precio_ruta')

@admin.register(Flota)
class FlotaAdmin(admin.ModelAdmin):
    list_display = ('placa', 'modelo', 'capacidad_asientos')
@admin.register(TipoPasajero)
class TipoPasajeroAdmin(admin.ModelAdmin):
    list_display = ('id_tipo', 'nombre_tipo') 
    search_fields = ('nombre_tipo',)           
