from __future__ import annotations

from decimal import Decimal

import stripe
from django.conf import settings
from django.db import transaction
from django.db.models import Sum
from django.http import HttpRequest, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.catalog.models import Product
from apps.core.models import Location
from apps.inventory.exceptions import InsufficientStockError
from apps.inventory.models import FinishedGoodLot

from .models import StoreCustomer, StoreOrder, StoreOrderLine
from .serializers import (
    StoreAvailabilityItemSerializer,
    StoreCheckoutSerializer,
    StoreCheckoutSessionResponseSerializer,
    StoreProductSerializer,
)
from .services import consume_store_order_reservations, release_store_order_reservations, reserve_finished_goods_fefo


class StoreLocationsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        qs = Location.objects.filter(is_active=True).order_by("name")
        return Response(
            [
                {
                    "id": l.id,
                    "name": l.name,
                    "timezone": l.timezone,
                    "is_active": l.is_active,
                    "pickup_enabled": l.pickup_enabled,
                    "delivery_enabled": l.delivery_enabled,
                    "delivery_fee": str(l.delivery_fee),
                    "delivery_min_order": str(l.delivery_min_order),
                }
                for l in qs
            ]
        )


class StoreProductsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        qs = Product.objects.filter(is_public=True, is_active=True).order_by("name")
        return Response(StoreProductSerializer(qs, many=True).data)


class StoreProductDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk: int):
        product = Product.objects.filter(is_public=True, is_active=True, pk=pk).first()
        if not product:
            return Response({"detail": "Not found"}, status=404)
        return Response(StoreProductSerializer(product).data)


class StoreAvailabilityView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        location_id = request.query_params.get("location_id")
        if not location_id:
            return Response({"location_id": "required"}, status=400)

        rows = (
            FinishedGoodLot.objects.filter(location_id=location_id, quantity_remaining__gt=0)
            .values("product_id")
            .annotate(on_hand=Sum("quantity_remaining"))
        )

        payload = [
            {"product_id": r["product_id"], "on_hand": str(r["on_hand"] or Decimal("0"))}
            for r in rows
        ]
        return Response(StoreAvailabilityItemSerializer(payload, many=True).data)


class StoreCheckoutSessionView(APIView):
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request):
        serializer = StoreCheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        location = Location.objects.filter(pk=data["location_id"], is_active=True).first()
        if not location:
            return Response({"location_id": "invalid"}, status=400)

        fulfillment_method = data["fulfillment_method"]

        if fulfillment_method == StoreOrder.FulfillmentMethod.PICKUP and not location.pickup_enabled:
            return Response({"fulfillment_method": "pickup not available"}, status=400)
        if fulfillment_method == StoreOrder.FulfillmentMethod.DELIVERY and not location.delivery_enabled:
            return Response({"fulfillment_method": "delivery not available"}, status=400)

        # Customer
        cust = data["customer"]
        customer = StoreCustomer.objects.create(
            name=cust["name"],
            email=cust["email"],
            phone=cust.get("phone", ""),
        )

        # Pricing + order
        lines_in = data["lines"]
        if not lines_in:
            return Response({"lines": "required"}, status=400)

        products = {p.id: p for p in Product.objects.filter(id__in=[l["product_id"] for l in lines_in], is_public=True, is_active=True)}
        if len(products) != len({l["product_id"] for l in lines_in}):
            return Response({"lines": "invalid product"}, status=400)

        subtotal = Decimal("0")
        order = StoreOrder.objects.create(
            location=location,
            customer=customer,
            fulfillment_method=fulfillment_method,
            pickup_at=data.get("pickup_at"),
            delivery_window_start=data.get("delivery_window_start"),
            delivery_window_end=data.get("delivery_window_end"),
            delivery_address_line1=data.get("delivery_address_line1", ""),
            delivery_address_line2=data.get("delivery_address_line2", ""),
            delivery_city=data.get("delivery_city", ""),
            delivery_state=data.get("delivery_state", ""),
            delivery_postal_code=data.get("delivery_postal_code", ""),
            delivery_country=data.get("delivery_country", ""),
        )

        try:
            for l in lines_in:
                product = products[l["product_id"]]
                unit_price = product.base_price
                qty = l["quantity"]

                if qty <= 0 or qty % 1 != 0:
                    return Response({"lines": "quantity must be a positive integer"}, status=400)
                order_line = StoreOrderLine.objects.create(
                    order=order,
                    product=product,
                    quantity=qty,
                    unit_price=unit_price,
                )
                subtotal += (unit_price * qty)

                reserve_finished_goods_fefo(
                    order=order,
                    line=order_line,
                    product_id=product.id,
                    required_quantity=qty,
                )
        except InsufficientStockError as e:
            return Response({"stock": str(e)}, status=400)

        delivery_fee = location.delivery_fee if fulfillment_method == StoreOrder.FulfillmentMethod.DELIVERY else Decimal("0")
        if fulfillment_method == StoreOrder.FulfillmentMethod.DELIVERY and location.delivery_min_order:
            if subtotal < location.delivery_min_order:
                return Response({"delivery_min_order": "order does not meet minimum"}, status=400)
        tax_amount = Decimal("0")
        total = subtotal + delivery_fee + tax_amount

        StoreOrder.objects.filter(pk=order.id).update(
            subtotal_amount=subtotal,
            delivery_fee_amount=delivery_fee,
            tax_amount=tax_amount,
            total_amount=total,
        )

        stripe.api_key = settings.STRIPE_SECRET_KEY

        success_url = settings.STRIPE_SUCCESS_URL
        cancel_url = settings.STRIPE_CANCEL_URL

        session = stripe.checkout.Session.create(
            mode="payment",
            success_url=success_url,
            cancel_url=cancel_url,
            customer_email=customer.email,
            line_items=[
                {
                    "price_data": {
                        "currency": order.currency.lower(),
                        "unit_amount": int((ol.unit_price * 100).quantize(Decimal('1'))),
                        "product_data": {"name": products[ol.product_id].name},
                    },
                    "quantity": int(ol.quantity),
                }
                for ol in order.lines.all()
            ]
            + ([
                {
                    "price_data": {
                        "currency": order.currency.lower(),
                        "unit_amount": int((delivery_fee * 100).quantize(Decimal('1'))),
                        "product_data": {"name": "Delivery"},
                    },
                    "quantity": 1,
                }
            ] if delivery_fee > 0 else []),
            metadata={"store_order_id": str(order.id)},
        )

        StoreOrder.objects.filter(pk=order.id).update(stripe_checkout_session_id=session.id)

        return Response(
            StoreCheckoutSessionResponseSerializer({"order_id": order.id, "url": session.url}).data,
            status=200,
        )


@csrf_exempt
def stripe_webhook(request: HttpRequest) -> HttpResponse:
    payload = request.body
    sig_header = request.META.get("HTTP_STRIPE_SIGNATURE", "")

    endpoint_secret = getattr(settings, "STRIPE_WEBHOOK_SECRET", "")
    if not endpoint_secret:
        return HttpResponse(status=400)

    stripe.api_key = settings.STRIPE_SECRET_KEY

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
    except Exception:
        return HttpResponse(status=400)

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        order_id = session.get("metadata", {}).get("store_order_id")
        if order_id:
            order = StoreOrder.objects.filter(pk=order_id).first()
            if order and order.status == StoreOrder.Status.PENDING_PAYMENT:
                StoreOrder.objects.filter(pk=order.id).update(
                    status=StoreOrder.Status.PAID,
                    stripe_payment_intent_id=session.get("payment_intent", "") or "",
                )
                consume_store_order_reservations(order=order)

    if event["type"] == "checkout.session.expired":
        session = event["data"]["object"]
        order_id = session.get("metadata", {}).get("store_order_id")
        if order_id:
            order = StoreOrder.objects.filter(pk=order_id).first()
            if order and order.status == StoreOrder.Status.PENDING_PAYMENT:
                release_store_order_reservations(order=order)
                StoreOrder.objects.filter(pk=order.id).update(status=StoreOrder.Status.EXPIRED)

    return HttpResponse(status=200)
