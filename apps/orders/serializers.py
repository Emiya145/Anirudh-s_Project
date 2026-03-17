from django.db import transaction
from rest_framework import serializers

from apps.inventory.exceptions import InsufficientStockError
from apps.inventory.services import consume_finished_goods_fefo

from .models import CustomerOrder, CustomerOrderLine


class CustomerOrderLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerOrderLine
        fields = ["id", "product", "quantity"]


class CustomerOrderSerializer(serializers.ModelSerializer):
    lines = CustomerOrderLineSerializer(many=True)

    class Meta:
        model = CustomerOrder
        fields = [
            "id",
            "location",
            "status",
            "ordered_at",
            "due_at",
            "created_by",
            "lines",
        ]
        read_only_fields = ["ordered_at", "created_by"]

    @transaction.atomic
    def create(self, validated_data):
        lines_data = validated_data.pop("lines", [])
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            validated_data["created_by"] = request.user

        order = CustomerOrder.objects.create(**validated_data)
        CustomerOrderLine.objects.bulk_create(
            [CustomerOrderLine(order=order, **line) for line in lines_data]
        )
        return order


class CustomerOrderStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=CustomerOrder.Status.choices)


class CustomerOrderFulfillResultSerializer(serializers.Serializer):
    order_id = serializers.IntegerField()
    status = serializers.CharField()
    consumed = serializers.ListField(child=serializers.DictField())


class CustomerOrderFulfillSerializer(serializers.Serializer):
    def save(self, **kwargs):
        order: CustomerOrder = self.context["order"]

        if order.status not in (CustomerOrder.Status.CONFIRMED,):
            raise serializers.ValidationError({"status": "order must be confirmed to fulfill"})

        consumed_rows = []

        try:
            with transaction.atomic():
                for line in order.lines.select_related("product").all():
                    consumptions = consume_finished_goods_fefo(
                        location_id=order.location_id,
                        product_id=line.product_id,
                        required_quantity=line.quantity,
                        source_type="customer_order",
                        source_id=str(order.id),
                    )
                    for c in consumptions:
                        consumed_rows.append(
                            {
                                "product_id": line.product_id,
                                "lot_id": c.lot_id,
                                "quantity": str(c.quantity),
                            }
                        )

                order.status = CustomerOrder.Status.FULFILLED
                order.save(update_fields=["status"])
        except InsufficientStockError as e:
            raise serializers.ValidationError({"stock": str(e)})

        return {
            "order_id": order.id,
            "status": order.status,
            "consumed": consumed_rows,
        }
