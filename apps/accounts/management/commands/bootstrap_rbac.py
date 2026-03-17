from django.contrib.auth.models import Group
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    def handle(self, *args, **options):
        for name in ("admin", "manager", "staff"):
            Group.objects.get_or_create(name=name)

        self.stdout.write(self.style.SUCCESS("RBAC groups ensured: admin, manager, staff"))
