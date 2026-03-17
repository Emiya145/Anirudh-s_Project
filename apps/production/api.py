from rest_framework import status, viewsets
from rest_framework.response import Response

from apps.accounts.permissions import IsAdminOrManagerOrStaff

from .models import ProductionBatch
from .serializers import ProductionBatchCreateResponseSerializer, ProductionBatchSerializer


class ProductionBatchViewSet(viewsets.ModelViewSet):
    queryset = ProductionBatch.objects.all().order_by("-produced_at", "-id")
    serializer_class = ProductionBatchSerializer
    permission_classes = [IsAdminOrManagerOrStaff]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        batch = serializer.save()

        consumed = getattr(batch, "_consumed", [])
        payload = {
            "id": batch.id,
            "location": batch.location_id,
            "product": batch.product_id,
            "quantity_produced": str(batch.quantity_produced),
            "produced_at": batch.produced_at,
            "source_order": batch.source_order_id,
            "consumed": consumed,
        }
        return Response(
            ProductionBatchCreateResponseSerializer(payload).data,
            status=status.HTTP_201_CREATED,
        )
