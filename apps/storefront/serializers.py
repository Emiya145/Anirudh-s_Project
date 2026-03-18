from __future__ import annotations

from decimal import Decimal

from rest_framework import serializers

from apps.catalog.models import Product

from .models import StoreCustomer, StoreOrder, StoreOrderLine


class StoreProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "sku",
            "is_active",
            "description",
            "image_url",
            "base_price",
            "is_public",
            "category",
        ]


class StoreAvailabilityItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    on_hand = serializers.CharField()


class StoreCheckoutLineSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.DecimalField(max_digits=12, decimal_places=3)


class StoreCheckoutCustomerSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=160)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=40, required=False, allow_blank=True, default="")


class StoreCheckoutSerializer(serializers.Serializer):
    location_id = serializers.IntegerField()
    fulfillment_method = serializers.ChoiceField(choices=StoreOrder.FulfillmentMethod.choices)

    pickup_at = serializers.DateTimeField(required=False, allow_null=True)
    delivery_window_start = serializers.DateTimeField(required=False, allow_null=True)
    delivery_window_end = serializers.DateTimeField(required=False, allow_null=True)

    delivery_address_line1 = serializers.CharField(required=False, allow_blank=True, default="")
    delivery_address_line2 = serializers.CharField(required=False, allow_blank=True, default="")
    delivery_city = serializers.CharField(required=False, allow_blank=True, default="")
    delivery_state = serializers.CharField(required=False, allow_blank=True, default="")
    delivery_postal_code = serializers.CharField(required=False, allow_blank=True, default="")
    delivery_country = serializers.CharField(required=False, allow_blank=True, default="")

    customer = StoreCheckoutCustomerSerializer()
    lines = StoreCheckoutLineSerializer(many=True)


class StoreCheckoutSessionResponseSerializer(serializers.Serializer):
    order_id = serializers.IntegerField()
    url = serializers.URLField()
