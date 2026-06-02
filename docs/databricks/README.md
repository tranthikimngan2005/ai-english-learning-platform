# Databricks analytics scaffold

This folder contains the batch recommendation scaffold used for the analytics step in the microservice plan.

## What it does

- Reuses `app.services.analytics_service`
- Produces recommendation snapshots for selected users
- Produces failed-tag aggregates for batch reporting

## How to use

- Copy `recommendation_batch.py` into a Databricks notebook, or
- Import the same helper functions from the backend package in a Databricks job with database access configured
- Write the exported JSON to `data/raw/recommendations_snapshot.json` (or override `ANALYTICS_BATCH_SNAPSHOT_PATH`).

## Snapshot shape

- `generated_at`: ISO timestamp
- `failed_tags`: list of `{ tag, fail_count }`
- `recommendations`: object keyed by user id strings, each value is a list of `{ question, next_review }`

## Next integration step

- Write Databricks output back to a table or object store
- Have the backend read that computed data through a lightweight API or cache layer
