from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId

from app.schemas.holidays import HolidayCreate
from app.database.mongodb import holidays_collection
from app.core.dependencies import require_admin, get_current_user

router = APIRouter()


@router.post("/holidays")
async def create_holiday(
    holiday: HolidayCreate,
    current_user=Depends(require_admin)
):

    existing_holiday = await holidays_collection.find_one({
        "holiday_date": holiday.holiday_date.isoformat()
    })

    if existing_holiday:
        raise HTTPException(
            status_code=400,
            detail="Holiday already exists for this date"
        )

    holiday_data = {
        "holiday_name": holiday.holiday_name,
        "holiday_date": holiday.holiday_date.isoformat()
    }

    result = await holidays_collection.insert_one(
        holiday_data
    )

    return {
        "message": "Holiday created successfully",
        "id": str(result.inserted_id)
    }


@router.get("/holidays")
async def get_holidays(
    current_user=Depends(get_current_user)
):

    holidays = await holidays_collection.find(
        {}
    ).sort("holiday_date", 1).to_list(length=None)

    result = []

    for holiday in holidays:
        result.append({
            "_id": str(holiday["_id"]),
            "holiday_name": holiday["holiday_name"],
            "holiday_date": holiday["holiday_date"]
        })

    return result


@router.put("/holidays/{holiday_id}")
async def update_holiday(
    holiday_id: str,
    holiday: HolidayCreate,
    current_user=Depends(require_admin)
):

    existing_holiday = await holidays_collection.find_one({
        "_id": ObjectId(holiday_id)
    })

    if not existing_holiday:
        raise HTTPException(
            status_code=404,
            detail="Holiday not found"
        )

    duplicate_holiday = await holidays_collection.find_one({
        "holiday_date": holiday.holiday_date.isoformat(),
        "_id": {
            "$ne": ObjectId(holiday_id)
        }
    })

    if duplicate_holiday:
        raise HTTPException(
            status_code=400,
            detail="Another holiday already exists for this date"
        )

    await holidays_collection.update_one(
        {
            "_id": ObjectId(holiday_id)
        },
        {
            "$set": {
                "holiday_name": holiday.holiday_name,
                "holiday_date": holiday.holiday_date.isoformat()
            }
        }
    )

    return {
        "message": "Holiday updated successfully"
    }


@router.delete("/holidays/{holiday_id}")
async def delete_holiday(
    holiday_id: str,
    current_user=Depends(require_admin)
):

    existing_holiday = await holidays_collection.find_one({
        "_id": ObjectId(holiday_id)
    })

    if not existing_holiday:
        raise HTTPException(
            status_code=404,
            detail="Holiday not found"
        )

    await holidays_collection.delete_one({
        "_id": ObjectId(holiday_id)
    })

    return {
        "message": "Holiday deleted successfully"
    }