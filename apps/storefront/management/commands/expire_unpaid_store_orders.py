from __future__ import annotations

from django.core.management.base import BaseCommand

from apps.storefront.tasks import expire_unpaid_store_orders


class Command(BaseCommand):
    help = "Expire unpaid storefront orders and release finished goods reservations."

    def add_arguments(self, parser):
        parser.add_argument(
            "--max-age-minutes",
            type=int,
            default=30,
            help="Expire orders older than this many minutes (default: 30)",
        )

    def handle(self, *args, **options):
        max_age_minutes = int(options["max_age_minutes"])
        expired = expire_unpaid_store_orders(max_age_minutes=max_age_minutes)
        self.stdout.write(self.style.SUCCESS(f"Expired {expired} unpaid store orders"))
