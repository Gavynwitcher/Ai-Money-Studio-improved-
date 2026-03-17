"""
Parse Amazon Inventory Snapshot CSV files and insert daily SKU positions into SQLite.

Assumptions (explicit, minimal):
- The target table already exists and is named "inventory_snapshots" by default.
- Column names are normalized to snake_case from the CSV headers.
- Required columns after normalization: sku, snapshot_date, fulfillable, inbound, reserved, unfulfillable.
- One CSV row = one DB row; no aggregation is performed.
"""

from __future__ import annotations

from dataclasses import dataclass
import re
import sqlite3
from typing import Optional

import pandas as pd


DATE_COL_RE = re.compile(r"(date|time)", re.IGNORECASE)


@dataclass(frozen=True)
class ParseResult:
    """Summary of a parse/insert run."""

    rows_read: int
    rows_inserted: int
    table_name: str


def parse_inventory_snapshot_csv(
    csv_path: str,
    db_path: str,
    table_name: str = "inventory_snapshots",
    chunksize: Optional[int] = None,
) -> ParseResult:
    """
    Parse an Inventory Snapshot CSV and insert rows into SQLite.

    Args:
        csv_path: Path to the Inventory Snapshot CSV file.
        db_path: Path to the SQLite database file.
        table_name: Target table name (default: "inventory_snapshots").
        chunksize: Optional chunk size for large CSVs.

    Returns:
        ParseResult with row counts.
    """
    rows_read = 0
    rows_inserted = 0

    with sqlite3.connect(db_path) as conn:
        if chunksize:
            for chunk in pd.read_csv(csv_path, dtype=str, keep_default_na=False, chunksize=chunksize):
                rows_read += len(chunk)
                cleaned = _clean_inventory_frame(chunk)
                rows_inserted += _insert_frame(conn, cleaned, table_name)
        else:
            df = pd.read_csv(csv_path, dtype=str, keep_default_na=False)
            rows_read = len(df)
            cleaned = _clean_inventory_frame(df)
            rows_inserted = _insert_frame(conn, cleaned, table_name)

    return ParseResult(rows_read=rows_read, rows_inserted=rows_inserted, table_name=table_name)


def _clean_inventory_frame(df: pd.DataFrame) -> pd.DataFrame:
    """
    Normalize headers and enforce required columns for inventory snapshots.
    """
    df = df.copy()
    df.columns = [_to_snake(col) for col in df.columns]

    required = {
        "sku",
        "snapshot_date",
        "fulfillable",
        "inbound",
        "reserved",
        "unfulfillable",
    }
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"Missing required columns: {sorted(missing)}")

    for col in df.columns:
        if col in {"fulfillable", "inbound", "reserved", "unfulfillable"}:
            df[col] = df[col].map(_to_int)
        elif _is_date_col(col):
            df[col] = _to_iso(df[col])

    return df


def _insert_frame(conn: sqlite3.Connection, df: pd.DataFrame, table_name: str) -> int:
    """
    Insert a DataFrame into SQLite without aggregation.
    """
    if df.empty:
        return 0

    columns = list(df.columns)
    placeholders = ",".join(["?"] * len(columns))
    col_sql = ",".join(columns)
    sql = f"INSERT INTO {table_name} ({col_sql}) VALUES ({placeholders})"

    rows = df.itertuples(index=False, name=None)
    conn.executemany(sql, rows)
    conn.commit()
    return len(df)


def _to_snake(name: str) -> str:
    """
    Convert header names to snake_case.
    """
    name = name.strip()
    name = re.sub(r"[^\w]+", "_", name)
    name = re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", name)
    name = re.sub(r"_+", "_", name)
    return name.strip("_").lower()


def _is_date_col(col: str) -> bool:
    """
    Heuristic: columns containing date/time.
    """
    return bool(DATE_COL_RE.search(col))


def _to_int(value: str) -> Optional[int]:
    """
    Convert numeric-like strings to int. Returns None for empty/invalid values.
    """
    if value is None:
        return None
    text = str(value).strip()
    if text == "":
        return None
    text = text.replace(",", "")
    try:
        return int(float(text))
    except ValueError:
        return None


def _to_iso(series: pd.Series) -> pd.Series:
    """
    Convert a pandas Series of date/time strings to ISO format.
    Unparseable values become None.
    """
    parsed = pd.to_datetime(series, errors="coerce", utc=False)
    return parsed.dt.strftime("%Y-%m-%dT%H:%M:%S").where(parsed.notna(), None)
