"""FastAPI application entry point for Prism backend."""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import cost, images, slides, style
from config import settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)

app = FastAPI(
    title="Prism API",
    version="0.1.0",
    description="AI-powered slide image generation backend",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Route registration order matters: most specific patterns first.
# 1. style routes:  /{slug}/style/...     (most specific)
# 2. images routes: /{slug}/{sid}/images/...
# 3. cost routes:   /cost/{slug}          (independent path)
# 4. slides routes: /{slug}/{sid}         (most generic, must be last)
app.include_router(style.router)
app.include_router(images.router)
app.include_router(cost.router)
app.include_router(slides.router)


@app.get("/health")
async def health() -> dict:
    """Health check endpoint."""
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
    )
