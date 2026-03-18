from django.core.management.base import BaseCommand
from django.db import connection, transaction

from apps.core.models import Location
from apps.inventory.models import Ingredient, IngredientLot


class Command(BaseCommand):
    def handle(self, *args, **options):
        self.stdout.write("Checking database connectivity...")
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            row = cursor.fetchone()
        self.stdout.write(self.style.SUCCESS(f"DB OK (SELECT 1 -> {row[0]})"))

        self.stdout.write("Running CRUD + locking sanity check...")

        with transaction.atomic():
            location, _ = Location.objects.get_or_create(name="_validate_db_location")
            ingredient, _ = Ingredient.objects.get_or_create(
                name="_validate_db_ingredient",
                defaults={"base_unit": "each", "is_perishable": False},
            )

            lot = IngredientLot.objects.create(
                location=location,
                ingredient=ingredient,
                received_date="2026-01-01",
                expiry_date=None,
                quantity_received="10.000",
                quantity_remaining="10.000",
                supplier=None,
                supplier_lot_code="",
            )

            locked = (
                IngredientLot.objects.select_for_update()
                .filter(pk=lot.pk)
                .get()
            )

            locked.quantity_remaining = "9.000"
            locked.save(update_fields=["quantity_remaining"])

        self.stdout.write(self.style.SUCCESS("CRUD + select_for_update() OK"))
