from typing import Any
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


async def verify_github_token(token: str) -> SocialProfile:
    """Verifica el token de GitHub y retorna la información del perfil."""
    async with httpx.AsyncClient() as client:
        # Obtener información del usuario
        response = await client.get(
            "https://api.github.com/user",
            headers={
                "Authorization": f"Bearer {token}",
                "Accept": "application/vnd.github.v3+json",
            },
        )
        if response.status_code != 200:
            raise ValueError("Token de GitHub inválido")

        user_data = response.json()

        # Obtener el email del usuario (GitHub requiere una llamada adicional)
        email_response = await client.get(
            "https://api.github.com/user/emails",
            headers={
                "Authorization": f"Bearer {token}",
                "Accept": "application/vnd.github.v3+json",
            },
        )
        if email_response.status_code != 200:
            raise ValueError("No se pudo obtener el email de GitHub")

        # Obtener el email principal y verificado
        email_data = email_response.json()
        primary_email = next(
            (email["email"] for email in email_data if email["primary"] and email["verified"]),
            None,
        )
        if not primary_email:
            raise ValueError("No se encontró un email verificado en GitHub")

        return SocialProfile(
            provider_id=str(user_data["id"]),
            email=primary_email,
            full_name=user_data.get("name"),
            avatar_url=user_data.get("avatar_url"),
            provider=AuthProvider.GITHUB,
        )


async def verify_social_token(provider: AuthProvider, token: str) -> SocialProfile:
    """Verifica el token social según el proveedor."""
    verify_functions = {
        AuthProvider.GOOGLE: verify_google_token,
        AuthProvider.GITHUB: verify_github_token,
    }

    verify_func = verify_functions.get(provider)
    if not verify_func:
        raise ValueError(f"Proveedor no soportado: {provider}")

    return await verify_func(token)
