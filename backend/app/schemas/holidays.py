from pydantic import BaseModel
from datetime import datetime

class HolidayCreate(BaseModel):
    holiday_name: str
    holiday_date: datetime
