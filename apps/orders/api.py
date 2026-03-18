from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.permissions import IsAdminOrManagerOrStaff
from apps.core.viewset_mixins import LocationScopedQuerysetMixin

from .models import CustomerOrder
from .serializers import (
    CustomerOrderFulfillResultSerializer,
    CustomerOrderFulfillSerializer,
    CustomerOrderSerializer,
    CustomerOrderStatusUpdateSerializer,
)


class CustomerOrderViewSet(LocationScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = CustomerOrder.objects.all().order_by("-ordered_at", "-id")
    serializer_class = CustomerOrderSerializer
    permission_classes = [IsAdminOrManagerOrStaff]

    @action(detail=True, methods=["post"])
    def set_status(self, request, pk=None):
        order = self.get_object()
        serializer = CustomerOrderStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        order.status = serializer.validated_data["status"]
        order.save(update_fields=["status"])

        return Response(CustomerOrderSerializer(order, context={"request": request}).data)

    @action(detail=True, methods=["post"])
    def fulfill(self, request, pk=None):
        order = self.get_object()
        serializer = CustomerOrderFulfillSerializer(data=request.data, context={"order": order})
        serializer.is_valid(raise_exception=True)
        result = serializer.save()
        return Response(CustomerOrderFulfillResultSerializer(result).data, status=status.HTTP_200_OK)
