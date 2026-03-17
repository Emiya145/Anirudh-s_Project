from django.db import models


class Notification(models.Model):
    class Kind(models.TextChoices):
        LOW_STOCK = "low_stock"
        EXPIRING_SOON = "expiring_soon"
        EXPIRED = "expired"
        TARGET_SHORTFALL = "target_shortfall"

    created_at = models.DateTimeField(auto_now_add=True)
    kind = models.CharField(max_length=30, choices=Kind.choices)

    location = models.ForeignKey("core.Location", on_delete=models.CASCADE)

    ingredient = models.ForeignKey("inventory.Ingredient", on_delete=models.SET_NULL, null=True, blank=True)
    product = models.ForeignKey("catalog.Product", on_delete=models.SET_NULL, null=True, blank=True)

    message = models.TextField(blank=True)
    payload = models.JSONField(default=dict, blank=True)

    class Meta:
        indexes = [models.Index(fields=["location", "kind", "created_at"]) ]
