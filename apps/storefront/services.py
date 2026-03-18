from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from decimal import Decimal

from django.db import transaction
from django.db.models import F

from apps.inventory.exceptions import InsufficientStockError
from apps.inventory.models import FinishedGoodLedgerEntry, FinishedGoodLot

from .models import StoreOrder, StoreOrderLine, StoreOrderReservation


@dataclass(frozen=True)
class ReservationConsumption:
    lot_id: int
    quantity: Decimal


def _to_decimal(value) -> Decimal:
    if isinstance(value, Decimal):
        return value
    return Decimal(str(value))


@transaction.atomic
def reserve_finished_goods_fefo(
    *,
    order: StoreOrder,
    line: StoreOrderLine,
    product_id: int,
    required_quantity,
) -> list[StoreOrderReservation]:
    required = _to_decimal(required_quantity)
    if required <= 0:
        return []

    lots = (
        FinishedGoodLot.objects.select_for_update()
        .filter(
            location_id=order.location_id,
            product_id=product_id,
            quantity_remaining__gt=0,
        )
        .order_by(F("expiry_date").asc(nulls_last=True), "produced_at", "id")
    )

    remaining = required
    reservations: list[StoreOrderReservation] = []

    for lot in lots:
        if remaining <= 0:
            break

        take = min(lot.quantity_remaining, remaining)
        if take <= 0:
            continue

        lot.quantity_remaining = lot.quantity_remaining - take
        lot.save(update_fields=["quantity_remaining"])

        ledger = FinishedGoodLedgerEntry.objects.create(
            location_id=order.location_id,
            product_id=product_id,
            lot_id=lot.id,
            delta_quantity=-take,
            reason=FinishedGoodLedgerEntry.Reason.RESERVED,
            source_type="store_order",
            source_id=str(order.id),
        )

        reservations.append(
            StoreOrderReservation.objects.create(
                order=order,
                line=line,
                finished_good_lot_id=lot.id,
                quantity_reserved=take,
                ledger_entry=ledger,
                status=StoreOrderReservation.Status.RESERVED,
            )
        )

        remaining -= take

    if remaining > 0:
        raise InsufficientStockError(
            f"Insufficient finished goods stock: product={product_id} required={required} missing={remaining}"
        )

    return reservations


@transaction.atomic
def release_store_order_reservations(*, order: StoreOrder) -> int:
    order = StoreOrder.objects.select_for_update().get(pk=order.id)

    reservations = (
        StoreOrderReservation.objects.select_for_update()
        .select_related("finished_good_lot", "ledger_entry")
        .filter(order=order, status=StoreOrderReservation.Status.RESERVED)
    )

    released = 0
    for r in reservations:
        lot = FinishedGoodLot.objects.select_for_update().get(pk=r.finished_good_lot_id)
        lot.quantity_remaining = lot.quantity_remaining + r.quantity_reserved
        lot.save(update_fields=["quantity_remaining"])

        FinishedGoodLedgerEntry.objects.create(
            location_id=order.location_id,
            product_id=lot.product_id,
            lot_id=lot.id,
            delta_quantity=r.quantity_reserved,
            reason=FinishedGoodLedgerEntry.Reason.RELEASED,
            source_type="store_order",
            source_id=str(order.id),
        )

        r.status = StoreOrderReservation.Status.RELEASED
        r.save(update_fields=["status"])
        released += 1

    return released


@transaction.atomic
def consume_store_order_reservations(*, order: StoreOrder) -> int:
    order = StoreOrder.objects.select_for_update().get(pk=order.id)

    reservations = (
        StoreOrderReservation.objects.select_for_update()
        .select_related("ledger_entry")
        .filter(order=order, status=StoreOrderReservation.Status.RESERVED)
    )

    consumed = 0
    for r in reservations:
        if r.ledger_entry_id:
            FinishedGoodLedgerEntry.objects.filter(pk=r.ledger_entry_id).update(
                reason=FinishedGoodLedgerEntry.Reason.SALE
            )
        r.status = StoreOrderReservation.Status.CONSUMED
        r.save(update_fields=["status"])
        consumed += 1

    return consumed
