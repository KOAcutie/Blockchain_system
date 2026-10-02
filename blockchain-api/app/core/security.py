import secrets
from fastapi import Depends, Header, HTTPException, Request, status
from app.core.config import Settings, get_settings


def verify_service_key(
    request: Request,
    x_service_key: str = Header(
        default="",
        alias="X-Service-Key",
        description="Internal service-to-service key (local default: ssc-internal-service-secret-2026)",
    ),
    settings: Settings = Depends(get_settings),
) -> str:
    """Validate internal service-to-service X-Service-Key header from Laravel."""
    expected_key = settings.laravel_service_key
    if not expected_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server security key (LARAVEL_SERVICE_KEY) is not configured.",
        )

    # Allow interactive Swagger UI (/docs) execution in local dev if header is left empty
    referer = request.headers.get("referer", "")
    if not x_service_key and settings.app_env == "local" and "/docs" in referer:
        return expected_key

    if not x_service_key or not secrets.compare_digest(x_service_key, expected_key):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Invalid or missing X-Service-Key header.",
        )

    return x_service_key
