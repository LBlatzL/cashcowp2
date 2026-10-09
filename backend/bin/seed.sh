
#!/usr/bin/env bash
set -euo pipefail

# bin/ is already inside backend/
BACKEND="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

RESET=false
YES=false

for arg in "$@"; do
    case "$arg" in
        --reset) RESET=true ;;
        --yes) YES=true ;;
        *)
            echo "ERROR: Unknown argument: $arg" >&2
            exit 1
            ;;
    esac
done

if [[ "$YES" == true && "$RESET" == false ]]; then
    echo "ERROR: --yes requires --reset." >&2
    exit 1
fi

# Load .env only if DATABASE_URL is not already provided
if [[ -z "${DATABASE_URL:-}" ]]; then
    if [[ -f "$BACKEND/.env" ]]; then
        ENV_FILE="$BACKEND/.env"
    elif [[ -f "$BACKEND/../.env" ]]; then
        ENV_FILE="$BACKEND/../.env"
    else
        echo "ERROR: DATABASE_URL is missing and no .env was found." >&2
        exit 1
    fi

    set -a
    source "$ENV_FILE"
    set +a
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
    echo "ERROR: DATABASE_URL is missing." >&2
    exit 1
fi

# Locate Python virtual environment
if [[ -f "$BACKEND/.venv/Scripts/python.exe" ]]; then
    PYTHON="$BACKEND/.venv/Scripts/python.exe"
elif [[ -f "$BACKEND/.venv/bin/python" ]]; then
    PYTHON="$BACKEND/.venv/bin/python"
else
    echo "ERROR: Virtual environment not found." >&2
    exit 1
fi

# Confirm before resetting database
if [[ "$RESET" == true && "$YES" == false ]]; then
    echo "WARNING: This will reset CashCow seed data."
    read -r -p "Continue? (yes/no): " answer

    if [[ "$answer" != "yes" ]]; then
        echo "Reset cancelled."
        exit 0
    fi
fi

cd "$BACKEND"

echo "Checking database connection..."

if ! "$PYTHON" -m scripts.seed --check; then
    echo "ERROR: PostgreSQL database is unreachable or misconfigured." >&2
    exit 1
fi

echo "Running seed script..."

if [[ "$RESET" == true ]]; then
    "$PYTHON" -m scripts.seed --reset
else
    "$PYTHON" -m scripts.seed
fi

echo "Seeding completed successfully."
