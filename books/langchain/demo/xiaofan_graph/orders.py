"""Fixed order used by every chapter. Do not invent a second order id."""

ORDER_ID = "OD-2049"
TICKET = "售后升级：订单 OD-2049 客户投诉物流延迟"
TEAM = "xbd-seashore-cs-team"
MERCHANT = "海岸优品"
NAMESPACE = "seashore-main"

ORDER = {
    "order_id": ORDER_ID,
    "merchant": MERCHANT,
    "namespace": NAMESPACE,
    "status": "shipped",
    "carrier": "云途",
    "tracking": "YT-2049-88",
    "shipped_at": "2026-11-18",
    "promised_days": 7,
    "elapsed_days": 9,
    "delayed": True,
}

SHIPPING_TEXT = "订单 OD-2049 物流延迟，请处理"
REFUND_TEXT = "订单 OD-2049 我要退款"
OTHER_TEXT = "你们周末上班吗"


def lookup_order_record(order_id: str) -> dict | None:
    if order_id == ORDER_ID:
        return dict(ORDER)
    return None


def record_as_text(record: dict) -> str:
    return (
        f"order_id={record['order_id']} merchant={record['merchant']} "
        f"status={record['status']} carrier={record['carrier']} "
        f"tracking={record['tracking']} shipped_at={record['shipped_at']} "
        f"elapsed_days={record['elapsed_days']} promised_days={record['promised_days']} "
        f"delayed={str(record['delayed']).lower()}"
    )
