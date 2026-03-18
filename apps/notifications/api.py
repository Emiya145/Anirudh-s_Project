from rest_framework import mixins, viewsets

from apps.accounts.permissions import IsAdminOrManagerOrStaff
from apps.core.viewset_mixins import LocationScopedQuerysetMixin

from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(
    LocationScopedQuerysetMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    queryset = Notification.objects.all().order_by("-created_at", "-id")
    serializer_class = NotificationSerializer
    permission_classes = [IsAdminOrManagerOrStaff]
