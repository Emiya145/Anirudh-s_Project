from django.contrib import admin

from .models import (
    FinishedGoodLedgerEntry,
    FinishedGoodLot,
    Ingredient,
    IngredientLocationSettings,
    IngredientLot,
    ProductDailyTarget,
    StockLedgerEntry,
)


admin.site.register(Ingredient)
admin.site.register(IngredientLocationSettings)
admin.site.register(IngredientLot)
admin.site.register(StockLedgerEntry)
admin.site.register(FinishedGoodLot)
admin.site.register(FinishedGoodLedgerEntry)
admin.site.register(ProductDailyTarget)
