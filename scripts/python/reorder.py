"""
Reorder recommendations per SKU based on sales velocity and inventory position.

This module is settlement-agnostic: you must provide the sales table and column
mappings via ReorderConfig. No Amazon-specific fields are assumed.

Assumptions (explicit, minimal):
- Inventory is the latest snapshot per SKU.
- Available inventory = fulfillable + inbound (both are non-negative integers).
- Daily velocity is computed from the last 60 days if available, otherwise 30 days.
- expected_stockout_date is computed from the latest snapshot_date.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
import sqlite3
from typing import Iterable, Optional, Tuple

import pandas as pd


@dataclass(frozen=True)
class ReorderConfig:
    """
    Configuration for reorder calculations.

    sales_table: table containing unit sales history
    inventory_table: table containing inventory snapshots
    sku_master_table: table containing lead_time_days
    """

    sales_table: str
    sales_date_col: str
    sales_sku_col: str
    sales_qty_col: str

    inventory_table: str = "inventory_snapshots"
    inventory_sku_col: str = "sku"
    inventory_date_col: str = "snapshot_date"
    inventory_fulfillable_col: str = "fulfillable"
    inventory_inbound_col: str = "inbound"

    sku_master_table: str = "sku_master"
    sku_master_sku_col: str = "sku"
    sku_master_lead_time_col: str = "lead_time_days"

    sales_type_col: Optional[str] = None
    sales_unit_types: Optional[Iterable[str]] = None


def calculate_reorder_recommendations(
    db_path: str,
    as_of_date: str,
    config: ReorderConfig,
    safety_stock_days: int = 10,
    windows: Tuple[int, int] = (30, 60),
) -> pd.DataFrame:
    """
    Calculate reorder recommendations per SKU.

    Args:
        db_path: SQLite database path.
        as_of_date: ISO date/time string used as the analysis cutoff.
        config: ReorderConfig with table/column mappings.
        safety_stock_days: Additional buffer days beyond lead time (default 10).
        windows: Tuple of (short_window_days, long_window_days).

    Returns:
        DataFrame with columns:
        sku, daily_velocity, days_of_cover, reorder_point_days,
        recommended_order_qty, expected_stockout_date
    """
    _validate_config(config)

    short_window, long_window = sorted(windows)
    as_of_dt = _parse_iso(as_of_date)
    long_start = (as_of_dt - timedelta(days=long_window)).strftime("%Y-%m-%dT%H:%M:%S")
    short_start = (as_of_dt - timedelta(days=short_window)).strftime("%Y-%m-%dT%H:%M:%S")

    with sqlite3.connect(db_path) as conn:
        sales_df = _load_sales(conn, config, long_start, as_of_date)
        inv_df = _load_latest_inventory(conn, config)
        lead_df = _load_lead_times(conn, config)

    sales_df = _filter_sales_types(sales_df, config)

    units_60 = _sum_units_by_sku(sales_df, long_start, as_of_date, config)
    units_30 = _sum_units_by_sku(sales_df, short_start, as_of_date, config)

    velocity = _compute_velocity(units_30, units_60, short_window, long_window)

    result = (
        velocity.rename("daily_velocity")
        .to_frame()
        .join(inv_df.set_index("sku"), how="outer")
        .join(lead_df.set_index("sku"), how="left")
        .reset_index()
        .rename(columns={"index": "sku"})
    )

    result["fulfillable"] = result["fulfillable"].fillna(0.0)
    result["inbound"] = result["inbound"].fillna(0.0)
    result["on_hand"] = result["fulfillable"] + result["inbound"]
    result["lead_time_days"] = result["lead_time_days"].fillna(0.0)

    result["daily_velocity"] = result["daily_velocity"].fillna(0.0)
    result["days_of_cover"] = _safe_divide(result["on_hand"], result["daily_velocity"])
    result["reorder_point_days"] = result["lead_time_days"] + float(safety_stock_days)

    result["recommended_order_qty"] = _recommended_qty(
        result["daily_velocity"],
        result["reorder_point_days"],
        result["on_hand"],
    )

    result["expected_stockout_date"] = _stockout_date(
        result["snapshot_date"],
        result["days_of_cover"],
    )

    return result[
        [
            "sku",
            "daily_velocity",
            "days_of_cover",
            "reorder_point_days",
            "recommended_order_qty",
            "expected_stockout_date",
        ]
    ].sort_values("recommended_order_qty", ascending=False)


def _load_sales(
    conn: sqlite3.Connection,
    config: ReorderConfig,
    start_date: str,
    end_date: str,
) -> pd.DataFrame:
    cols = [
        f"{config.sales_sku_col} AS sku",
        f"{config.sales_qty_col} AS quantity",
        f"{config.sales_date_col} AS sale_date",
    ]
    if config.sales_type_col:
        cols.append(f"{config.sales_type_col} AS sale_type")

    query = f"""
        SELECT {", ".join(cols)}
        FROM {config.sales_table}
        WHERE {config.sales_date_col} BETWEEN ? AND ?
    """
    return pd.read_sql_query(query, conn, params=(start_date, end_date))


def _load_latest_inventory(conn: sqlite3.Connection, config: ReorderConfig) -> pd.DataFrame:
    query = f"""
        SELECT i.{config.inventory_sku_col} AS sku,
               i.{config.inventory_date_col} AS snapshot_date,
               i.{config.inventory_fulfillable_col} AS fulfillable,
               i.{config.inventory_inbound_col} AS inbound
        FROM {config.inventory_table} i
        JOIN (
            SELECT {config.inventory_sku_col} AS sku,
                   MAX({config.inventory_date_col}) AS max_date
            FROM {config.inventory_table}
            GROUP BY {config.inventory_sku_col}
        ) latest
          ON i.{config.inventory_sku_col} = latest.sku
         AND i.{config.inventory_date_col} = latest.max_date
    """
    return pd.read_sql_query(query, conn)


def _load_lead_times(conn: sqlite3.Connection, config: ReorderConfig) -> pd.DataFrame:
    query = f"""
        SELECT {config.sku_master_sku_col} AS sku,
               {config.sku_master_lead_time_col} AS lead_time_days
        FROM {config.sku_master_table}
    """
    return pd.read_sql_query(query, conn)


def _filter_sales_types(df: pd.DataFrame, config: ReorderConfig) -> pd.DataFrame:
    if not config.sales_type_col or not config.sales_unit_types:
        return df
    types_set = set(config.sales_unit_types)
    return df[df["sale_type"].isin(types_set)].copy()


def _sum_units_by_sku(
    df: pd.DataFrame,
    start_date: str,
    end_date: str,
    config: ReorderConfig,
) -> pd.Series:
    if df.empty:
        return pd.Series(dtype="float64")
    mask = (df["sale_date"] >= start_date) & (df["sale_date"] <= end_date)
    subset = df[mask]
    if subset.empty:
        return pd.Series(dtype="float64")
    return subset["quantity"].astype(float).groupby(subset["sku"]).sum()


def _compute_velocity(
    units_30: pd.Series,
    units_60: pd.Series,
    short_window: int,
    long_window: int,
) -> pd.Series:
    # Prefer 60-day velocity when available; fallback to 30-day.
    all_skus = units_30.index.union(units_60.index)
    daily_velocity = pd.Series(index=all_skus, dtype="float64")

    for sku in all_skus:
        u60 = float(units_60.get(sku, 0.0))
        u30 = float(units_30.get(sku, 0.0))
        if u60 > 0:
            daily_velocity.loc[sku] = u60 / float(long_window)
        elif u30 > 0:
            daily_velocity.loc[sku] = u30 / float(short_window)
        else:
            daily_velocity.loc[sku] = 0.0

    return daily_velocity


def _recommended_qty(
    daily_velocity: pd.Series,
    reorder_point_days: pd.Series,
    on_hand: pd.Series,
) -> pd.Series:
    target = daily_velocity * reorder_point_days
    needed = target - on_hand
    return needed.where(needed > 0, 0.0)


def _stockout_date(snapshot_date: pd.Series, days_of_cover: pd.Series) -> pd.Series:
    dates = pd.to_datetime(snapshot_date, errors="coerce")
    cover_days = days_of_cover.replace([pd.NA, pd.NaT], 0).fillna(0.0)
    result = dates + pd.to_timedelta(cover_days, unit="D")
    return result.dt.strftime("%Y-%m-%dT%H:%M:%S").where(dates.notna(), None)


def _safe_divide(numerator: pd.Series, denominator: pd.Series) -> pd.Series:
    return numerator / denominator.replace({0: pd.NA})


def _parse_iso(value: str) -> datetime:
    return datetime.fromisoformat(value)


def _validate_config(config: ReorderConfig) -> None:
    if not config.sales_table:
        raise ValueError("sales_table is required")
    if not config.sales_date_col:
        raise ValueError("sales_date_col is required")
    if not config.sales_sku_col:
        raise ValueError("sales_sku_col is required")
    if not config.sales_qty_col:
        raise ValueError("sales_qty_col is required")
