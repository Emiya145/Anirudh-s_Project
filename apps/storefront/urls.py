from django.urls import path

from .views import (
    StoreAvailabilityView,
    StoreCheckoutSessionView,
    StoreLocationsView,
    StoreProductDetailView,
    StoreProductsView,
    stripe_webhook,
)

urlpatterns = [
    path("locations/", StoreLocationsView.as_view()),
    path("products/", StoreProductsView.as_view()),
    path("products/<int:pk>/", StoreProductDetailView.as_view()),
    path("availability/", StoreAvailabilityView.as_view()),
    path("checkout/session/", StoreCheckoutSessionView.as_view()),
    path("stripe/webhook/", stripe_webhook),
]
