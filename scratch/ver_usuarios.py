import os
import psycopg2

db_url = "postgresql://bd_pasaje_user:Vj0mlDuMJDnQ18dOvTauH1teVgEXSegt@dpg-d8191jbtqb8s738nj0v0-a.oregon-postgres.render.com/bd_pasaje"

try:
    print("Conectando a la base de datos de Render...")
    conn = psycopg2.connect(db_url, sslmode="require")
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, email, is_superuser FROM auth_user")
    rows = cursor.fetchall()
    print("\n=== USUARIOS EN BD DE RENDER ===")
    for row in rows:
        print(f"ID: {row[0]} | Username: {row[1]} | Email: {row[2]} | Superuser: {row[3]}")
    cursor.close()
    conn.close()
except Exception as e:
    print("Error al conectar:", e)
