from typing import Optional

from pydantic import BaseModel

from app.models.navigation import NavItem


class NavigationCreate(BaseModel):
    property_id: str
    type: str
    items: list[NavItem] = []


class NavigationUpdate(BaseModel):
    items: Optional[list[NavItem]] = None
