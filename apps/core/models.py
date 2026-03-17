from django.db import models


class Location(models.Model):
    name = models.CharField(max_length=120, unique=True)
    timezone = models.CharField(max_length=64, default="UTC")
    is_active = models.BooleanField(default=True)

    def __str__(self) -> str:
        return self.name
