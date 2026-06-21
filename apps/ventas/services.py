class BoletoElectronicoService:
    @staticmethod
    def generarEstructuraPDF(pasaje):
        # Estructura del pasaje para impresión o exportación
        return {
            "title": f"Boleto Digital - Pasaje #{pasaje.id_pasaje}",
            "pasajero": pasaje.nombre_pasajero,
            "ci": pasaje.ci_pasajero,
            "origen": pasaje.id_viaje.id_ruta.origen if pasaje.id_viaje else "",
            "destino": pasaje.id_viaje.id_ruta.destino if pasaje.id_viaje else "",
            "fecha": pasaje.id_viaje.fecha.strftime("%Y-%m-%d") if pasaje.id_viaje else "",
            "hora": pasaje.id_viaje.hora.strftime("%H:%M:%S") if pasaje.id_viaje else "",
            "asiento": pasaje.nro_asiento,
            "precio": pasaje.precio_final,
        }

    @staticmethod
    def generarCodigoQR(data_string):
        # Retorna el valor codificado para generar el QR en el cliente
        return f"VAL-{data_string}"
