#!/bin/bash
# ─── Cotents Database Setup ───────────────────────────────────
# Run this ONCE to create the PostgreSQL user and database.
# Usage: bash setup-db.sh
# ─────────────────────────────────────────────────────────────

set -e

DB_USER="cotents"
DB_PASS="cotents_secure_2024"
DB_NAME="cotents_db"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Cotents – PostgreSQL Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "This script needs to run as the 'postgres' OS user."
echo "You will be prompted for your SUDO password once."
echo ""

# ── Step 1: Create role + database ─────────────────────────
sudo -u postgres psql <<SQL
-- Create user if not exists
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASS}';
    RAISE NOTICE 'Created role: ${DB_USER}';
  ELSE
    ALTER ROLE ${DB_USER} WITH PASSWORD '${DB_PASS}';
    RAISE NOTICE 'Updated password for role: ${DB_USER}';
  END IF;
END
\$\$;

-- Create database if not exists
SELECT 'CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}')
\gexec

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
\echo 'Database privileges granted.'
SQL

echo ""
echo "✅  Role '${DB_USER}' and database '${DB_NAME}' are ready."
echo ""

# ── Step 2: Write DATABASE_URL to .env ─────────────────────
ENV_FILE="$(dirname "$0")/.env"
DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}"

if grep -q "^DATABASE_URL=" "$ENV_FILE" 2>/dev/null; then
  # Update existing line
  sed -i "s|^DATABASE_URL=.*|DATABASE_URL=${DATABASE_URL}|" "$ENV_FILE"
  echo "✅  Updated DATABASE_URL in .env"
elif grep -q "^# DATABASE_URL=" "$ENV_FILE" 2>/dev/null; then
  # Uncomment the commented line
  sed -i "s|^# DATABASE_URL=.*|DATABASE_URL=${DATABASE_URL}|" "$ENV_FILE"
  echo "✅  Uncommented and set DATABASE_URL in .env"
else
  echo "DATABASE_URL=${DATABASE_URL}" >> "$ENV_FILE"
  echo "✅  Added DATABASE_URL to .env"
fi

# ── Step 3: Run schema migration ───────────────────────────
echo ""
echo "Running schema migration..."
cd "$(dirname "$0")"
DATABASE_URL="${DATABASE_URL}" node src/database/migrate.js

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅  Database setup complete!"
echo ""
echo "  Connection: ${DATABASE_URL}"
echo ""
echo "  Next step: npm run dev  (in the backend directory)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
