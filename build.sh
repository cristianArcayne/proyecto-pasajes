#!/usr/bin/env bash
# build.sh - Script de despliegue para Render
set -o errexit  # Detiene el script si hay algún error

pip install --upgrade pip
pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate
