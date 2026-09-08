#!/usr/bin/env bash
set -e

echo "=== Building React Frontend ==="
cd frontend
npm install
GENERATE_SOURCEMAP=false npm run build
cd ..

echo "=== Installing Python Backend Dependencies ==="
pip install -r backend/requirements.txt

echo "=== All Builds Succeeded! ==="
