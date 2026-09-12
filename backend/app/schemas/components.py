from typing import Optional

from pydantic import BaseModel

from app.models.component import ComponentField, ComponentVariant, DesignContract


class ComponentCreate(BaseModel):
    name: str
    slug: str
    type: str
    variants: list[ComponentVariant] = []
    fields: list[ComponentField] = []
    design_contract: DesignContract = DesignContract()


class ComponentUpdate(BaseModel):
    name: Optional[str] = None
    variants: Optional[list[ComponentVariant]] = None
    fields: Optional[list[ComponentField]] = None
    design_contract: Optional[DesignContract] = None
    status: Optional[str] = None
