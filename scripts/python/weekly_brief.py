"""
Generate an executive-friendly weekly Markdown brief for Amazon sellers.

This module is settlement-driven: revenue and fees are sourced from settlement data
through the provided PnlConfig and ProfitConfig. Orders are never used as revenue.

Assumptions (explicit, minimal):
- You provide PnlConfig/ProfitConfig/ReorderConfig mappings to your actual schema.
- Prior period dates are provided for change comparisons.
- Inventory risk alerts are derived from reorder outputs (low days_of_cover).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

import pandas as pd

from pnl import PnlConfig, build_pnl_summary
from sku_profitability import ProfitConfig, calculate_sku_profitability
from reorder import ReorderConfig, calculate_reorder_recommendations


@dataclass(frozen=True)
class BriefConfig:
    """
    Configuration for brief thresholds and limits.
    """

    top_sku_limit: int = 10
    loss_sku_limit: int = 10
    low_cover_days: float = 14.0
    reorder_limit: int = 10


def generate_weekly_brief(
    db_path: str,
    start_date: str,
    end_date: str,
    prior_start_date: str,
    prior_end_date: str,
    pnl_config: PnlConfig,
    profit_config: ProfitConfig,
    reorder_config: ReorderConfig,
    brief_config: Optional[BriefConfig] = None,
) -> str:
    """
    Generate a Markdown report with key financial and inventory insights.

    Args:
        db_path: SQLite database path.
        start_date: Current period start (ISO string).
        end_date: Current period end (ISO string).
        prior_start_date: Prior period start (ISO string).
        prior_end_date: Prior period end (ISO string).
        pnl_config: Settlement-driven P&L config.
        profit_config: Settlement-driven SKU profitability config.
        reorder_config: Reorder recommendation config.
        brief_config: Optional BriefConfig for thresholds.

    Returns:
        Markdown string.
    """
    brief_config = brief_config or BriefConfig()

    pnl_current = build_pnl_summary(db_path, start_date, end_date, pnl_config)
    pnl_prior = build_pnl_summary(db_path, prior_start_date, prior_end_date, pnl_config)

    sku_profit = calculate_sku_profitability(db_path, start_date, end_date, profit_config)
    sku_profit_prior = calculate_sku_profitability(db_path, prior_start_date, prior_end_date, profit_config)

    reorder = calculate_reorder_recommendations(db_path, end_date, reorder_config)

    net_profit_current = _get_pnl_value(pnl_current, "Net Profit")
    net_profit_prior = _get_pnl_value(pnl_prior, "Net Profit")
    net_profit_delta = net_profit_current - net_profit_prior

    top_skus = sku_profit.nlargest(brief_config.top_sku_limit, "net_profit")
    loss_skus = sku_profit[sku_profit["net_profit"] < 0].nsmallest(
        brief_config.loss_sku_limit, "net_profit"
    )

    inventory_risk = reorder[reorder["days_of_cover"] <= brief_config.low_cover_days].copy()
    inventory_risk = inventory_risk.sort_values("days_of_cover")

    reorder_recs = reorder[reorder["recommended_order_qty"] > 0].copy()
    reorder_recs = reorder_recs.sort_values("recommended_order_qty", ascending=False).head(
        brief_config.reorder_limit
    )

    key_changes = _key_changes_vs_prior(sku_profit, sku_profit_prior)

    sections = [
        _section_net_profit_summary(net_profit_current, net_profit_delta, start_date, end_date),
        _section_top_skus(top_skus),
        _section_loss_skus(loss_skus),
        _section_inventory_risk(inventory_risk, brief_config.low_cover_days),
        _section_reorder_recommendations(reorder_recs),
        _section_key_changes(key_changes),
    ]

    return "\n\n".join(sections).strip() + "\n"


def _get_pnl_value(pnl_df: pd.DataFrame, category: str) -> float:
    row = pnl_df[pnl_df["category"] == category]
    if row.empty:
        return 0.0
    return float(row["amount"].iloc[0])


def _section_net_profit_summary(net_profit: float, delta: float, start: str, end: str) -> str:
    direction = "up" if delta >= 0 else "down"
    return (
        "## Net profit summary\n"
        f"Period: {start} to {end}\n\n"
        f"Net profit: {net_profit:,.2f}\n\n"
        f"Change vs prior period: {delta:,.2f} ({direction})."
    )


def _section_top_skus(df: pd.DataFrame) -> str:
    lines = ["## Top profitable SKUs"]
    if df.empty:
        lines.append("No profitable SKUs in this period.")
        return "\n".join(lines)
    for _, row in df.iterrows():
        lines.append(
            f"- {row['sku']}: profit {row['net_profit']:,.2f}, "
            f"margin {row['margin_pct']:.1f}%"
        )
    return "\n".join(lines)


def _section_loss_skus(df: pd.DataFrame) -> str:
    lines = ["## Loss-making SKUs"]
    if df.empty:
        lines.append("No loss-making SKUs in this period.")
        return "\n".join(lines)
    for _, row in df.iterrows():
        lines.append(
            f"- {row['sku']}: loss {row['net_profit']:,.2f}, "
            f"margin {row['margin_pct']:.1f}%"
        )
    return "\n".join(lines)


def _section_inventory_risk(df: pd.DataFrame, threshold_days: float) -> str:
    lines = ["## Inventory risk alerts"]
    if df.empty:
        lines.append("No SKUs below the inventory cover threshold.")
        return "\n".join(lines)
    lines.append(f"Threshold: {threshold_days:.0f} days of cover or less.")
    for _, row in df.iterrows():
        lines.append(
            f"- {row['sku']}: {row['days_of_cover']:.1f} days cover, "
            f"expected stockout {row['expected_stockout_date']}"
        )
    return "\n".join(lines)


def _section_reorder_recommendations(df: pd.DataFrame) -> str:
    lines = ["## Reorder recommendations"]
    if df.empty:
        lines.append("No reorder recommendations for this period.")
        return "\n".join(lines)
    for _, row in df.iterrows():
        lines.append(
            f"- {row['sku']}: order {row['recommended_order_qty']:.0f} units, "
            f"cover {row['days_of_cover']:.1f} days"
        )
    return "\n".join(lines)


def _section_key_changes(df: pd.DataFrame) -> str:
    lines = ["## Key changes vs prior period"]
    if df.empty:
        lines.append("No significant SKU profit changes detected.")
        return "\n".join(lines)
    for _, row in df.iterrows():
        lines.append(
            f"- {row['sku']}: profit change {row['profit_change']:,.2f}"
        )
    return "\n".join(lines)


def _key_changes_vs_prior(current: pd.DataFrame, prior: pd.DataFrame) -> pd.DataFrame:
    if current.empty:
        return pd.DataFrame(columns=["sku", "profit_change"])
    merged = current[["sku", "net_profit"]].merge(
        prior[["sku", "net_profit"]], on="sku", how="left", suffixes=("", "_prior")
    )
    merged["net_profit_prior"] = merged["net_profit_prior"].fillna(0.0)
    merged["profit_change"] = merged["net_profit"] - merged["net_profit_prior"]
    return merged.sort_values("profit_change", ascending=False).head(10)
