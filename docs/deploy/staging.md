# Staging deployment (docker-compose)

This guide shows how to run a local staging environment with Postgres, backend, and frontend using Docker Compose.

Prerequisites
- Docker and Docker Compose installed
- Copy `.env.sample` to `.env` and update secrets if needed

Start staging

```bash
cp .env.sample .env
# Edit .env if needed
docker compose -f docker/staging/docker-compose.staging.yml up --build
```

Notes
- Backend container mounts `./data` into `/data` so Databricks snapshot exports can be copied into `data/recommendations_snapshot.json` for testing.
- Backend uses `DATABASE_URL` from `.env`; migrations (alembic) should be run before traffic if using a fresh Postgres DB.

Stopping

```bash
docker compose -f docker/staging/docker-compose.staging.yml down -v
```
