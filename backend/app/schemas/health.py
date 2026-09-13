from pydantic import BaseModel
from typing import Optional

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str

class DBHealthResponse(BaseModel):
    status: str
    database: str
    vector_support: bool
    tables_count: int
