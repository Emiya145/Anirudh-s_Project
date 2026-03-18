from __future__ import annotations

from datetime import date
from decimal import Decimal

from django.db import transaction
from rest_framework import serializers

from apps.inventory.models import IngredientLot, StockLedgerEntry

from .models import PurchaseOrder, PurchaseOrderLine


class PurchaseOrderLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseOrderLine
        fields = ["id", "ingredient", "quantity_ordered", "unit_price_snapshot"]


class PurchaseOrderSerializer(serializers.ModelSerializer):
    lines = PurchaseOrderLineSerializer(many=True)

    class Meta:
        model = PurchaseOrder
        fields = [
            "id",
            "supplier",
            "location",
            "status",
            "ordered_at",
            "expected_delivery_date",
            "created_by",
            "lines",
        ]
        read_only_fields = ["ordered_at", "created_by"]

    @transaction.atomic
    def create(self, validated_data):
        lines = validated_data.pop("lines", [])
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            validated_data["created_by"] = request.user

        po = PurchaseOrder.objects.create(**validated_data)
        PurchaseOrderLine.objects.bulk_create(
            [PurchaseOrderLine(purchase_order=po, **line) for line in lines]
        )
        return po

    @transaction.atomic
    def update(self, instance, validated_data):
        lines = validated_data.pop("lines", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if lines is not None:
            instance.lines.all().delete()
            PurchaseOrderLine.objects.bulk_create(
                [PurchaseOrderLine(purchase_order=instance, **line) for line in lines]
            )

        return instance


class PurchaseOrderReceiveLineSerializer(serializers.Serializer):
    line_id = serializers.IntegerField()
    quantity_received = serializers.DecimalField(max_digits=12, decimal_places=3)
    expiry_date = serializers.DateField(required=False, allow_null=True)
    supplier_lot_code = serializers.CharField(required=False, allow_blank=True, default="")


class PurchaseOrderReceiveSerializer(serializers.Serializer):
    received_date = serializers.DateField(required=False)
    lines = PurchaseOrderReceiveLineSerializer(many=True)

    def _to_decimal(self, value) -> Decimal:
        if isinstance(value, Decimal):
            return value
        return Decimal(str(value))

    @transaction.atomic
    def save(self, **kwargs):
        po: PurchaseOrder = self.context["purchase_order"]

        po = PurchaseOrder.objects.select_for_update().get(pk=po.id)
        if po.status in (PurchaseOrder.Status.RECEIVED, PurchaseOrder.Status.CANCELED):
            raise serializers.ValidationError({"status": "purchase order cannot be received"})

        received_date: date = self.validated_data.get("received_date") or date.today()

        created_lots = []

        for line in self.validated_data["lines"]:
            pol = po.lines.select_for_update().filter(pk=line["line_id"]).first()
            if not pol:
                raise serializers.ValidationError({"lines": f"line_id {line['line_id']} not found"})

            qty = self._to_decimal(line["quantity_received"])
            if qty <= 0:
                raise serializers.ValidationError({"quantity_received": "must be positive"})

            ingredient = pol.ingredient
            expiry_date = line.get("expiry_date")

            if ingredient.is_perishable and not expiry_date:
                raise serializers.ValidationError(
                    {"expiry_date": f"expiry_date required for perishable ingredient {ingredient.id}"}
                )

            lot = IngredientLot.objects.create(
                location_id=po.location_id,
                ingredient_id=ingredient.id,
                received_date=received_date,
                expiry_date=expiry_date,
                quantity_received=qty,
                quantity_remaining=qty,
                supplier_id=po.supplier_id,
                supplier_lot_code=line.get("supplier_lot_code", ""),
            )

            StockLedgerEntry.objects.create(
                location_id=po.location_id,
                ingredient_id=ingredient.id,
                lot_id=lot.id,
                delta_quantity=qty,
                reason=StockLedgerEntry.Reason.PURCHASE_RECEIPT,
                source_type="purchase_order",
                source_id=str(po.id),
            )

            created_lots.append({"lot_id": lot.id, "ingredient_id": ingredient.id, "quantity": str(qty)})

        po.status = PurchaseOrder.Status.RECEIVED
        po.save(update_fields=["status"])

        return {"purchase_order_id": po.id, "status": po.status, "created_lots": created_lots}


class PurchaseOrderReceiveResultSerializer(serializers.Serializer):
    purchase_order_id = serializers.IntegerField()
    status = serializers.CharField()
    created_lots = serializers.ListField(child=serializers.DictField())
