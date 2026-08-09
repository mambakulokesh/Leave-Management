from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


from app.database.mongodb import client
from app.routers.authRoutes import router as auth_router
from app.routers.userRoutes import router as users_router
from app.routers.leaveRoutes import router as leave_router


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(leave_router)

@app.get('/')
async def read_root():
    return {
        "message": "Leave Management API is running"
    }


@app.get('/test-db')
async def check_db():
    await client.admin.command('ping')
    return {
        "message": "MongoDB Connected Successfully"
    }
