from pymongo import AsyncMongoClient
from app.core.config import settings

# MONGO_URL = "mongodb://localhost:27017"

client = AsyncMongoClient(settings.MONGO_URL)

database = client[settings.DATABASE_NAME]

users_collection = database["users"]

leave_types_collection = database["leave_types"]

leave_balances_collection = database["leave_balances"]

leave_requests_collection = database["leave_requests"]

holidays_collection = database["holidays"]
