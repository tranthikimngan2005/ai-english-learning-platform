# Databricks notebook source
"""Databricks batch scaffold for recommendation analytics.

Copy this into a Databricks notebook or run as a Python job after wiring
DB access for the target environment.
"""

from __future__ import annotations

from typing import Any


def export_snapshot(db, user_ids: list[int]) -> dict[str, Any]:
    from app.services.analytics_service import export_batch_snapshot

    return export_batch_snapshot(db, user_ids)
