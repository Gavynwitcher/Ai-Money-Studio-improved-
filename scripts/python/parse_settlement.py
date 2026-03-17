"""
Parse Amazon Settlement transaction CSV files and insert rows into a SQLite table.

Assumptions (explicit, minimal):
- The target table already exists and is named "settlement_lines" by default.
- Column names are normalized to snake_case from the CSV headers.
- No aggregation is performed: one CSV row becomes one DB row.
- Monetary columns are detected heuristically by column name and stored as signed floats.
- Date/time columns are detected heuristically by column name and stored as ISO strings.
"""

from __future__ import annotations

from dataclasses import dataclass
import csv
import re
import sqlite3
from typing import Optional

import pandas as pd


MONEY_COL_RE = re.compile(r"(amount|fee|price|tax|total)", re.IGNORECASE)
DATE_COL_RE = re.compile(r"(date|time)", re.IGNORECASE)
SUMMARY_TOKENS = {"TOTAL", "SUMMARY", "GRAND TOTAL"}


@dataclass(frozen=True)
class ParseResult:
    """Summary of a parse/insert run."""

    rows_read: int
    rows_inserted: int
    table_name: str


def parse_settlement_csv(
    csv_path: str,
    db_path: str,
    table_name: str = "settlement_lines",
    chunksize: Optional[int] = None,
) -> ParseResult:
    """
    Parse a Settlement transaction CSV and insert rows into SQLite.

    Args:
        csv_path: Path to the Settlement CSV file.
        db_path: Path to the SQLite database file.
        table_name: Target table name (default: "settlements").
        chunksize: Optional chunk size for large CSVs.

    Returns:
        ParseResult with row counts.
    """
    rows_read = 0
    rows_inserted = 0

    header_idx = _detect_header_row(csv_path)

    with sqlite3.connect(db_path) as conn:
        if chunksize:
            for chunk in pd.read_csv(
                csv_path,
                dtype=str,
                keep_default_na=False,
                chunksize=chunksize,
                skiprows=header_idx,
            ):
                rows_read += len(chunk)
                cleaned = _clean_settlement_frame(chunk)
                rows_inserted += _insert_frame(conn, cleaned, table_name)
        else:
            df = pd.read_csv(csv_path, dtype=str, keep_default_na=False, skiprows=header_idx)
            rows_read = len(df)
            cleaned = _clean_settlement_frame(df)
            rows_inserted = _insert_frame(conn, cleaned, table_name)

    return ParseResult(rows_read=rows_read, rows_inserted=rows_inserted, table_name=table_name)


def _clean_settlement_frame(df: pd.DataFrame) -> pd.DataFrame:
    """
    Normalize headers, drop summary rows, and normalize money/date columns.
    """
    df = df.copy()
    df.columns = [_to_snake(col) for col in df.columns]

    df = df[~_is_summary_row(df)].copy()

    for col in df.columns:
        if _is_money_col(col):
            df[col] = df[col].map(_to_float)
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


def _detect_header_row(csv_path: str) -> int:
    """
    Detect the header row index for settlement transaction reports that
    include a preamble. Returns 0 if no preamble is detected.
    """
    required = {"date/time", "settlement id", "type", "total"}
    with open(csv_path, newline="", encoding="utf-8-sig") as f:
        reader = csv.reader(f)
        for idx, row in enumerate(reader):
            row_l = {cell.strip().lower() for cell in row if cell.strip()}
            if required.issubset(row_l):
                return idx
    return 0


def _to_snake(name: str) -> str:
    """
    Convert header names to snake_case.
    """
    name = name.strip()
    name = re.sub(r"[^\w]+", "_", name)
    name = re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", name)
    name = re.sub(r"_+", "_", name)
    return name.strip("_").lower()


def _is_money_col(col: str) -> bool:
    """
    Heuristic: columns containing amount/fee/price/tax/total, excluding currency columns.
    """
    if "currency" in col.lower():
        return False
    return bool(MONEY_COL_RE.search(col))


def _is_date_col(col: str) -> bool:
    """
    Heuristic: columns containing date/time.
    """
    return bool(DATE_COL_RE.search(col))


def _to_float(value: str) -> Optional[float]:
    """
    Convert currency-like strings to float, preserving sign.
    Accepts negatives formatted with leading '-' or parentheses.
    Returns None for empty/invalid values.
    """
    if value is None:
        return None
    text = str(value).strip()
    if text == "":
        return None

    is_negative = False
    if text.startswith("(") and text.endswith(")"):
        is_negative = True
        text = text[1:-1]

    text = text.replace(",", "")
    text = re.sub(r"[^\d\.\-]", "", text)
    if text == "":
        return None

    try:
        num = float(text)
    except ValueError:
        return None

    if is_negative:
        num = -abs(num)
    return num


def _to_iso(series: pd.Series) -> pd.Series:
    """
    Convert a pandas Series of date/time strings to ISO format.
    Unparseable values become None.
    """
    parsed = pd.to_datetime(series, errors="coerce", utc=False)
    return parsed.dt.strftime("%Y-%m-%dT%H:%M:%S").where(parsed.notna(), None)


def _is_summary_row(df: pd.DataFrame) -> pd.Series:
    """
    Identify summary/total rows. Conservatively flags rows that contain summary tokens.
    """
    upper = df.astype(str).applymap(lambda x: x.strip().upper() if x else "")
    return upper.apply(lambda row: any(cell in SUMMARY_TOKENS for cell in row), axis=1)
