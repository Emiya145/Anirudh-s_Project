from rest_framework.exceptions import ValidationError

from .scoping import get_allowed_location_ids, user_can_access_location


class LocationScopedQuerysetMixin:
    location_field_name = "location"

    def get_queryset(self):
        qs = super().get_queryset()
        allowed = get_allowed_location_ids(getattr(self, "request", None).user)
        if allowed is None:
            return qs
        if not allowed:
            return qs.none()
        return qs.filter(**{f"{self.location_field_name}_id__in": allowed})

    def _validate_location_write(self, serializer, *, require_location: bool):
        if require_location and self.location_field_name not in serializer.validated_data:
            raise ValidationError({self.location_field_name: "This field is required."})

        if self.location_field_name in serializer.validated_data:
            location = serializer.validated_data[self.location_field_name]
            if location is None:
                raise ValidationError({self.location_field_name: "This field is required."})
            if not user_can_access_location(self.request.user, location.id):
                raise ValidationError({self.location_field_name: "Not permitted."})

    def perform_create(self, serializer):
        self._validate_location_write(serializer, require_location=True)
        return super().perform_create(serializer)

    def perform_update(self, serializer):
        self._validate_location_write(serializer, require_location=False)
        return super().perform_update(serializer)
