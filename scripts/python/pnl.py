"""
Settlement-driven P&L summary for a given date range.

This module does not assume any Amazon-specific column names. You must provide
the settlement line-item table and column mappings via PnlConfig.

Rules enforced:
- Revenue is settlement-driven (orders are never used).
- Refunds reduce revenue.
- Reimbursements increase revenue.
- Fees are summed from settlement fee types.
"""

from __future__ import annotations

from dataclasses import dataclass
import sqlite3
from typing import Iterable

import pandas as pd


@dataclass(frozen=True)
class PnlConfig:
    """
    Configuration for settlement-driven P&L.
    """

    settlement_table: str
    date_col: str
    amount_col: str
    type_col: str

    revenue_types: Iterable[str]
    fee_types: Iterable[str]
    refund_types: Iterable[str]
    reimbursement_types: Iterable[str]

    cogs_table: str = "sku_master"
    cogs_units_table: str = "orders"
    cogs_unit_cost_col: str = "unit_cost"
    cogs_units_sku_col: str = "sku"
    cogs_units_qty_col: str = "quantity"
    cogs_units_date_col: str = "purchase_date"


def build_pnl_summary(
    db_path: str,
    start_date: str,
    end_date: str,
    config: PnlConfig,
) -> pd.DataFrame:
    """
    Build a P&L summary for a date range (inclusive).

    Args:
        db_path: SQLite database path.
        start_date: ISO date/time string (inclusive).
        end_date: ISO date/time string (inclusive).
        config: PnlConfig with table/column mappings and type categories.

    Returns:
        DataFrame with columns: category, amount
    """
    _validate_config(config)

    with sqlite3.connect(db_path) as conn:
        settlement_df = pd.read_sql_query(
            f"""
            SELECT {config.amount_col} AS amount, {config.type_col} AS type
            FROM {config.settlement_table}
            WHERE {config.date_col} BETWEEN ? AND ?
            """,
            conn,
            params=(start_date, end_date),
        )

        cogs_df = pd.read_sql_query(
            f"""
            SELECT o.{config.cogs_units_sku_col} AS sku,
                   o.{config.cogs_units_qty_col} AS quantity,
                   s.{config.cogs_unit_cost_col} AS unit_cost
            FROM {config.cogs_units_table} o
            JOIN {config.cogs_table} s
              ON o.{config.cogs_units_sku_col} = s.sku
            WHERE o.{config.cogs_units_date_col} BETWEEN ? AND ?
            """,
            conn,
            params=(start_date, end_date),
        )

    gross_revenue = _sum_by_type(settlement_df, config.revenue_types, amount_sign="as_is")
    refunds = _sum_by_type(settlement_df, config.refund_types, amount_sign="negative")
    reimbursements = _sum_by_type(settlement_df, config.reimbursement_types, amount_sign="positive")
    fees = _sum_by_type(settlement_df, config.fee_types, amount_sign="as_is")

    cogs = _compute_cogs(cogs_df)

    net_profit = gross_revenue + refunds + reimbursements - fees - cogs

    return pd.DataFrame(
        [
            {"category": "Gross Revenue", "amount": gross_revenue + refunds + reimbursements},
            {"category": "Amazon Fees", "amount": fees},
            {"category": "COGS", "amount": cogs},
            {"category": "Refunds", "amount": refunds},
            {"category": "Reimbursements", "amount": reimbursements},
            {"category": "Net Profit", "amount": net_profit},
        ]
    )


def _sum_by_type(df: pd.DataFrame, types: Iterable[str], amount_sign: str) -> float:
    """
    Sum amounts by type with explicit sign handling.
    """
    if df.empty:
        return 0.0

    types_set = set(types)
    subset = df[df["type"].isin(types_set)]
    if subset.empty:
        return 0.0

    amounts = subset["amount"].astype(float)
    if amount_sign == "positive":
        amounts = amounts.abs()
    elif amount_sign == "negative":
        amounts = -amounts.abs()

    return float(amounts.sum())


def _compute_cogs(cogs_df: pd.DataFrame) -> float:
    """
    Compute COGS as sum(quantity * unit_cost).
    """
    if cogs_df.empty:
        return 0.0
    qty = cogs_df["quantity"].astype(float)
    cost = cogs_df["unit_cost"].astype(float)
    return float((qty * cost).sum())


def _validate_config(config: PnlConfig) -> None:
    """
    Validate required config fields are present.
    """
    if not config.settlement_table:
        raise ValueError("settlement_table is required")
    if not config.date_col:
        raise ValueError("date_col is required")
    if not config.amount_col:
        raise ValueError("amount_col is required")
    if not config.type_col:
        raise ValueError("type_col is required")
