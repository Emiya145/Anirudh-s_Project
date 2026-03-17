from rest_framework import serializers

from .models import FinishedGoodLot, Ingredient, IngredientLot, ProductDailyTarget


class IngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingredient
        fields = [
            "id",
            "name",
            "base_unit",
            "is_perishable",
            "default_low_stock_threshold",
        ]


class IngredientLotSerializer(serializers.ModelSerializer):
    class Meta:
        model = IngredientLot
        fields = [
            "id",
            "location",
            "ingredient",
            "received_date",
            "expiry_date",
            "quantity_received",
            "quantity_remaining",
            "supplier",
            "supplier_lot_code",
        ]


class FinishedGoodLotSerializer(serializers.ModelSerializer):
    class Meta:
        model = FinishedGoodLot
        fields = [
            "id",
            "location",
            "product",
            "produced_at",
            "expiry_date",
            "quantity_produced",
            "quantity_remaining",
        ]


class ProductDailyTargetSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductDailyTarget
        fields = ["id", "location", "product", "business_date", "target_quantity"]
