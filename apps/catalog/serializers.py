from django.db import transaction
from rest_framework import serializers

from .models import Product, Recipe, RecipeItem


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ["id", "name", "sku", "is_active"]


class RecipeItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecipeItem
        fields = ["id", "ingredient", "quantity"]


class RecipeSerializer(serializers.ModelSerializer):
    items = RecipeItemSerializer(many=True)

    class Meta:
        model = Recipe
        fields = ["id", "product", "version", "is_active", "yield_quantity", "items"]

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        recipe = Recipe.objects.create(**validated_data)
        RecipeItem.objects.bulk_create(
            [RecipeItem(recipe=recipe, **item) for item in items_data]
        )
        return recipe

    @transaction.atomic
    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if items_data is not None:
            instance.items.all().delete()
            RecipeItem.objects.bulk_create(
                [RecipeItem(recipe=instance, **item) for item in items_data]
            )
        return instance
