import os
import sys
import django
import datetime

# Configurar Django
project_path = r"c:\Users\Cristian Arcayne\Downloads\Proyecto de SI1\proyecto-pasajes-master\proyecto-pasajes-master"
sys.path.append(project_path)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Principal.settings')
django.setup()

from apps.logistica.models import Estado, Bus, Ruta, Conductor, Horario, Pasajero, Asiento

# Obtener o crear estado activo
est_activo, _ = Estado.objects.get_or_create(id_estado=1, defaults={"nombre_estado": "Activo"})

print("Poblando Clientes...")
clientes_data = [
    ('1234567', 'Juan Perez', '70012345'),
    ('7654321', 'Maria Lopez', '60054321'),
    ('9876543', 'Luis Fernandez', '72098765'),
    ('4567890', 'Carla Gutierrez', '69045678'),
    ('3216549', 'Pedro Rojas', '78032165'),
    ('6549871', 'Ana Morales', '76065498'),
    ('8527419', 'Miguel Vargas', '73085274'),
    ('9517538', 'Sofia Aguilar', '75095175'),
]

for ci, nombre, telf in clientes_data:
    Pasajero.objects.update_or_create(
        ci=int(ci),
        defaults={"nombre": nombre, "telefono": telf, "comentario": ""}
    )

print("Poblando Flota (Buses)...")
flotas_data = [
    ('2544-ABC', 'Mercedes Benz 2024', 40),
    ('3655-XYZ', 'Volvo 2023', 45),
    ('4788-KLM', 'Scania 2022', 50),
    ('1234-CMF', 'MERCEDES BENZ', 39),
    ('8822-NXB', 'Mercedes-Benz Tourismo', 40),
    ('9911-LKP', 'Volvo B12R Double Decker', 45),
    ('7733-MTR', 'Scania K410', 34),
    ('6644-JWR', 'Marcopolo Paradiso 1800', 40),
    ('5588-PXA', 'Irizar i8', 45),
]

for placa, modelo, cap in flotas_data:
    bus, created = Bus.objects.update_or_create(
        placa=placa,
        defaults={"modelo": modelo, "capacidad_asientos": cap, "id_estado": est_activo}
    )
    if created or not Asiento.objects.filter(placa=bus).exists():
        for i in range(1, cap + 1):
            Asiento.objects.get_or_create(nro_asiento=i, placa=bus, defaults={"piso": 1})

print("Poblando Conductores...")
cond_data = [
    ('112233', 'Carlos Choque', '77011223', 45, 'C'),
    ('223344', 'Roberto Flores', '76022334', 38, 'C'),
    ('334455', 'Jorge Arce', '78033445', 50, 'D'),
    ('445566', 'Luis Salazar', '72044556', 42, 'C'),
    ('556677', 'Juan Carlos Apaza', '71234567', 38, 'C'),
    ('667788', 'Milton Quispe', '72345678', 42, 'C'),
    ('778899', 'Willy Mamani', '73456789', 45, 'C'),
    ('889900', 'Ramiro Condori', '74567890', 40, 'C'),
    ('990011', 'Freddy Calle', '75678901', 35, 'B'),
    ('101112', 'Hernan Rojas', '76789012', 48, 'C'),
    ('111213', 'Mario Mendoza', '77890123', 50, 'C'),
    ('121314', 'Ruben Vargas', '78901234', 37, 'B'),
    ('131415', 'Victor Choque', '79012345', 44, 'C'),
    ('141516', 'Alvaro Gutierrez', '70123456', 39, 'C'),
]

for ci, nombre, telf, edad, lic in cond_data:
    Conductor.objects.update_or_create(
        ci=int(ci),
        defaults={"nombre": nombre, "telefono": telf, "edad": edad, "licencia": lic}
    )

print("Poblando Rutas...")
rutas_data = [
    (1, 'Santa Cruz', 'Cochabamba', 80.00),
    (2, 'Santa Cruz', 'La Paz', 150.00),
    (3, 'Cochabamba', 'Oruro', 60.00),
    (4, 'La Paz', 'Potosí', 100.00),
    (5, 'Santa Cruz', 'Sucre', 120.00),
]

for id_ruta, orig, dest, prec in rutas_data:
    Ruta.objects.update_or_create(
        id_ruta=id_ruta,
        defaults={"origen": orig, "destino": dest, "precio_ruta": int(prec)}
    )

print("Poblando Viajes...")
viajes_data = [
    (101, '2026-05-03', '21:00:00', 1, '2544-ABC'),
    (102, '2026-05-03', '08:00:00', 2, '3655-XYZ'),
    (103, '2026-05-03', '19:30:00', 5, '2544-ABC'),
    (104, '2026-06-01', '21:00:00', 1, '2544-ABC'),
    (105, '2026-06-01', '08:00:00', 2, '3655-XYZ'),
]

for id_viaje, fecha_str, hora_str, id_ruta, placa in viajes_data:
    ruta = Ruta.objects.get(id_ruta=id_ruta)
    bus = Bus.objects.get(placa=placa)
    fecha_dt = datetime.datetime.strptime(fecha_str, "%Y-%m-%d").date()
    hora_dt = datetime.datetime.strptime(hora_str, "%H:%M:%S").time()
    
    Horario.objects.update_or_create(
        id_viaje=id_viaje,
        defaults={"fecha": fecha_dt, "hora": hora_dt, "id_ruta": ruta, "placa": bus}
    )

# Poblar Tipos de Encomienda y Encomiendas
from apps.encomiendas.models import Tipo_Encomienda, Encomienda
print("Poblando Tipos de Encomienda...")
t1, _ = Tipo_Encomienda.objects.update_or_create(id_encomienda=1, defaults={"descripcion": "Sobre / Documentos", "precio_inicial": 15})
t2, _ = Tipo_Encomienda.objects.update_or_create(id_encomienda=2, defaults={"descripcion": "Caja Mediana", "precio_inicial": 30})
t3, _ = Tipo_Encomienda.objects.update_or_create(id_encomienda=3, defaults={"descripcion": "Carga Grande / Pesada", "precio_inicial": 60})

print("Poblando Encomiendas...")
pasajeros = list(Pasajero.objects.all())
viajes = list(Horario.objects.all())
if len(pasajeros) >= 2 and len(viajes) >= 2:
    Encomienda.objects.update_or_create(
        nro_encomienda=100201,
        defaults={
            "peso_kg": 5.50,
            "precio_total": 31.50,
            "descripcion_carga": "Caja con repuestos mecánicos",
            "ci_remitente": pasajeros[0],
            "id_encomienda": t2,
            "id_viaje": viajes[0]
        }
    )
    Encomienda.objects.update_or_create(
        nro_encomienda=100202,
        defaults={
            "peso_kg": 1.20,
            "precio_total": 18.60,
            "descripcion_carga": "Sobre con documentos notariales",
            "ci_remitente": pasajeros[1],
            "id_encomienda": t1,
            "id_viaje": viajes[1]
        }
    )
    Encomienda.objects.update_or_create(
        nro_encomienda=100203,
        defaults={
            "peso_kg": 25.00,
            "precio_total": 135.00,
            "descripcion_carga": "Caja grande de ropa",
            "ci_remitente": pasajeros[0],
            "id_encomienda": t3,
            "id_viaje": viajes[0]
        }
    )

print("Datos insertados con exito!")
