from __future__ import annotations

from decimal import Decimal

from django.db import transaction
from django.db.models import F
from rest_framework import serializers

from apps.inventory.models import IngredientLot, StockLedgerEntry

from .models import WasteRecord


class WasteRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = WasteRecord
        fields = [
            "id",
            "location",
            "ingredient",
            "ingredient_lot",
            "quantity",
            "reason",
            "recorded_at",
            "recorded_by",
        ]
        read_only_fields = ["recorded_at", "recorded_by"]


class WasteRecordCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = WasteRecord
        fields = [
            "id",
            "location",
            "ingredient",
            "ingredient_lot",
            "quantity",
            "reason",
            "recorded_at",
            "recorded_by",
        ]
        read_only_fields = ["recorded_at", "recorded_by"]

    def _to_decimal(self, value) -> Decimal:
        if isinstance(value, Decimal):
            return value
        return Decimal(str(value))

    @transaction.atomic
    def create(self, validated_data):
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            validated_data["recorded_by"] = request.user

        location = validated_data["location"]
        ingredient = validated_data["ingredient"]
        ingredient_lot = validated_data.get("ingredient_lot")
        qty = self._to_decimal(validated_data["quantity"])

        if qty <= 0:
            raise serializers.ValidationError({"quantity": "must be positive"})

        waste = WasteRecord.objects.create(**validated_data)

        # Deduct stock (atomic + row locks) and write ledger entries linked to this waste record.
        if ingredient_lot:
            lot = IngredientLot.objects.select_for_update().get(pk=ingredient_lot.id)

            if lot.location_id != location.id:
                raise serializers.ValidationError({"ingredient_lot": "lot location mismatch"})
            if lot.ingredient_id != ingredient.id:
                raise serializers.ValidationError({"ingredient_lot": "lot ingredient mismatch"})
            if lot.quantity_remaining < qty:
                raise serializers.ValidationError(
                    {"quantity": f"insufficient lot stock (remaining={lot.quantity_remaining})"}
                )

            lot.quantity_remaining = lot.quantity_remaining - qty
            lot.save(update_fields=["quantity_remaining"])

            StockLedgerEntry.objects.create(
                location_id=location.id,
                ingredient_id=ingredient.id,
                lot_id=lot.id,
                delta_quantity=-qty,
                reason=StockLedgerEntry.Reason.WASTE,
                source_type="waste_record",
                source_id=str(waste.id),
            )

            return waste

        # FEFO for waste if no specific lot is provided.
        remaining = qty
        lots = (
            IngredientLot.objects.select_for_update()
            .filter(
                location_id=location.id,
                ingredient_id=ingredient.id,
                quantity_remaining__gt=0,
            )
            .order_by(F("expiry_date").asc(nulls_last=True), "received_date", "id")
        )

        for lot in lots:
            if remaining <= 0:
                break

            take = min(lot.quantity_remaining, remaining)
            if take <= 0:
                continue

            lot.quantity_remaining = lot.quantity_remaining - take
            lot.save(update_fields=["quantity_remaining"])

            StockLedgerEntry.objects.create(
                location_id=location.id,
                ingredient_id=ingredient.id,
                lot_id=lot.id,
                delta_quantity=-take,
                reason=StockLedgerEntry.Reason.WASTE,
                source_type="waste_record",
                source_id=str(waste.id),
            )

            remaining -= take

        if remaining > 0:
            raise serializers.ValidationError(
                {"quantity": f"insufficient stock (missing={remaining})"}
            )

        return waste
