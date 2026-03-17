from rest_framework import viewsets

from apps.accounts.permissions import ReadOnlyOrAdminOrManager

from .models import Product, Recipe
from .serializers import ProductSerializer, RecipeSerializer


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by("id")
    serializer_class = ProductSerializer
    permission_classes = [ReadOnlyOrAdminOrManager]


class RecipeViewSet(viewsets.ModelViewSet):
    queryset = Recipe.objects.all().order_by("id")
    serializer_class = RecipeSerializer
    permission_classes = [ReadOnlyOrAdminOrManager]
