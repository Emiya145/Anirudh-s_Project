from __future__ import annotations

from datetime import timedelta

from celery import shared_task
from django.db import transaction
from django.utils import timezone

from .models import StoreOrder
from .services import release_store_order_reservations


@shared_task
def expire_unpaid_store_orders(max_age_minutes: int = 30) -> int:
    cutoff = timezone.now() - timedelta(minutes=max_age_minutes)

    order_ids = list(
        StoreOrder.objects.filter(
            status=StoreOrder.Status.PENDING_PAYMENT,
            created_at__lt=cutoff,
        ).values_list("id", flat=True)
    )

    expired = 0

    for order_id in order_ids:
        with transaction.atomic():
            order = StoreOrder.objects.select_for_update().filter(pk=order_id).first()
            if not order:
                continue
            if order.status != StoreOrder.Status.PENDING_PAYMENT:
                continue

            release_store_order_reservations(order=order)
            StoreOrder.objects.filter(pk=order.id).update(status=StoreOrder.Status.EXPIRED)
            expired += 1

    return expired
