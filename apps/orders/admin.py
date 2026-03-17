from django.contrib import admin

from .models import CustomerOrder, CustomerOrderLine, PurchaseOrder, PurchaseOrderLine


admin.site.register(CustomerOrder)
admin.site.register(CustomerOrderLine)
admin.site.register(PurchaseOrder)
admin.site.register(PurchaseOrderLine)
