#!/usr/bin/env bash
# Isolated backend for community.py: in-memory H2 (test profile), port 18082.
# Creates only the community tables, reusing the real Flyway SQL files; no external database is touched.
# STEAM_OPENID overrides the Steam OpenID endpoint (steam_e2e.py runs a local fake on 18090); public URL is the Vite dev origin.
set -euo pipefail
cd "$(dirname "$0")/../../backend"
M=classpath:db/migration
STEAM=${STEAM_OPENID:-https://steamcommunity.com/openid/login}
exec mvn -q -o spring-boot:run \
  -Dspring-boot.run.useTestClasspath=true \
  -Dspring-boot.run.profiles=test \
  "-Dspring-boot.run.arguments=--server.port=18082 --spring.config.additional-location=file:src/test/resources/application-test.yml --spring.sql.init.mode=always --spring.sql.init.schema-locations=$M/V12__shadowcraft_catalogs.sql,$M/V13__shadowcraft_public_builds.sql,$M/V14__shadowcraft_community.sql,$M/V15__shadowcraft_steam_links.sql,$M/V16__shadowcraft_reports.sql,$M/V17__shadowcraft_drop_comments.sql --app.steam.public-url=http://localhost:5173 --app.steam.openid-endpoint=$STEAM"
