from rest_framework import viewsets

from apps.accounts.permissions import ReadOnlyOrAdminOrManager

from .models import Supplier
from .serializers import SupplierSerializer


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all().order_by("id")
    serializer_class = SupplierSerializer
    permission_classes = [ReadOnlyOrAdminOrManager]
