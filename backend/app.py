from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from backend.image_service import (
    GENERATED_DIR,
    REFERENCE_DIR,
    generate_room_image,
    get_api_key,
    get_image_model,
)
from backend.storage_service import (
    list_gallery_items,
    list_history_items,
    save_gallery_item,
    save_history_item,
)

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DIST_DIR = PROJECT_ROOT / "dist"
DIST_INDEX_FILE = DIST_DIR / "index.html"


class GenerateRequest(BaseModel):
    floor_id: str = Field(alias="floorId")
    floor_name: str = Field(alias="floorName")
    room_id: str = Field(alias="roomId")
    room_name: str = Field(alias="roomName")
    prompt: str
    resolution: str
    polygons: list[list[list[float]]]


class GalleryItemPayload(BaseModel):
    id: str
    image_url: str = Field(alias="imageUrl")
    image_urls: list[str] = Field(alias="imageUrls")
    view_labels: list[str] = Field(alias="viewLabels")
    created_at: str = Field(alias="createdAt")
    floor_name: str = Field(alias="floorName")
    room_name: str = Field(alias="roomName")
    prompt: str
    coverage_percent: float = Field(alias="coveragePercent")


class HistoryItemPayload(BaseModel):
    id: str
    date: str
    room: str
    floor: str
    status: str
    resolution: str
    image_url: str | None = Field(default=None, alias="imageUrl")
    image_count: int | None = Field(default=None, alias="imageCount")


app = FastAPI(title="Villa Image Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/generated", StaticFiles(directory=str(GENERATED_DIR)), name="generated")
app.mount("/references", StaticFiles(directory=str(REFERENCE_DIR)), name="references")


@app.get("/api/health")
def health():
    return {
        "ok": True,
        "geminiConfigured": bool(get_api_key()),
        "imageModel": get_image_model(),
    }


@app.get("/api/gallery")
def get_gallery():
    return {"items": list_gallery_items()}


@app.post("/api/gallery")
def create_gallery_item(payload: GalleryItemPayload):
    item = save_gallery_item(payload.model_dump(by_alias=True))
    return {"item": item}


@app.get("/api/history")
def get_history():
    return {"items": list_history_items()}


@app.post("/api/history")
def create_history_item(payload: HistoryItemPayload):
    item = save_history_item(payload.model_dump(by_alias=True, exclude_none=True))
    return {"item": item}


@app.post("/api/generate")
def generate(payload: GenerateRequest):
    try:
        result = generate_room_image(
            floor_id=payload.floor_id,
            floor_name=payload.floor_name,
            room_id=payload.room_id,
            room_name=payload.room_name,
            polygons=payload.polygons,
            prompt=payload.prompt,
            resolution=payload.resolution,
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=500, detail=f"Unexpected generation error: {exc}") from exc

    return {
        "imageUrl": result.images[0].output_url if result.images else None,
        "textResponse": result.images[0].text_response if result.images else "",
        "images": [
            {
                "viewId": image.view_id,
                "label": image.label,
                "imageUrl": image.output_url,
                "textResponse": image.text_response,
            }
            for image in result.images
        ],
        "model": result.model_name,
        "resolution": result.resolution,
        "referenceImages": result.reference_urls,
    }


def _frontend_index_file() -> Path | None:
    return DIST_INDEX_FILE if DIST_INDEX_FILE.is_file() else None


def _frontend_file_for_path(full_path: str) -> Path | None:
    normalized_path = full_path.strip("/")
    if not normalized_path:
        return _frontend_index_file()

    dist_root = DIST_DIR.resolve()
    candidate = (DIST_DIR / normalized_path).resolve()

    try:
        candidate.relative_to(dist_root)
    except ValueError:
        return None

    if candidate.is_file():
        return candidate

    nested_index = candidate / "index.html"
    if nested_index.is_file():
        return nested_index

    return None


@app.get("/", include_in_schema=False)
def frontend_index():
    index_file = _frontend_index_file()
    if not index_file:
        raise HTTPException(
            status_code=404,
            detail="Frontend build not found. Run `npm run build` first.",
        )
    return FileResponse(index_file)


@app.get("/{full_path:path}", include_in_schema=False)
def frontend_file(full_path: str):
    matched_file = _frontend_file_for_path(full_path)
    if matched_file:
        return FileResponse(matched_file)

    index_file = _frontend_index_file()
    if index_file:
        return FileResponse(index_file)

    raise HTTPException(
        status_code=404,
        detail="Frontend build not found. Run `npm run build` first.",
    )
