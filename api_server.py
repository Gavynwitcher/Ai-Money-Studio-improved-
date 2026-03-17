"""
Minimal HTTP API server for the Amazon Seller toolkit.

No external web frameworks are used (stdlib only). Uses pandas/sqlite3 via
existing modules. All requests and responses are JSON.

Run:
  python3 api_server.py --db data.db --host 127.0.0.1 --port 8080
"""

from __future__ import annotations

import argparse
import json
from http.server import BaseHTTPRequestHandler, HTTPServer
from typing import Any, Dict
from urllib.parse import urlparse

from parse_settlement import parse_settlement_csv
from parse_orders import parse_orders_csv
from parse_inventory import parse_inventory_snapshot_csv
from parse_fba_events import parse_fba_event_detail_csv
from pnl import PnlConfig, build_pnl_summary
from sku_profitability import ProfitConfig, calculate_sku_profitability
from reorder import ReorderConfig, calculate_reorder_recommendations
from weekly_brief import BriefConfig, generate_weekly_brief


def _read_json(handler: BaseHTTPRequestHandler) -> Dict[str, Any]:
    length = int(handler.headers.get("Content-Length", "0"))
    if length <= 0:
        return {}
    raw = handler.rfile.read(length)
    return json.loads(raw.decode("utf-8"))


def _write_json(handler: BaseHTTPRequestHandler, status: int, payload: Dict[str, Any]) -> None:
    data = json.dumps(payload, indent=2).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Content-Length", str(len(data)))
    handler.end_headers()
    handler.wfile.write(data)


class ApiHandler(BaseHTTPRequestHandler):
    db_path: str = "data.db"

    def do_GET(self) -> None:  # noqa: N802
        path = urlparse(self.path).path
        if path == "/health":
            _write_json(self, 200, {"status": "ok"})
            return
        _write_json(self, 404, {"error": "not_found"})

    def do_POST(self) -> None:  # noqa: N802
        path = urlparse(self.path).path
        try:
            payload = _read_json(self)
            if path == "/parse/settlement":
                result = parse_settlement_csv(payload["csv_path"], self.db_path)
                _write_json(self, 200, result.__dict__)
                return
            if path == "/parse/orders":
                result = parse_orders_csv(payload["csv_path"], self.db_path)
                _write_json(self, 200, result.__dict__)
                return
            if path == "/parse/inventory":
                result = parse_inventory_snapshot_csv(payload["csv_path"], self.db_path)
                _write_json(self, 200, result.__dict__)
                return
            if path == "/parse/fba-events":
                result = parse_fba_event_detail_csv(payload["csv_path"], self.db_path)
                _write_json(self, 200, result.__dict__)
                return
            if path == "/reports/pnl":
                config = PnlConfig(**payload["config"])
                df = build_pnl_summary(
                    self.db_path, payload["start_date"], payload["end_date"], config
                )
                _write_json(self, 200, {"rows": df.to_dict(orient="records")})
                return
            if path == "/reports/sku-profit":
                config = ProfitConfig(**payload["config"])
                df = calculate_sku_profitability(
                    self.db_path, payload["start_date"], payload["end_date"], config
                )
                _write_json(self, 200, {"rows": df.to_dict(orient="records")})
                return
            if path == "/reports/reorder":
                config = ReorderConfig(**payload["config"])
                df = calculate_reorder_recommendations(
                    self.db_path,
                    payload["as_of_date"],
                    config,
                    safety_stock_days=payload.get("safety_stock_days", 10),
                )
                _write_json(self, 200, {"rows": df.to_dict(orient="records")})
                return
            if path == "/reports/weekly-brief":
                pnl_config = PnlConfig(**payload["pnl_config"])
                profit_config = ProfitConfig(**payload["profit_config"])
                reorder_config = ReorderConfig(**payload["reorder_config"])
                brief_cfg = payload.get("brief_config")
                brief_config = BriefConfig(**brief_cfg) if brief_cfg else None
                md = generate_weekly_brief(
                    self.db_path,
                    payload["start_date"],
                    payload["end_date"],
                    payload["prior_start_date"],
                    payload["prior_end_date"],
                    pnl_config,
                    profit_config,
                    reorder_config,
                    brief_config,
                )
                _write_json(self, 200, {"markdown": md})
                return
        except KeyError as exc:
            _write_json(self, 400, {"error": f"missing_field: {exc}"})
            return
        except json.JSONDecodeError:
            _write_json(self, 400, {"error": "invalid_json"})
            return
        except Exception as exc:
            _write_json(self, 500, {"error": str(exc)})
            return

        _write_json(self, 404, {"error": "not_found"})

    def log_message(self, fmt: str, *args: Any) -> None:  # noqa: D401
        # Quiet default logging; adjust if needed.
        return


def main() -> None:
    parser = argparse.ArgumentParser(description="Amazon Seller Toolkit API server")
    parser.add_argument("--db", dest="db_path", default="data.db")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8080)
    args = parser.parse_args()

    ApiHandler.db_path = args.db_path
    server = HTTPServer((args.host, args.port), ApiHandler)
    print(f"Listening on http://{args.host}:{args.port} using db {args.db_path}")
    server.serve_forever()


if __name__ == "__main__":
    main()
