from django.db import models


class Supplier(models.Model):
    name = models.CharField(max_length=160, unique=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=40, blank=True)
    lead_time_days = models.PositiveIntegerField(default=2)

    def __str__(self) -> str:
        return self.name


class SupplierIngredient(models.Model):
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE)
    ingredient = models.ForeignKey("inventory.Ingredient", on_delete=models.CASCADE)
    unit_price = models.DecimalField(max_digits=12, decimal_places=4)
    currency = models.CharField(max_length=3, default="USD")
    min_order_quantity = models.DecimalField(max_digits=12, decimal_places=3, default=0)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["supplier", "ingredient"], name="uniq_supplier_ingredient"),
        ]
        indexes = [models.Index(fields=["ingredient"]) ]
