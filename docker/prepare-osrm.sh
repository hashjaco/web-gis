#!/usr/bin/env bash
set -euo pipefail

OSRM_IMAGE="ghcr.io/project-osrm/osrm-backend:v6.0.0"
DEFAULT_URL="https://download.geofabrik.de/north-america/us-latest.osm.pbf"
EXTRACT_URL="${1:-$DEFAULT_URL}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WORK_DIR="${OSRM_WORK_DIR:-/tmp/osrm-prep}"
COMPOSE_PROJECT="docker"

echo "=== OSRM data preparation ==="
echo "Extract URL : $EXTRACT_URL"
echo "Work dir    : $WORK_DIR"
echo ""

mkdir -p "$WORK_DIR"

# --- Download ----------------------------------------------------------------
PBF_FILE="$WORK_DIR/region.osm.pbf"
if [ -f "$PBF_FILE" ]; then
  echo "[download] $PBF_FILE already exists, skipping download."
  echo "           Delete it manually to re-download."
else
  echo "[download] Downloading extract (this may take a while for large regions)..."
  curl -L --progress-bar -o "$PBF_FILE" "$EXTRACT_URL"
fi
echo ""

# --- Preprocess --------------------------------------------------------------
echo "[extract]   Running osrm-extract (slowest step — may take 15-30 min for the US)..."
time docker run --rm -v "$WORK_DIR:/data" "$OSRM_IMAGE" \
  osrm-extract -p /opt/car.lua /data/region.osm.pbf

echo ""
echo "[partition] Running osrm-partition..."
time docker run --rm -v "$WORK_DIR:/data" "$OSRM_IMAGE" \
  osrm-partition /data/region.osrm

echo ""
echo "[customize] Running osrm-customize..."
time docker run --rm -v "$WORK_DIR:/data" "$OSRM_IMAGE" \
  osrm-customize /data/region.osrm

echo ""

# --- Load into Docker volume -------------------------------------------------
echo "[load]      Stopping existing OSRM container..."
docker compose -f "$SCRIPT_DIR/docker-compose.yml" --profile routing rm -sf osrm 2>/dev/null || true

VOLUME_NAME="${COMPOSE_PROJECT}_osrm-data"
if ! docker volume inspect "$VOLUME_NAME" >/dev/null 2>&1; then
  echo "[load]      Creating volume $VOLUME_NAME..."
  docker volume create "$VOLUME_NAME"
fi

echo "[load]      Clearing old data from volume..."
docker run --rm -v "$VOLUME_NAME:/data" alpine sh -c "rm -rf /data/*"

echo "[load]      Copying processed files into volume ($VOLUME_NAME)..."
docker run --rm -v "$WORK_DIR:/src:ro" -v "$VOLUME_NAME:/data" alpine \
  sh -c "cp /src/region.osrm* /data/"

echo ""

# --- Start -------------------------------------------------------------------
echo "[start]     Starting OSRM container..."
docker compose -f "$SCRIPT_DIR/docker-compose.yml" --profile routing up -d osrm

echo ""
echo "[done]      Waiting for OSRM to become healthy..."
for i in $(seq 1 30); do
  if curl -sf 'http://localhost:5050/route/v1/car/-77.0365,38.8977;-77.0091,38.8899?overview=false' >/dev/null 2>&1; then
    echo "            OSRM is ready on localhost:5050"
    echo ""
    echo "=== Preparation complete ==="
    echo "You can remove $WORK_DIR to free disk space (the data is in Docker volume $VOLUME_NAME)."
    exit 0
  fi
  sleep 2
done

echo "WARNING: OSRM did not respond within 60 seconds. Check logs:"
echo "  docker logs ${COMPOSE_PROJECT}-osrm-1"
exit 1
