from pydantic import BaseModel

class LeaveTypeCreate(BaseModel):
    leave_type : str
    leave_reason : str
    default_days: int

