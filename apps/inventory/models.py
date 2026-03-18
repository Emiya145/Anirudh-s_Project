from django.db import models
from django.db.models import Q


class Ingredient(models.Model):
    name = models.CharField(max_length=120, unique=True)
    base_unit = models.CharField(max_length=32)
    is_perishable = models.BooleanField(default=False)
    default_low_stock_threshold = models.DecimalField(max_digits=12, decimal_places=3, default=0)

    def __str__(self) -> str:
        return self.name


class IngredientLocationSettings(models.Model):
    location = models.ForeignKey("core.Location", on_delete=models.CASCADE)
    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE)
    low_stock_threshold = models.DecimalField(max_digits=12, decimal_places=3)
    reorder_point = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    target_stock_level = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["location", "ingredient"], name="uniq_location_ingredient_settings"),
        ]
        indexes = [models.Index(fields=["location", "ingredient"]) ]


class IngredientLot(models.Model):
    location = models.ForeignKey("core.Location", on_delete=models.CASCADE)
    ingredient = models.ForeignKey(Ingredient, on_delete=models.PROTECT)

    received_date = models.DateField()
    expiry_date = models.DateField(null=True, blank=True)

    quantity_received = models.DecimalField(max_digits=12, decimal_places=3)
    quantity_remaining = models.DecimalField(max_digits=12, decimal_places=3)

    supplier = models.ForeignKey("suppliers.Supplier", on_delete=models.SET_NULL, null=True, blank=True)
    supplier_lot_code = models.CharField(max_length=80, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["location", "ingredient"]),
            models.Index(fields=["expiry_date"]),
            models.Index(fields=["location", "ingredient", "expiry_date"]),
        ]
        constraints = [
            models.CheckConstraint(condition=Q(quantity_received__gte=0), name="ingredient_lot_qty_received_nonneg"),
            models.CheckConstraint(condition=Q(quantity_remaining__gte=0), name="ingredient_lot_qty_remaining_nonneg"),
        ]


class StockLedgerEntry(models.Model):
    class Reason(models.TextChoices):
        PURCHASE_RECEIPT = "purchase_receipt"
        PRODUCTION_CONSUMPTION = "production_consumption"
        WASTE = "waste"
        MANUAL_ADJUSTMENT = "manual_adjustment"

    created_at = models.DateTimeField(auto_now_add=True)
    location = models.ForeignKey("core.Location", on_delete=models.CASCADE)
    ingredient = models.ForeignKey(Ingredient, on_delete=models.PROTECT)
    lot = models.ForeignKey(IngredientLot, on_delete=models.SET_NULL, null=True, blank=True)

    delta_quantity = models.DecimalField(max_digits=12, decimal_places=3)
    reason = models.CharField(max_length=40, choices=Reason.choices)

    source_type = models.CharField(max_length=40, blank=True)
    source_id = models.CharField(max_length=40, blank=True)

    class Meta:
        indexes = [models.Index(fields=["location", "ingredient", "created_at"]) ]


class FinishedGoodLot(models.Model):
    location = models.ForeignKey("core.Location", on_delete=models.CASCADE)
    product = models.ForeignKey("catalog.Product", on_delete=models.PROTECT)

    produced_at = models.DateTimeField()
    expiry_date = models.DateField(null=True, blank=True)

    quantity_produced = models.DecimalField(max_digits=12, decimal_places=3)
    quantity_remaining = models.DecimalField(max_digits=12, decimal_places=3)

    class Meta:
        indexes = [
            models.Index(fields=["location", "product"]),
            models.Index(fields=["expiry_date"]),
            models.Index(fields=["location", "product", "expiry_date"]),
        ]
        constraints = [
            models.CheckConstraint(condition=Q(quantity_produced__gte=0), name="fg_lot_qty_produced_nonneg"),
            models.CheckConstraint(condition=Q(quantity_remaining__gte=0), name="fg_lot_qty_remaining_nonneg"),
        ]


class FinishedGoodLedgerEntry(models.Model):
    class Reason(models.TextChoices):
        PRODUCTION = "production"
        RESERVED = "reserved"
        RELEASED = "released"
        SALE = "sale"
        WASTE = "waste"
        MANUAL_ADJUSTMENT = "manual_adjustment"

    created_at = models.DateTimeField(auto_now_add=True)
    location = models.ForeignKey("core.Location", on_delete=models.CASCADE)
    product = models.ForeignKey("catalog.Product", on_delete=models.PROTECT)
    lot = models.ForeignKey(FinishedGoodLot, on_delete=models.SET_NULL, null=True, blank=True)

    delta_quantity = models.DecimalField(max_digits=12, decimal_places=3)
    reason = models.CharField(max_length=40, choices=Reason.choices)

    source_type = models.CharField(max_length=40, blank=True)
    source_id = models.CharField(max_length=40, blank=True)

    class Meta:
        indexes = [models.Index(fields=["location", "product", "created_at"]) ]


class ProductDailyTarget(models.Model):
    location = models.ForeignKey("core.Location", on_delete=models.CASCADE)
    product = models.ForeignKey("catalog.Product", on_delete=models.CASCADE)
    business_date = models.DateField()
    target_quantity = models.DecimalField(max_digits=12, decimal_places=3)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["location", "product", "business_date"],
                name="uniq_product_daily_target",
            )
        ]
        indexes = [models.Index(fields=["location", "business_date"]) ]

    def __str__(self) -> str:
        return f"{self.location_id}:{self.product_id}@{self.business_date}={self.target_quantity}"
