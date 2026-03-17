from django.db import models


class Product(models.Model):
    name = models.CharField(max_length=120, unique=True)
    sku = models.CharField(max_length=60, unique=True)
    is_active = models.BooleanField(default=True)

    def __str__(self) -> str:
        return self.name


class Recipe(models.Model):
    product = models.OneToOneField(Product, on_delete=models.CASCADE, related_name="recipe")
    version = models.PositiveIntegerField(default=1)
    is_active = models.BooleanField(default=True)
    yield_quantity = models.DecimalField(max_digits=12, decimal_places=3, default=1)

    def __str__(self) -> str:
        return f"Recipe({self.product_id}, v{self.version})"


class RecipeItem(models.Model):
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name="items")
    ingredient = models.ForeignKey("inventory.Ingredient", on_delete=models.PROTECT)
    quantity = models.DecimalField(max_digits=12, decimal_places=3)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["recipe", "ingredient"], name="uniq_recipe_ingredient"),
        ]
        indexes = [models.Index(fields=["recipe", "ingredient"]) ]

    def __str__(self) -> str:
        return f"{self.recipe_id}:{self.ingredient_id}={self.quantity}"
