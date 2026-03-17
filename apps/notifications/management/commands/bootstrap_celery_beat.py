from django.core.management.base import BaseCommand
from django_celery_beat.models import IntervalSchedule, PeriodicTask


class Command(BaseCommand):
    def handle(self, *args, **options):
        every_5_min, _ = IntervalSchedule.objects.get_or_create(
            every=5, period=IntervalSchedule.MINUTES
        )
        daily, _ = IntervalSchedule.objects.get_or_create(
            every=1, period=IntervalSchedule.DAYS
        )

        PeriodicTask.objects.update_or_create(
            name="inventory:check_low_stock",
            defaults={
                "interval": every_5_min,
                "task": "apps.notifications.tasks.check_low_stock",
                "enabled": True,
            },
        )

        PeriodicTask.objects.update_or_create(
            name="inventory:check_expiring_ingredients",
            defaults={
                "interval": every_5_min,
                "task": "apps.notifications.tasks.check_expiring_ingredients",
                "args": "[3]",
                "enabled": True,
            },
        )

        PeriodicTask.objects.update_or_create(
            name="inventory:check_daily_target_shortfalls",
            defaults={
                "interval": daily,
                "task": "apps.notifications.tasks.check_daily_target_shortfalls",
                "enabled": True,
            },
        )

        self.stdout.write(self.style.SUCCESS("Celery Beat periodic tasks ensured"))
