from datetime import datetime
from typing import Any

from bson import ObjectId
from pydantic import BaseModel, ConfigDict, GetCoreSchemaHandler
from pydantic_core import core_schema


class PyObjectId(str):
    @classmethod
    def __get_pydantic_core_schema__(cls, source_type: Any, handler: GetCoreSchemaHandler):
        def validate(value: Any) -> str:
            if isinstance(value, ObjectId):
                return str(value)
            if isinstance(value, str) and ObjectId.is_valid(value):
                return value
            raise ValueError("Invalid ObjectId")

        return core_schema.no_info_plain_validator_function(
            validate,
            serialization=core_schema.to_string_ser_schema(),
        )


class MongoBaseModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)


def utcnow() -> datetime:
    return datetime.utcnow()


def doc_out(doc: dict) -> dict:
    """Normalize a raw Mongo document for API output: _id -> id (str)."""
    if doc is None:
        return doc
    out = dict(doc)
    if "_id" in out:
        out["id"] = str(out.pop("_id"))
    return out
