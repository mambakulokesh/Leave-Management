from fastapi import APIRouter, HTTPException, Depends
from app.schemas.user import UserCreate, LoginRequest
from app.database.mongodb import users_collection
from app.core.security import hash_password, verify_password, create_access_token
from app.core.dependencies import require_admin, get_current_user
from bson import ObjectId

router = APIRouter()


@router.post("/register")
async def register(user: UserCreate):

    existing_user = await users_collection.find_one({
        "$or": [
            {"username": user.username},
            {"email": user.email}
        ]
    })

    if existing_user:
        return {
            "message": "Username or email already exists"
        }

    user_dict = user.model_dump()

    user_dict["hashed_password"] = hash_password(user_dict["password"])

    del user_dict["password"]

    user_dict["role"] = "admin"
    user_dict["is_active"] = True

    await users_collection.insert_one(user_dict)

    return {
        "message": "User registered successfully"
    }


@router.post("/login")
async def login(user: LoginRequest):
    existing_user = await users_collection.find_one(
        {
            "$or": [
                {"username": user.username},
                {"email": user.username}
            ]
        })

    if not existing_user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
               )

    if not verify_password(user.password, existing_user["hashed_password"]):
        raise HTTPException(
            status_code=401,
            detail="Password incorrect"
               )


    if not existing_user["is_active"]:
        raise HTTPException(
            status_code=401,
            detail="User is inactive"
               )

    access_token = create_access_token(
        user_id = str(existing_user["_id"]),
        role = existing_user["role"]    
        )


    return {
        "message": "Login successful",
        "token": access_token,
        "token_type": 'bearer'

    }


@router.get("/users")
async def get_users(
    current_user=Depends(get_current_user)
):

    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admins can access users"
        )

    users = await users_collection.find(
        {}
    ).to_list(length=None)

    result = []

    for user in users:

        result.append({
            "_id": str(user["_id"]),
            "username": user["username"],
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"],
            "is_active": user["is_active"]
        })

    return result
