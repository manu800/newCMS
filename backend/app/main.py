from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import (
    articles,
    auth,
    components,
    navigation,
    pages,
    properties,
    pwa,
    pwa_targets,
    themes,
    versions,
)
from app.core.config import settings

app = FastAPI(title="CMS-PWA Platform API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    return JSONResponse(status_code=400, content={"detail": str(exc)})

app.include_router(auth.router)
app.include_router(properties.router)
app.include_router(themes.router)
app.include_router(components.router)
app.include_router(pages.router)
app.include_router(navigation.router)
app.include_router(articles.router)
app.include_router(pwa.router)
app.include_router(pwa_targets.router)
app.include_router(versions.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
