from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.deps import get_db
from app.schemas.user import UserCreate, User
from app.core.security import get_password_hash
from app.db.models.user import User as UserModel

router = APIRouter(prefix="/users")


@router.get("/")
async def hello_world():
    return {"message": "Hello, World!"}


@router.post("/register", response_model=User)
async def create_user(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    # Verificar si el email ya existe
    result = await db.execute(
        UserModel.__table__.select().where(UserModel.email == user_in.email)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail="El correo electrónico ya está registrado"
        )

    # Crear el nuevo usuario
    db_user = UserModel(
        email=user_in.email,
        full_name=user_in.full_name,
        password=get_password_hash(user_in.password),
        role=user_in.role,
        bio=user_in.bio,
        avatar_url=user_in.avatar_url
    )

    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)

    return db_user
