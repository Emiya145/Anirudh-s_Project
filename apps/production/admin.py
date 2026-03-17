from django.contrib import admin

from .models import ProductionBatch, ProductionDayLog


admin.site.register(ProductionDayLog)
admin.site.register(ProductionBatch)
