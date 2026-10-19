#!/usr/bin/env bash
# Isolated backend for community.py: in-memory H2 (test profile), port 18082.
# Creates only the community tables, reusing the real Flyway SQL files; no external database is touched.
set -euo pipefail
cd "$(dirname "$0")/../../backend"
M=classpath:db/migration
exec mvn -q -o spring-boot:run \
  -Dspring-boot.run.useTestClasspath=true \
  -Dspring-boot.run.profiles=test \
  "-Dspring-boot.run.arguments=--server.port=18082 --spring.config.additional-location=file:src/test/resources/application-test.yml --spring.sql.init.mode=always --spring.sql.init.schema-locations=$M/V12__shadowcraft_catalogs.sql,$M/V13__shadowcraft_public_builds.sql,$M/V14__shadowcraft_community.sql"
