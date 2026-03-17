from decimal import Decimal

from django.db import transaction
from rest_framework import serializers

from apps.inventory.exceptions import InsufficientStockError
from apps.inventory.models import FinishedGoodLedgerEntry, FinishedGoodLot
from apps.inventory.services import consume_ingredient_fefo

from apps.catalog.models import Recipe

from .models import ProductionBatch


class ProductionBatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductionBatch
        fields = [
            "id",
            "location",
            "product",
            "quantity_produced",
            "produced_at",
            "created_by",
            "source_order",
        ]
        read_only_fields = ["produced_at", "created_by"]

    @transaction.atomic
    def create(self, validated_data):
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            validated_data["created_by"] = request.user

        batch = ProductionBatch.objects.create(**validated_data)

        # ingredient consumption
        try:
            recipe = Recipe.objects.select_related("product").prefetch_related("items").get(
                product_id=batch.product_id, is_active=True
            )
        except Recipe.DoesNotExist:
            raise serializers.ValidationError({"recipe": "active recipe not found for product"})

        produced_qty = Decimal(str(batch.quantity_produced))
        yield_qty = Decimal(str(recipe.yield_quantity)) if recipe.yield_quantity else Decimal("1")
        if yield_qty <= 0:
            raise serializers.ValidationError({"yield_quantity": "recipe yield_quantity must be positive"})

        multiplier = produced_qty / yield_qty

        consumed = []
        try:
            for item in recipe.items.all():
                req = Decimal(str(item.quantity)) * multiplier
                consumptions = consume_ingredient_fefo(
                    location_id=batch.location_id,
                    ingredient_id=item.ingredient_id,
                    required_quantity=req,
                    source_type="production_batch",
                    source_id=str(batch.id),
                )
                for c in consumptions:
                    consumed.append(
                        {
                            "ingredient_id": item.ingredient_id,
                            "lot_id": c.lot_id,
                            "quantity": str(c.quantity),
                        }
                    )
        except InsufficientStockError as e:
            raise serializers.ValidationError({"stock": str(e)})

        # finished goods add to stock
        fg_lot = FinishedGoodLot.objects.create(
            location_id=batch.location_id,
            product_id=batch.product_id,
            produced_at=batch.produced_at,
            expiry_date=None,
            quantity_produced=batch.quantity_produced,
            quantity_remaining=batch.quantity_produced,
        )

        FinishedGoodLedgerEntry.objects.create(
            location_id=batch.location_id,
            product_id=batch.product_id,
            lot_id=fg_lot.id,
            delta_quantity=batch.quantity_produced,
            reason=FinishedGoodLedgerEntry.Reason.PRODUCTION,
            source_type="production_batch",
            source_id=str(batch.id),
        )

        batch._consumed = consumed  # type: ignore[attr-defined]
        return batch


class ProductionBatchCreateResponseSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    location = serializers.IntegerField()
    product = serializers.IntegerField()
    quantity_produced = serializers.CharField()
    produced_at = serializers.DateTimeField()
    source_order = serializers.IntegerField(allow_null=True)
    consumed = serializers.ListField(child=serializers.DictField())
