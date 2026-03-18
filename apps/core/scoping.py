from typing import Iterable

from django.contrib.auth.models import Group

from apps.accounts.models import LocationMembership


def _in_group(user, name: str) -> bool:
    return bool(user and user.is_authenticated and user.groups.filter(name=name).exists())


def user_can_see_all_locations(user) -> bool:
    return bool(user and user.is_authenticated and (user.is_superuser or _in_group(user, "admin") or _in_group(user, "manager")))


def get_allowed_location_ids(user) -> list[int] | None:
    if user_can_see_all_locations(user):
        return None

    if not user or not user.is_authenticated:
        return []

    return list(
        LocationMembership.objects.filter(user=user, is_active=True).values_list(
            "location_id", flat=True
        )
    )


def user_can_access_location(user, location_id: int) -> bool:
    allowed = get_allowed_location_ids(user)
    if allowed is None:
        return True
    return location_id in allowed
