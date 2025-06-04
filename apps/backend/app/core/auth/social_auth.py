from typing import Any, Optional
import httpx
from app.schemas.user import AuthProvider, SocialProfile
from app.core.config import settings


async def verify_google_token(token: str) -> SocialProfile:
    """Verifica el token de Google y retorna la información del perfil."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {token}"},
        )
        if response.status_code != 200:
            raise ValueError("Token de Google inválido")

        data = response.json()
        return SocialProfile(
            provider_id=data["sub"],
            email=data["email"],
            full_name=data.get("name"),
            avatar_url=data.get("picture"),
            provider=AuthProvider.GOOGLE,
        )


async def verify_github_token(access_token: str) -> SocialProfile:
    """Verifica un token de acceso de GitHub y obtiene información del usuario."""
    async with httpx.AsyncClient() as client:
        headers = {
            "Authorization": f"token {access_token}",
            "Accept": "application/json",
        }

        # Obtener información del usuario
        response = await client.get("https://api.github.com/user", headers=headers)

        if response.status_code != 200:
            raise ValueError("Token de GitHub inválido")

        user_data = response.json()

        # Obtener email verificado
        email_response = await client.get("https://api.github.com/user/emails", headers=headers)

        if email_response.status_code != 200:
            raise ValueError("No se pudo obtener el email de GitHub")

        emails = email_response.json()
        primary_email = next((email for email in emails if email["primary"] and email["verified"]), None)

        if not primary_email:
            raise ValueError("No se encontró un email verificado en la cuenta de GitHub")

        return SocialProfile(
            provider_id=str(user_data["id"]),
            email=primary_email["email"],
            full_name=user_data.get("name"),
            avatar_url=user_data.get("avatar_url"),
            provider=AuthProvider.GITHUB,
        )


async def verify_social_token(provider: str, access_token: str) -> SocialProfile:
    """Verifica un token de acceso social y devuelve información del usuario."""
    if provider == AuthProvider.GITHUB:
        return await verify_github_token(access_token)
    elif provider == AuthProvider.GOOGLE:
        return await verify_google_token(access_token)
    else:
        raise ValueError(f"Proveedor no soportado: {provider}")
