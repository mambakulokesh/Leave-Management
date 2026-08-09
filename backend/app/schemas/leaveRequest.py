from pydantic import BaseModel
from datetime import date


class LeaveRequestCreate(BaseModel):
    leave_type_id: str
    from_date: date
    to_date: date
    leave_reason: str