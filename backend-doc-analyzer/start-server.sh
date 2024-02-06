#!/bin/bash

# Inicia Celery en segundo plano
celery -A src.celery_app worker -l info &

sleep 5;
uvicorn main:app --host 0.0.0.0 --port 80 --forwarded-allow-ips '*'

sleep infinity;
