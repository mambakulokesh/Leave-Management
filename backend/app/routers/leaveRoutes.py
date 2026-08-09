from fastapi import APIRouter, Depends, HTTPException
from datetime import date
from bson import ObjectId

from app.core.dependencies import require_admin, get_current_user
from app.database.mongodb import (
    leave_types_collection,
    leave_balances_collection,
    leave_requests_collection
)
from app.schemas.leave import LeaveTypeCreate
from app.schemas.leaveRequest import LeaveRequestCreate

router = APIRouter()


@router.post("/leave-types")
async def create_leave_type(
    leave_type: LeaveTypeCreate,
    current_user=Depends(require_admin)
):

    leave_type_dict = leave_type.model_dump()

    result = await leave_types_collection.insert_one(
        leave_type_dict
    )

    return {
        "message": "Leave type created successfully",
        "id": str(result.inserted_id)
    }


@router.get("/leave-types")
async def get_leave_types(
    current_user=Depends(get_current_user)
):

    leave_types = []

    cursor = leave_types_collection.find()

    async for leave_type in cursor:
        leave_type["_id"] = str(leave_type["_id"])
        leave_types.append(leave_type)

    return leave_types


@router.get("/my-leave-balances")
async def get_my_leave_balances(
    current_user=Depends(get_current_user)
):

    user_id = str(current_user["_id"])

    balances = await leave_balances_collection.find(
        {
            "user_id": user_id
        }
    ).to_list(length=None)

    result = []

    for balance in balances:

        leave_type = await leave_types_collection.find_one(
            {
                "_id": ObjectId(balance["leave_type_id"])
            }
        )

        result.append({
            "leave_type_id": str(balance["leave_type_id"]),
            "leave_type": leave_type["leave_type"],
            "total_days": balance["total_days"],
            "used_days": balance["used_days"],
            "remaining_days": balance["remaining_days"]
        })

    return result



@router.post("/leave-requests")
async def create_leave_request(
    leave_data: LeaveRequestCreate,
    current_user=Depends(get_current_user)
):

    requested_days = (
        leave_data.to_date - leave_data.from_date
    ).days + 1


    balance = await leave_balances_collection.find_one({
        "user_id": str(current_user["_id"]),
        "leave_type_id": leave_data.leave_type_id
    })


    if not balance:
        raise HTTPException(
            status_code=404,
            detail="Leave balance not found"
        )


    if requested_days > balance["remaining_days"]:
        raise HTTPException(
            status_code=400,
            detail=f"You only have {balance['remaining_days']} days remaining"
        )


    leave_request = {
        "user_id": str(current_user["_id"]),
        "username": current_user["username"],
        "leave_type_id": leave_data.leave_type_id,
        "from_date": leave_data.from_date.isoformat(),
        "to_date": leave_data.to_date.isoformat(),
        "leave_reason": leave_data.leave_reason,
        "requested_days": requested_days,
        "status": "pending"
    }


    result = await leave_requests_collection.insert_one(
        leave_request
    )


    return {
        "message": "Leave request submitted successfully",
        "id": str(result.inserted_id)
    }


@router.get("/my-leave-requests")
async def get_my_leave_requests(
    current_user=Depends(get_current_user)
):

    requests = await leave_requests_collection.find({
        "user_id": str(current_user["_id"])
    }).to_list(length=None)

    result = []

    for request in requests:

        if "requested_days" in request:

            requested_days = request["requested_days"]

        else:

            from_date = date.fromisoformat(
                request["from_date"]
            )

            to_date = date.fromisoformat(
                request["to_date"]
            )

            requested_days = (
                to_date - from_date
            ).days + 1


        result.append({
            "_id": str(request["_id"]),
            "leave_type_id": request["leave_type_id"],
            "from_date": request["from_date"],
            "to_date": request["to_date"],
            "leave_reason": request["leave_reason"],
            "requested_days": requested_days,
            "status": request["status"]
        })

    return result


@router.get("/manager/leave-requests")
async def get_manager_leave_requests(
    current_user=Depends(get_current_user)
):

    if current_user["role"] != "manager":
        raise HTTPException(
            status_code=403,
            detail="Only managers can access leave requests"
        )

    requests = await leave_requests_collection.find({
        "status": "pending"
    }).to_list(length=None)

    result = []

    for request in requests:

        result.append({
            "_id": str(request["_id"]),
            "user_id": request["user_id"],
            "username": request["username"],
            "leave_type_id": request["leave_type_id"],
            "from_date": request["from_date"],
            "to_date": request["to_date"],
            "leave_reason": request["leave_reason"],
            "requested_days": request.get("requested_days", 0),
            "status": request["status"]
        })

    return result



@router.put("/manager/leave-requests/{request_id}/approve")
async def approve_leave_request(
    request_id: str,
    current_user=Depends(get_current_user)
):

    if current_user["role"] != "manager":
        raise HTTPException(
            status_code=403,
            detail="Only managers can approve leave requests"
        )

    request = await leave_requests_collection.find_one({
        "_id": ObjectId(request_id),
        "status": "pending"
    })

    if not request:
        raise HTTPException(
            status_code=404,
            detail="Pending leave request not found"
        )

    # Get requested days
    requested_days = request.get("requested_days")

    # For old records where requested_days does not exist
    if requested_days is None:

        from_date = date.fromisoformat(
            request["from_date"]
        )

        to_date = date.fromisoformat(
            request["to_date"]
        )

        requested_days = (
            to_date - from_date
        ).days + 1


    # Find employee leave balance
    balance = await leave_balances_collection.find_one({
        "user_id": request["user_id"],
        "leave_type_id": request["leave_type_id"]
    })

    if not balance:
        raise HTTPException(
            status_code=404,
            detail="Leave balance not found"
        )


    # Check available balance
    if requested_days > balance["remaining_days"]:
        raise HTTPException(
            status_code=400,
            detail="Insufficient leave balance"
        )


    # Approve leave request
    await leave_requests_collection.update_one(
        {
            "_id": ObjectId(request_id)
        },
        {
            "$set": {
                "status": "approved"
            }
        }
    )


    # Update leave balance
    await leave_balances_collection.update_one(
        {
            "_id": balance["_id"]
        },
        {
            "$inc": {
                "used_days": requested_days,
                "remaining_days": -requested_days
            }
        }
    )


    return {
        "message": "Leave request approved successfully"
    }


@router.put("/manager/leave-requests/{request_id}/reject")
async def reject_leave_request(
    request_id: str,
    current_user=Depends(get_current_user)
):

    if current_user["role"] != "manager":
        raise HTTPException(
            status_code=403,
            detail="Only managers can reject leave requests"
        )

    request = await leave_requests_collection.find_one({
        "_id": ObjectId(request_id),
        "status": "pending"
    })

    if not request:
        raise HTTPException(
            status_code=404,
            detail="Pending leave request not found"
        )

    await leave_requests_collection.update_one(
        {
            "_id": ObjectId(request_id)
        },
        {
            "$set": {
                "status": "rejected"
            }
        }
    )

    return {
        "message": "Leave request rejected successfully"
    }


@router.put("/leave-types/{leave_type_id}")
async def update_leave_type(
    leave_type_id: str,
    leave_data: LeaveTypeCreate,
    current_user=Depends(require_admin)
):

    result = await leave_types_collection.update_one(
        {
            "_id": ObjectId(leave_type_id)
        },
        {
            "$set": {
                "leave_type": leave_data.leave_type,
                "leave_reason": leave_data.leave_reason,
                "default_days": leave_data.default_days
            }
        }
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Leave type not found"
        )

    return {
        "message": "Leave type updated successfully"
    }


@router.delete("/leave-types/{leave_type_id}")
async def delete_leave_type(
    leave_type_id: str,
    current_user=Depends(require_admin)
):

    leave_type = await leave_types_collection.find_one({
        "_id": ObjectId(leave_type_id)
    })

    if not leave_type:
        raise HTTPException(
            status_code=404,
            detail="Leave type not found"
        )

    # Check whether any employee has this leave balance
    balance = await leave_balances_collection.find_one({
        "leave_type_id": leave_type_id
    })

    if balance:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete leave type because leave balances already exist"
        )

    await leave_types_collection.delete_one({
        "_id": ObjectId(leave_type_id)
    })

    return {
        "message": "Leave type deleted successfully"
    }