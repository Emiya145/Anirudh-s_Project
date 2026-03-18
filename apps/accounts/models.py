from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    locations = models.ManyToManyField(
        "core.Location",
        through="accounts.LocationMembership",
        related_name="users",
        blank=True,
    )


class LocationMembership(models.Model):
    user = models.ForeignKey("accounts.User", on_delete=models.CASCADE)
    location = models.ForeignKey("core.Location", on_delete=models.CASCADE)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "location"],
                name="uniq_user_location_membership",
            )
        ]
        indexes = [models.Index(fields=["location", "is_active"]) ]
