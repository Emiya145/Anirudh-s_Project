from rest_framework import viewsets

from .scoping import get_allowed_location_ids
from .models import Location
from .serializers import LocationSerializer


class LocationViewSet(viewsets.ModelViewSet):
    queryset = Location.objects.all().order_by("id")
    serializer_class = LocationSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        allowed = get_allowed_location_ids(self.request.user)
        if allowed is None:
            return qs
        if not allowed:
            return qs.none()
        return qs.filter(id__in=allowed)
