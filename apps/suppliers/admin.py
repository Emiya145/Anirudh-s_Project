from django.contrib import admin

from .models import Supplier, SupplierIngredient


admin.site.register(Supplier)
admin.site.register(SupplierIngredient)
