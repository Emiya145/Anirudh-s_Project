from rest_framework.routers import DefaultRouter

from apps.catalog.api import ProductViewSet, RecipeViewSet
from apps.core.api import LocationViewSet
from apps.inventory.api import (
    FinishedGoodLotViewSet,
    IngredientLotViewSet,
    IngredientViewSet,
    ProductDailyTargetViewSet,
)
from apps.orders.api import CustomerOrderViewSet
from apps.production.api import ProductionBatchViewSet
from apps.suppliers.api import SupplierViewSet

router = DefaultRouter()

router.register(r"locations", LocationViewSet, basename="location")
router.register(r"ingredients", IngredientViewSet, basename="ingredient")
router.register(r"ingredient-lots", IngredientLotViewSet, basename="ingredient-lot")
router.register(r"products", ProductViewSet, basename="product")
router.register(r"recipes", RecipeViewSet, basename="recipe")
router.register(r"finished-good-lots", FinishedGoodLotViewSet, basename="finished-good-lot")
router.register(r"product-daily-targets", ProductDailyTargetViewSet, basename="product-daily-target")
router.register(r"suppliers", SupplierViewSet, basename="supplier")
router.register(r"customer-orders", CustomerOrderViewSet, basename="customer-order")
router.register(r"production-batches", ProductionBatchViewSet, basename="production-batch")
