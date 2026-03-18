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
from apps.orders.purchase_api import PurchaseOrderViewSet
from apps.production.api import ProductionBatchViewSet
from apps.suppliers.api import SupplierViewSet
from apps.notifications.api import NotificationViewSet
from apps.waste.api import WasteRecordViewSet

router = DefaultRouter()

router.register(r"locations", LocationViewSet, basename="location")
router.register(r"ingredients", IngredientViewSet, basename="ingredient")
router.register(r"ingredient-lots", IngredientLotViewSet, basename="ingredient-lot")
router.register(r"products", ProductViewSet, basename="product")
router.register(r"recipes", RecipeViewSet, basename="recipe")
router.register(r"finished-good-lots", FinishedGoodLotViewSet, basename="finished-good-lot")
router.register(r"product-daily-targets", ProductDailyTargetViewSet, basename="product-daily-target")
router.register(r"suppliers", SupplierViewSet, basename="supplier")
router.register(r"notifications", NotificationViewSet, basename="notification")
router.register(r"waste-records", WasteRecordViewSet, basename="waste-record")
router.register(r"customer-orders", CustomerOrderViewSet, basename="customer-order")
router.register(r"purchase-orders", PurchaseOrderViewSet, basename="purchase-order")
router.register(r"production-batches", ProductionBatchViewSet, basename="production-batch")
