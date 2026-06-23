import psycopg2

url = "postgresql://bd_pasaje_user:Vj0mlDuMJDnQ18dOvTauH1teVgEXSegt@dpg-d8191jbtqb8s738nj0v0-a.oregon-postgres.render.com/bd_pasaje"

try:
    print("Intentando conectar a base de datos de Render...")
    conn = psycopg2.connect(url)
    print("CONECTADO A RENDER CON EXITO!")
    cur = conn.cursor()
    cur.execute("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public';")
    tables = [t[0] for t in cur.fetchall()]
    print("Tablas encontradas:", tables)
    
    # Contar filas en tablas principales
    for table in ['auth_user', 'pasajero', 'bus', 'horario', 'pasaje']:
        if table in tables:
            try:
                cur.execute(f"SELECT COUNT(*) FROM {table};")
                print(f"Total en {table}:", cur.fetchone()[0])
            except Exception as e:
                print(f"Error en {table}:", repr(e))
except Exception as e:
    print("Error conectando a Render:", repr(e))
