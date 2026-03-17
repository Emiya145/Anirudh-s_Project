from django.conf import settings
from django.db import models


class WasteRecord(models.Model):
    class Reason(models.TextChoices):
        EXPIRED = "expired"
        DISCARDED = "discarded"

    location = models.ForeignKey("core.Location", on_delete=models.PROTECT)

    ingredient = models.ForeignKey("inventory.Ingredient", on_delete=models.PROTECT)
    ingredient_lot = models.ForeignKey("inventory.IngredientLot", on_delete=models.SET_NULL, null=True, blank=True)

    quantity = models.DecimalField(max_digits=12, decimal_places=3)
    reason = models.CharField(max_length=20, choices=Reason.choices)

    recorded_at = models.DateTimeField(auto_now_add=True)
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)

    class Meta:
        indexes = [models.Index(fields=["location", "recorded_at"]) ]
