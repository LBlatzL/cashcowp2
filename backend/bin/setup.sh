
#!/usr/bin/env bash
set -euo pipefail

# bin/ is inside backend/
BACKEND="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Checking prerequisites..."

# Check Python
if ! command -v python >/dev/null 2>&1; then
    echo "ERROR: Python is not installed." >&2
    exit 1
fi

# Check requirements.txt
if [[ ! -f "$BACKEND/requirements.txt" ]]; then
    echo "ERROR: requirements.txt not found." >&2
    exit 1
fi

# Create virtual environment if missing
if [[ ! -d "$BACKEND/.venv" ]]; then
    echo "Creating virtual environment..."
    python -m venv "$BACKEND/.venv"
else
    echo "Virtual environment already exists."
fi

# Find virtual environment Python
if [[ -f "$BACKEND/.venv/Scripts/python.exe" ]]; then
    PYTHON="$BACKEND/.venv/Scripts/python.exe"
elif [[ -f "$BACKEND/.venv/bin/python" ]]; then
    PYTHON="$BACKEND/.venv/bin/python"
else
    echo "ERROR: Virtual environment Python not found." >&2
    exit 1
fi

# Convert Git Bash paths for Windows Python
if [[ "$PYTHON" == *.exe ]]; then
    if command -v cygpath >/dev/null 2>&1; then
        REQUIREMENTS="$(cygpath -w "$BACKEND/requirements.txt")"
    elif command -v wslpath >/dev/null 2>&1; then
        REQUIREMENTS="$(wslpath -w "$BACKEND/requirements.txt")"
    else
        echo "ERROR: Cannot convert requirements path for Windows Python." >&2
        exit 1
    fi
else
    REQUIREMENTS="$BACKEND/requirements.txt"
fi

# Install dependencies
echo "Installing backend dependencies..."
"$PYTHON" -m pip install -r "$REQUIREMENTS"

# Preserve existing environment configuration
if [[ -f "$BACKEND/.env" ]]; then
    echo "Existing backend .env preserved."
elif [[ -f "$BACKEND/../.env" ]]; then
    echo "Existing project .env preserved."
elif [[ -f "$BACKEND/.env.example" ]]; then
    cp "$BACKEND/.env.example" "$BACKEND/.env"
    echo "Created .env from .env.example."
elif [[ -f "$BACKEND/../.env.example" ]]; then
    cp "$BACKEND/../.env.example" "$BACKEND/../.env"
    echo "Created project .env from .env.example."
else
    echo "WARNING: No .env or .env.example found."
    echo "Configure your environment before running seed.sh."
fi

echo ""
echo "Setup completed successfully."
echo "Run bash bin/seed.sh to populate your database."
