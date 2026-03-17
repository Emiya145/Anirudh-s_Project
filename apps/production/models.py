from django.conf import settings
from django.db import models


class ProductionDayLog(models.Model):
    location = models.ForeignKey("core.Location", on_delete=models.PROTECT)
    business_date = models.DateField()
    opened_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="opened_logs")
    closed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="closed_logs",
        null=True,
        blank=True,
    )
    notes = models.TextField(blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["location", "business_date"], name="uniq_location_business_date_log"),
        ]
        indexes = [models.Index(fields=["location", "business_date"]) ]


class ProductionBatch(models.Model):
    location = models.ForeignKey("core.Location", on_delete=models.PROTECT)
    product = models.ForeignKey("catalog.Product", on_delete=models.PROTECT)
    quantity_produced = models.DecimalField(max_digits=12, decimal_places=3)
    produced_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)

    source_order = models.ForeignKey(
        "orders.CustomerOrder",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="production_batches",
    )

    class Meta:
        indexes = [models.Index(fields=["location", "produced_at"]) ]
