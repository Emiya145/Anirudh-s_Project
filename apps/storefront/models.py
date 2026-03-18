from __future__ import annotations

from django.db import models


class StoreCustomer(models.Model):
    name = models.CharField(max_length=160)
    email = models.EmailField()
    phone = models.CharField(max_length=40, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["email"]) ]


class StoreOrder(models.Model):
    class Status(models.TextChoices):
        PENDING_PAYMENT = "pending_payment"
        PAID = "paid"
        CANCELED = "canceled"
        EXPIRED = "expired"

    class FulfillmentMethod(models.TextChoices):
        PICKUP = "pickup"
        DELIVERY = "delivery"

    location = models.ForeignKey("core.Location", on_delete=models.PROTECT)
    customer = models.ForeignKey(StoreCustomer, on_delete=models.PROTECT)

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING_PAYMENT)
    fulfillment_method = models.CharField(max_length=20, choices=FulfillmentMethod.choices)

    pickup_at = models.DateTimeField(null=True, blank=True)
    delivery_window_start = models.DateTimeField(null=True, blank=True)
    delivery_window_end = models.DateTimeField(null=True, blank=True)

    delivery_address_line1 = models.CharField(max_length=255, blank=True)
    delivery_address_line2 = models.CharField(max_length=255, blank=True)
    delivery_city = models.CharField(max_length=120, blank=True)
    delivery_state = models.CharField(max_length=80, blank=True)
    delivery_postal_code = models.CharField(max_length=32, blank=True)
    delivery_country = models.CharField(max_length=2, blank=True)

    subtotal_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    delivery_fee_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default="USD")

    stripe_checkout_session_id = models.CharField(max_length=255, blank=True)
    stripe_payment_intent_id = models.CharField(max_length=255, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["location", "created_at"]),
            models.Index(fields=["status", "created_at"]),
        ]


class StoreOrderLine(models.Model):
    order = models.ForeignKey(StoreOrder, on_delete=models.CASCADE, related_name="lines")
    product = models.ForeignKey("catalog.Product", on_delete=models.PROTECT)

    quantity = models.DecimalField(max_digits=12, decimal_places=3)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        indexes = [models.Index(fields=["order"]) ]


class StoreOrderReservation(models.Model):
    class Status(models.TextChoices):
        RESERVED = "reserved"
        RELEASED = "released"
        CONSUMED = "consumed"

    order = models.ForeignKey(StoreOrder, on_delete=models.CASCADE, related_name="reservations")
    line = models.ForeignKey(StoreOrderLine, on_delete=models.CASCADE, related_name="reservations")

    finished_good_lot = models.ForeignKey("inventory.FinishedGoodLot", on_delete=models.PROTECT)
    quantity_reserved = models.DecimalField(max_digits=12, decimal_places=3)

    ledger_entry = models.ForeignKey(
        "inventory.FinishedGoodLedgerEntry",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.RESERVED)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["order", "status"]) ]
        constraints = [
            models.UniqueConstraint(
                fields=["order", "line", "finished_good_lot"],
                name="uniq_store_order_reservation",
            )
        ]
