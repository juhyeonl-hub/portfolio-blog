#!/usr/bin/env bash
set -euo pipefail

umask 077

readonly OPS_DIR="/home/juhyeonl/portfolio-blog-ops"
readonly ENV_FILE="$OPS_DIR/blog.env"
readonly BACKUP_DIR="$OPS_DIR/backups"

if [[ ! -r "$ENV_FILE" ]]; then
  echo "Missing or unreadable environment file: $ENV_FILE" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

: "${DB_USERNAME:?DB_USERNAME is required}"
: "${DB_PASSWORD:?DB_PASSWORD is required}"

db_url="${DB_URL:-jdbc:postgresql://localhost:5432/portfolio_blog}"
db_url="${db_url#jdbc:}"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
final_file="$BACKUP_DIR/portfolio_blog_$timestamp.dump"
temporary_file="$final_file.incomplete"

mkdir -p "$BACKUP_DIR"
trap 'rm -f "$temporary_file"' EXIT

PGPASSWORD="$DB_PASSWORD" /usr/bin/pg_dump \
  --format=custom \
  --no-password \
  --username="$DB_USERNAME" \
  --dbname="$db_url" \
  --file="$temporary_file"

/usr/bin/pg_restore --list "$temporary_file" >/dev/null
mv "$temporary_file" "$final_file"
trap - EXIT

echo "Verified database backup: $final_file"
