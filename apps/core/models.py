from django.db import models


class Location(models.Model):
    name = models.CharField(max_length=120, unique=True)
    timezone = models.CharField(max_length=64, default="UTC")
    is_active = models.BooleanField(default=True)

    pickup_enabled = models.BooleanField(default=True)
    delivery_enabled = models.BooleanField(default=True)
    delivery_fee = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    delivery_min_order = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def __str__(self) -> str:
        return self.name
