from rest_framework import viewsets

from apps.accounts.permissions import IsAdminOrManagerOrStaff
from apps.core.viewset_mixins import LocationScopedQuerysetMixin

from .models import WasteRecord
from .serializers import WasteRecordCreateSerializer, WasteRecordSerializer


class WasteRecordViewSet(LocationScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = WasteRecord.objects.all().order_by("-recorded_at", "-id")
    permission_classes = [IsAdminOrManagerOrStaff]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return WasteRecordCreateSerializer
        return WasteRecordSerializer
