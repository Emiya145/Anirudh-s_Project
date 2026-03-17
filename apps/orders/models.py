from django.conf import settings
from django.db import models


class CustomerOrder(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft"
        CONFIRMED = "confirmed"
        FULFILLED = "fulfilled"
        CANCELED = "canceled"

    location = models.ForeignKey("core.Location", on_delete=models.PROTECT)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)

    ordered_at = models.DateTimeField(auto_now_add=True)
    due_at = models.DateTimeField(null=True, blank=True)

    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)

    class Meta:
        indexes = [
            models.Index(fields=["location", "status", "ordered_at"]),
        ]


class CustomerOrderLine(models.Model):
    order = models.ForeignKey(CustomerOrder, on_delete=models.CASCADE, related_name="lines")
    product = models.ForeignKey("catalog.Product", on_delete=models.PROTECT)
    quantity = models.DecimalField(max_digits=12, decimal_places=3)

    class Meta:
        indexes = [models.Index(fields=["order"]) ]


class PurchaseOrder(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft"
        SENT = "sent"
        RECEIVED = "received"
        CANCELED = "canceled"

    supplier = models.ForeignKey("suppliers.Supplier", on_delete=models.PROTECT)
    location = models.ForeignKey("core.Location", on_delete=models.PROTECT)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)

    ordered_at = models.DateTimeField(auto_now_add=True)
    expected_delivery_date = models.DateField(null=True, blank=True)

    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)

    class Meta:
        indexes = [models.Index(fields=["location", "status", "ordered_at"]) ]


class PurchaseOrderLine(models.Model):
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name="lines")
    ingredient = models.ForeignKey("inventory.Ingredient", on_delete=models.PROTECT)
    quantity_ordered = models.DecimalField(max_digits=12, decimal_places=3)
    unit_price_snapshot = models.DecimalField(max_digits=12, decimal_places=4, null=True, blank=True)

    class Meta:
        indexes = [models.Index(fields=["purchase_order"]) ]
