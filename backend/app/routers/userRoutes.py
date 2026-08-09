from fastapi import APIRouter, Depends, HTTPException
from app.core.security import hash_password

from app.core.dependencies import get_current_user, require_admin
from app.database.mongodb import (
    users_collection,
    leave_types_collection,
    leave_balances_collection
)
from app.schemas.user import UserCreateByAdmin


router = APIRouter()


@router.get("/me")
async def get_me(
    current_user = Depends(get_current_user)
):

    return {
        "username": current_user["username"],
        "email": current_user["email"],
        "full_name": current_user["full_name"],
        "role": current_user["role"]
    }


@router.post("/users")
async def create_user(
    user: UserCreateByAdmin,
    current_user=Depends(require_admin)
):

    existing_user = await users_collection.find_one(
        {
            "$or": [
                {"username": user.username},
                {"email": user.email}
            ]
        }
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Username or email already exists"
        )

    hashed_password = hash_password(user.password)

    user_data = {
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "hashed_password": hashed_password,
        "role": user.role.value,
        "is_active": True
    }

    result = await users_collection.insert_one(
        user_data
    )

    user_id = result.inserted_id

    leave_types = await leave_types_collection.find().to_list(
        length=None
    )

    balances = []

    for leave_type in leave_types:

        balance = {
            "user_id": str(user_id),
            "leave_type_id": str(leave_type["_id"]),
            "total_days": leave_type["default_days"],
            "used_days": 0,
            "remaining_days": leave_type["default_days"]
        }

        balances.append(balance)

    if balances:
        await leave_balances_collection.insert_many(
            balances
        )

    return {
        "message": "User created successfully",
        "user_id": str(user_id)
    }