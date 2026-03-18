from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            "id",
            "created_at",
            "last_seen_at",
            "kind",
            "dedupe_key",
            "is_active",
            "location",
            "ingredient",
            "product",
            "message",
            "payload",
        ]
        read_only_fields = [
            "created_at",
            "last_seen_at",
            "dedupe_key",
            "location",
            "ingredient",
            "product",
            "message",
            "payload",
        ]
