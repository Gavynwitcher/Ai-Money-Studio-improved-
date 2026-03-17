"""
SKU-level profitability from settlement data for a given date range.

This module does not assume any Amazon-specific column names. You must provide
the settlement line-item table and column mappings via ProfitConfig.

Rules enforced:
- Revenue is settlement-driven.
- Fees are summed from settlement fee types.
- Refunds reduce revenue.
- Reimbursements increase revenue.
- COGS = units sold * sku_master.unit_cost.
"""

from __future__ import annotations

from dataclasses import dataclass
import sqlite3
from typing import Iterable, Optional

import pandas as pd


@dataclass(frozen=True)
class ProfitConfig:
    """
    Configuration for settlement-driven profitability.

    You must supply the settlement line-item table and column names.
    The type column is used to map rows into revenue/fee/refund/reimbursement/units.
    """

    settlement_table: str
    date_col: str
    sku_col: str
    amount_col: str
    type_col: str
    qty_col: str

    revenue_types: Iterable[str]
    fee_types: Iterable[str]
    refund_types: Iterable[str]
    reimbursement_types: Iterable[str]
    unit_sold_types: Iterable[str]

    sku_master_table: str = "sku_master"
    unit_cost_col: str = "unit_cost"


def calculate_sku_profitability(
    db_path: str,
    start_date: str,
    end_date: str,
    config: ProfitConfig,
) -> pd.DataFrame:
    """
    Calculate SKU-level profitability for a date range (inclusive).

    Args:
        db_path: SQLite database path.
        start_date: ISO date/time string (inclusive).
        end_date: ISO date/time string (inclusive).
        config: ProfitConfig with table/column mappings and type categories.

    Returns:
        DataFrame with columns:
        sku, gross_revenue, total_fees, cogs, net_profit, margin_pct
    """
    _validate_config(config)

    query = f"""
        SELECT
            {config.sku_col} AS sku,
            {config.amount_col} AS amount,
            {config.type_col} AS type,
            {config.qty_col} AS qty
        FROM {config.settlement_table}
        WHERE {config.date_col} BETWEEN ? AND ?
    """

    with sqlite3.connect(db_path) as conn:
        df = pd.read_sql_query(query, conn, params=(start_date, end_date))
        sku_master = pd.read_sql_query(
            f"SELECT sku, {config.unit_cost_col} AS unit_cost FROM {config.sku_master_table}",
            conn,
        )

    if df.empty:
        return _empty_result()

    df["type"] = df["type"].astype(str)

    revenue = _sum_by_type(
        df,
        config.revenue_types,
        amount_sign="as_is",
    )
    reimbursements = _sum_by_type(
        df,
        config.reimbursement_types,
        amount_sign="positive",
    )
    refunds = _sum_by_type(
        df,
        config.refund_types,
        amount_sign="negative",
    )
    fees = _sum_by_type(
        df,
        config.fee_types,
        amount_sign="as_is",
    )

    units = _sum_units_by_type(
        df,
        config.unit_sold_types,
        config.refund_types,
    )

    result = (
        revenue.add(reimbursements, fill_value=0.0)
        .add(refunds, fill_value=0.0)
        .rename("gross_revenue")
        .to_frame()
    )
    result["total_fees"] = fees
    result = result.join(units.rename("units_sold"), how="outer")

    result = result.reset_index().rename(columns={"index": "sku"})
    result = result.merge(sku_master, on="sku", how="left")

    result["units_sold"] = result["units_sold"].fillna(0.0)
    result["unit_cost"] = result["unit_cost"].fillna(0.0)
    result["cogs"] = result["units_sold"] * result["unit_cost"]
    result["gross_revenue"] = result["gross_revenue"].fillna(0.0)
    result["total_fees"] = result["total_fees"].fillna(0.0)
    result["net_profit"] = result["gross_revenue"] - result["total_fees"] - result["cogs"]

    result["margin_pct"] = _safe_margin(result["net_profit"], result["gross_revenue"])

    return result[
        ["sku", "gross_revenue", "total_fees", "cogs", "net_profit", "margin_pct"]
    ].sort_values("net_profit", ascending=False)


def _sum_by_type(
    df: pd.DataFrame,
    types: Iterable[str],
    amount_sign: str,
) -> pd.Series:
    """
    Sum amounts by type with explicit sign handling.
    """
    types_set = set(types)
    subset = df[df["type"].isin(types_set)]
    if subset.empty:
        return pd.Series(dtype="float64")

    amounts = subset["amount"].astype(float)
    if amount_sign == "positive":
        amounts = amounts.abs()
    elif amount_sign == "negative":
        amounts = -amounts.abs()

    return amounts.groupby(subset["sku"]).sum()


def _sum_units_by_type(
    df: pd.DataFrame,
    unit_sold_types: Iterable[str],
    refund_types: Iterable[str],
) -> pd.Series:
    """
    Sum units sold; refunds reduce units sold.
    """
    unit_types = set(unit_sold_types)
    refund_types = set(refund_types)

    sold = df[df["type"].isin(unit_types)]
    refunded = df[df["type"].isin(refund_types)]

    sold_units = sold["qty"].astype(float).groupby(sold["sku"]).sum() if not sold.empty else pd.Series(dtype="float64")
    refunded_units = refunded["qty"].astype(float).abs().groupby(refunded["sku"]).sum() if not refunded.empty else pd.Series(dtype="float64")

    return sold_units.sub(refunded_units, fill_value=0.0)


def _safe_margin(net_profit: pd.Series, gross_revenue: pd.Series) -> pd.Series:
    """
    Calculate margin percentage with safe division.
    """
    return (net_profit / gross_revenue.replace({0: pd.NA})) * 100.0


def _validate_config(config: ProfitConfig) -> None:
    """
    Validate required config fields are present.
    """
    if not config.settlement_table:
        raise ValueError("settlement_table is required")
    if not config.date_col:
        raise ValueError("date_col is required")
    if not config.sku_col:
        raise ValueError("sku_col is required")
    if not config.amount_col:
        raise ValueError("amount_col is required")
    if not config.type_col:
        raise ValueError("type_col is required")
    if not config.qty_col:
        raise ValueError("qty_col is required")


def _empty_result() -> pd.DataFrame:
    """
    Empty result frame with expected columns.
    """
    return pd.DataFrame(
        columns=["sku", "gross_revenue", "total_fees", "cogs", "net_profit", "margin_pct"]
    )
