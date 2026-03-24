#!/bin/bash
set -e  # dừng ngay nếu có lỗi

echo "=== Pulling latest image ==="
docker pull your-image:latest

echo "=== Running migrations ==="
docker run --rm \
  --env-file .env.production \
  your-image:latest \
  yarn drizzle-kit migrate

echo "=== Restarting app ==="
docker compose up -d --force-recreate