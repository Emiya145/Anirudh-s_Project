from rest_framework import serializers

from .models import Location


class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = [
            "id",
            "name",
            "timezone",
            "is_active",
            "pickup_enabled",
            "delivery_enabled",
            "delivery_fee",
            "delivery_min_order",
        ]
