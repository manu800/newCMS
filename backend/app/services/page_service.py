from app.repositories.article_repo import article_repo
from app.repositories.component_repo import component_repo


async def resolve_sections(sections: list[dict], device: str = "desktop") -> list[dict]:
    """Attach resolved CommonArticle items + component variant metadata to each section,
    plus the device-specific design override (if any) as `resolved_design`."""
    resolved = []
    for section in sections:
        section = dict(section)
        component = await component_repo.get_by_type(section.get("type"))
        section["component"] = component

        data_source = section.get("data_source")
        if data_source:
            section["items"] = await article_repo.resolve_data_source(data_source)
        else:
            section["items"] = []

        section["resolved_design"] = (section.get("design") or {}).get(device)
        resolved.append(section)
    return resolved
