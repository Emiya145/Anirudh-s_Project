from rest_framework import viewsets

from apps.accounts.permissions import ReadOnlyOrAdminOrManager
from apps.core.viewset_mixins import LocationScopedQuerysetMixin

from .models import FinishedGoodLot, Ingredient, IngredientLot, ProductDailyTarget
from .serializers import (
    FinishedGoodLotSerializer,
    IngredientLotSerializer,
    IngredientSerializer,
    ProductDailyTargetSerializer,
)


class IngredientViewSet(viewsets.ModelViewSet):
    queryset = Ingredient.objects.all().order_by("id")
    serializer_class = IngredientSerializer
    permission_classes = [ReadOnlyOrAdminOrManager]


class IngredientLotViewSet(LocationScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = IngredientLot.objects.all().order_by("id")
    serializer_class = IngredientLotSerializer
    permission_classes = [ReadOnlyOrAdminOrManager]


class FinishedGoodLotViewSet(LocationScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = FinishedGoodLot.objects.all().order_by("id")
    serializer_class = FinishedGoodLotSerializer
    permission_classes = [ReadOnlyOrAdminOrManager]


class ProductDailyTargetViewSet(LocationScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = ProductDailyTarget.objects.all().order_by("business_date", "id")
    serializer_class = ProductDailyTargetSerializer
    permission_classes = [ReadOnlyOrAdminOrManager]
