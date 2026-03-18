from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.permissions import ReadOnlyOrAdminOrManager
from apps.core.viewset_mixins import LocationScopedQuerysetMixin

from .models import PurchaseOrder
from .purchase_serializers import (
    PurchaseOrderReceiveResultSerializer,
    PurchaseOrderReceiveSerializer,
    PurchaseOrderSerializer,
)


class PurchaseOrderViewSet(LocationScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.prefetch_related("lines").all().order_by("-ordered_at", "-id")
    serializer_class = PurchaseOrderSerializer
    permission_classes = [ReadOnlyOrAdminOrManager]

    @action(detail=True, methods=["post"])
    def receive(self, request, pk=None):
        po = self.get_object()
        serializer = PurchaseOrderReceiveSerializer(
            data=request.data,
            context={"purchase_order": po, "request": request},
        )
        serializer.is_valid(raise_exception=True)
        result = serializer.save()
        return Response(PurchaseOrderReceiveResultSerializer(result).data, status=status.HTTP_200_OK)
