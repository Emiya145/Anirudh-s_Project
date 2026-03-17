from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal

from django.db import transaction
from django.db.models import F

from .exceptions import InsufficientStockError
from .models import (
    FinishedGoodLedgerEntry,
    FinishedGoodLot,
    IngredientLot,
    StockLedgerEntry,
)


@dataclass(frozen=True)
class LotConsumption:
    lot_id: int
    quantity: Decimal


def _to_decimal(value) -> Decimal:
    if isinstance(value, Decimal):
        return value
    return Decimal(str(value))


@transaction.atomic
def consume_ingredient_fefo(
    *,
    location_id: int,
    ingredient_id: int,
    required_quantity,
    source_type: str,
    source_id: str,
) -> list[LotConsumption]:
    required = _to_decimal(required_quantity)
    if required <= 0:
        return []

    lots = (
        IngredientLot.objects.select_for_update()
        .filter(
            location_id=location_id,
            ingredient_id=ingredient_id,
            quantity_remaining__gt=0,
        )
        .order_by(F("expiry_date").asc(nulls_last=True), "received_date", "id")
    )

    remaining = required
    consumed: list[LotConsumption] = []

    for lot in lots:
        if remaining <= 0:
            break

        take = min(lot.quantity_remaining, remaining)
        if take <= 0:
            continue

        lot.quantity_remaining = lot.quantity_remaining - take
        lot.save(update_fields=["quantity_remaining"])

        StockLedgerEntry.objects.create(
            location_id=location_id,
            ingredient_id=ingredient_id,
            lot_id=lot.id,
            delta_quantity=-take,
            reason=StockLedgerEntry.Reason.PRODUCTION_CONSUMPTION,
            source_type=source_type,
            source_id=source_id,
        )

        consumed.append(LotConsumption(lot_id=lot.id, quantity=take))
        remaining -= take

    if remaining > 0:
        raise InsufficientStockError(
            f"Insufficient ingredient stock: ingredient={ingredient_id} required={required} missing={remaining}"
        )

    return consumed


@transaction.atomic
def consume_finished_goods_fefo(
    *,
    location_id: int,
    product_id: int,
    required_quantity,
    source_type: str,
    source_id: str,
) -> list[LotConsumption]:
    required = _to_decimal(required_quantity)
    if required <= 0:
        return []

    lots = (
        FinishedGoodLot.objects.select_for_update()
        .filter(
            location_id=location_id,
            product_id=product_id,
            quantity_remaining__gt=0,
        )
        .order_by(F("expiry_date").asc(nulls_last=True), "produced_at", "id")
    )

    remaining = required
    consumed: list[LotConsumption] = []

    for lot in lots:
        if remaining <= 0:
            break

        take = min(lot.quantity_remaining, remaining)
        if take <= 0:
            continue

        lot.quantity_remaining = lot.quantity_remaining - take
        lot.save(update_fields=["quantity_remaining"])

        FinishedGoodLedgerEntry.objects.create(
            location_id=location_id,
            product_id=product_id,
            lot_id=lot.id,
            delta_quantity=-take,
            reason=FinishedGoodLedgerEntry.Reason.SALE,
            source_type=source_type,
            source_id=source_id,
        )

        consumed.append(LotConsumption(lot_id=lot.id, quantity=take))
        remaining -= take

    if remaining > 0:
        raise InsufficientStockError(
            f"Insufficient finished goods stock: product={product_id} required={required} missing={remaining}"
        )

    return consumed
