from datetime import date, timedelta
from decimal import Decimal

from celery import shared_task
from django.db.models import Sum

from apps.inventory.models import (
    FinishedGoodLot,
    Ingredient,
    IngredientLocationSettings,
    IngredientLot,
    ProductDailyTarget,
)

from .models import Notification


@shared_task
def check_low_stock() -> int:
    created = 0

    totals = (
        IngredientLot.objects.filter(quantity_remaining__gt=0)
        .values("location_id", "ingredient_id")
        .annotate(on_hand=Sum("quantity_remaining"))
    )

    threshold_map = {
        (s.location_id, s.ingredient_id): s.low_stock_threshold
        for s in IngredientLocationSettings.objects.all()
    }

    default_threshold_map = {
        i.id: i.default_low_stock_threshold for i in Ingredient.objects.all()
    }

    for row in totals:
        location_id = row["location_id"]
        ingredient_id = row["ingredient_id"]
        on_hand = row["on_hand"] or Decimal("0")

        threshold = threshold_map.get((location_id, ingredient_id))
        if threshold is None:
            threshold = default_threshold_map.get(ingredient_id, Decimal("0"))

        if on_hand < threshold:
            Notification.objects.create(
                kind=Notification.Kind.LOW_STOCK,
                location_id=location_id,
                ingredient_id=ingredient_id,
                message="",
                payload={
                    "on_hand": str(on_hand),
                    "threshold": str(threshold),
                },
            )
            created += 1

    return created


@shared_task
def check_expiring_ingredients(days: int = 3) -> int:
    created = 0
    today = date.today()
    soon = today + timedelta(days=days)

    expiring = IngredientLot.objects.filter(
        quantity_remaining__gt=0,
        expiry_date__isnull=False,
        expiry_date__lte=soon,
        expiry_date__gte=today,
    )

    expired = IngredientLot.objects.filter(
        quantity_remaining__gt=0,
        expiry_date__isnull=False,
        expiry_date__lt=today,
    )

    for lot in expiring:
        Notification.objects.create(
            kind=Notification.Kind.EXPIRING_SOON,
            location_id=lot.location_id,
            ingredient_id=lot.ingredient_id,
            message="",
            payload={
                "lot_id": lot.id,
                "expiry_date": lot.expiry_date.isoformat() if lot.expiry_date else None,
                "quantity_remaining": str(lot.quantity_remaining),
            },
        )
        created += 1

    for lot in expired:
        Notification.objects.create(
            kind=Notification.Kind.EXPIRED,
            location_id=lot.location_id,
            ingredient_id=lot.ingredient_id,
            message="",
            payload={
                "lot_id": lot.id,
                "expiry_date": lot.expiry_date.isoformat() if lot.expiry_date else None,
                "quantity_remaining": str(lot.quantity_remaining),
            },
        )
        created += 1

    return created


@shared_task
def check_daily_target_shortfalls(business_date: str | None = None) -> int:
    created = 0
    if business_date is None:
        target_date = date.today()
    else:
        target_date = date.fromisoformat(business_date)

    targets = ProductDailyTarget.objects.filter(business_date=target_date)

    for t in targets:
        on_hand = (
            FinishedGoodLot.objects.filter(
                location_id=t.location_id,
                product_id=t.product_id,
                quantity_remaining__gt=0,
            ).aggregate(total=Sum("quantity_remaining"))["total"]
            or Decimal("0")
        )

        if on_hand < t.target_quantity:
            shortfall = t.target_quantity - on_hand
            Notification.objects.create(
                kind=Notification.Kind.TARGET_SHORTFALL,
                location_id=t.location_id,
                product_id=t.product_id,
                message="",
                payload={
                    "business_date": t.business_date.isoformat(),
                    "target": str(t.target_quantity),
                    "on_hand": str(on_hand),
                    "shortfall": str(shortfall),
                },
            )
            created += 1

    return created
