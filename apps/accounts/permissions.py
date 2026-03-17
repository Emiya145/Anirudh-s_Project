from rest_framework.permissions import BasePermission, SAFE_METHODS


def _in_group(user, name: str) -> bool:
    return bool(user and user.is_authenticated and user.groups.filter(name=name).exists())


class IsAdminOrManager(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (user.is_superuser or _in_group(user, "admin") or _in_group(user, "manager"))
        )


class ReadOnlyOrAdminOrManager(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return bool(request.user and request.user.is_authenticated)
        return IsAdminOrManager().has_permission(request, view)


class IsAdminOrManagerOrStaff(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (
                user.is_superuser
                or _in_group(user, "admin")
                or _in_group(user, "manager")
                or _in_group(user, "staff")
            )
        )
