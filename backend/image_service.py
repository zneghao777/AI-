from __future__ import annotations

import base64
import json
import os
import time
from dataclasses import dataclass
from datetime import datetime
from io import BytesIO
from pathlib import Path
from typing import Sequence
from uuid import uuid4

from google import genai
from google.genai import types
from PIL import Image as PILImage
from PIL import ImageChops as PILImageChops
from PIL import ImageDraw
from PIL import ImageStat as PILImageStat

PROJECT_ROOT = Path(__file__).resolve().parent.parent
PUBLIC_FLOORPLAN_DIR = PROJECT_ROOT / "public" / "floorplans"
OUTPUT_DIR = PROJECT_ROOT / "output"
GENERATED_DIR = OUTPUT_DIR / "generated"
REFERENCE_DIR = OUTPUT_DIR / "references"
DOTENV_PATH = PROJECT_ROOT / ".env"

DEFAULT_IMAGE_MODEL = "gemini-3.1-flash-image-preview"
MAX_GENERATION_ATTEMPTS = 1
MAX_PANORAMA_SHAPE_ATTEMPTS = 3
MAX_LAYOUT_REPAIR_ATTEMPTS = 1
RETRYABLE_ERROR_MARKERS = ("503", "429", "UNAVAILABLE", "RESOURCE_EXHAUSTED", "high demand")
PANORAMA_TARGET_ASPECT_RATIO = 4.0
PANORAMA_MIN_ASPECT_RATIO = 3.6
PANORAMA_MAX_ASPECT_RATIO = 4.4
FLOOR_PLAN_PATHS = {
    "B1": PUBLIC_FLOORPLAN_DIR / "b1.png",
    "F1": PUBLIC_FLOORPLAN_DIR / "f1.png",
    "F2": PUBLIC_FLOORPLAN_DIR / "f2.png",
    "F3": PUBLIC_FLOORPLAN_DIR / "f3.png",
}

for directory in (OUTPUT_DIR, GENERATED_DIR, REFERENCE_DIR):
    directory.mkdir(parents=True, exist_ok=True)


@dataclass
class ReferenceAssets:
    crop_image: PILImage.Image
    context_image: PILImage.Image
    local_context_image: PILImage.Image
    mask_image: PILImage.Image
    crop_path: Path
    context_path: Path
    local_context_path: Path
    mask_path: Path


@dataclass
class GeneratedView:
    output_path: Path
    output_url: str
    view_id: str
    label: str
    text_response: str


@dataclass
class GenerationResult:
    model_name: str
    resolution: str
    reference_urls: dict[str, str]
    images: list[GeneratedView]


def load_project_env() -> None:
    if not DOTENV_PATH.exists():
        return

    for raw_line in DOTENV_PATH.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip("'").strip('"')
        if key and key not in os.environ:
            os.environ[key] = value


def get_api_key() -> str | None:
    load_project_env()
    return os.environ.get("GEMINI_API_KEY")


def get_base_url() -> str | None:
    load_project_env()
    return (
        os.environ.get("GOOGLE_GEMINI_BASE_URL")
        or os.environ.get("GEMINI_BASE_URL")
    )


def get_image_model() -> str:
    load_project_env()
    return (
        os.environ.get("IMAGE_MODEL")
        or os.environ.get("GEMINI_IMAGE_MODEL")
        or DEFAULT_IMAGE_MODEL
    )


def normalize_resolution(value: str) -> str:
    normalized = value.strip().upper()
    mapping = {
        "1080P": "1K",
        "1K": "1K",
        "2K": "2K",
        "4K": "4K",
    }
    if normalized not in mapping:
        raise ValueError(f"Unsupported resolution: {value}")
    return mapping[normalized]


def effective_panorama_resolution(value: str) -> str:
    normalized = normalize_resolution(value)
    if normalized in {"1K", "2K"}:
        return "4K"
    return normalized


def create_client(api_key: str, base_url: str | None):
    client_kwargs: dict[str, object] = {"api_key": api_key}
    if base_url:
        client_kwargs["http_options"] = {"base_url": base_url}
    return genai.Client(**client_kwargs)


def save_image_part(image_data: bytes | str, output_path: Path) -> None:
    if isinstance(image_data, str):
        image_data = base64.b64decode(image_data)

    image = PILImage.open(BytesIO(image_data))
    if image.mode == "RGBA":
        rgb_image = PILImage.new("RGB", image.size, (255, 255, 255))
        rgb_image.paste(image, mask=image.split()[3])
        rgb_image.save(str(output_path), "PNG")
    elif image.mode == "RGB":
        image.save(str(output_path), "PNG")
    else:
        image.convert("RGB").save(str(output_path), "PNG")


def load_saved_rgb_image(image_path: Path) -> PILImage.Image:
    with PILImage.open(image_path) as image:
        return image.convert("RGB").copy()


def split_triptych_image(composite_image: PILImage.Image, view_count: int) -> list[PILImage.Image]:
    width, height = composite_image.size
    if view_count <= 0:
        raise ValueError("view_count must be positive.")
    if width < view_count * 120:
        raise ValueError("Generated composite image is too narrow to split into distinct views.")

    slices: list[PILImage.Image] = []
    base_slice_width = width / view_count

    for index in range(view_count):
        left = round(index * base_slice_width)
        right = round((index + 1) * base_slice_width)
        if right <= left:
            raise ValueError("Triptych split produced an invalid crop window.")
        slices.append(composite_image.crop((left, 0, right, height)).copy())

    return slices


def _polygon_to_pixels(area: Sequence[Sequence[float]], width: int, height: int) -> list[tuple[int, int]]:
    return [
        (round(point[0] / 100 * width), round(point[1] / 100 * height))
        for point in area
    ]


def _request_id(room_id: str) -> str:
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    return f"{timestamp}-{room_id}-{uuid4().hex[:8]}"


def _is_retryable_generation_error(error: Exception) -> bool:
    message = str(error).upper()
    return any(marker.upper() in message for marker in RETRYABLE_ERROR_MARKERS)


def _image_aspect_ratio(image: PILImage.Image) -> float:
    return image.width / max(image.height, 1)


def _is_valid_panorama_aspect_ratio(image: PILImage.Image) -> bool:
    ratio = _image_aspect_ratio(image)
    return PANORAMA_MIN_ASPECT_RATIO <= ratio <= PANORAMA_MAX_ASPECT_RATIO


def _mean_image_difference(image_a: PILImage.Image, image_b: PILImage.Image) -> float:
    diff = PILImageChops.difference(image_a, image_b)
    stat = PILImageStat.Stat(diff)
    return sum(stat.mean) / max(len(stat.mean), 1)


def _detect_repeated_panel_boxes(image: PILImage.Image) -> tuple[str, list[tuple[int, int, int, int]]] | None:
    width, height = image.size

    def build_boxes(axis: str) -> list[tuple[int, int, int, int]]:
        boxes: list[tuple[int, int, int, int]] = []
        for index in range(3):
            if axis == "vertical":
                top = round(index * height / 3)
                bottom = round((index + 1) * height / 3)
                panel_margin_x = max(6, round(width * 0.04))
                panel_margin_y = max(6, round((bottom - top) * 0.05))
                boxes.append(
                    (
                        panel_margin_x,
                        min(height, top + panel_margin_y),
                        max(panel_margin_x + 2, width - panel_margin_x),
                        max(top + panel_margin_y + 2, bottom - panel_margin_y),
                    )
                )
            else:
                left = round(index * width / 3)
                right = round((index + 1) * width / 3)
                panel_margin_x = max(6, round((right - left) * 0.05))
                panel_margin_y = max(6, round(height * 0.04))
                boxes.append(
                    (
                        min(width, left + panel_margin_x),
                        panel_margin_y,
                        max(left + panel_margin_x + 2, right - panel_margin_x),
                        max(panel_margin_y + 2, height - panel_margin_y),
                    )
                )
        return boxes

    if height / max(width, 1) >= 1.45:
        boxes = build_boxes("vertical")
        panels = [image.crop(box).resize((256, 256)) for box in boxes]
        scores = (
            _mean_image_difference(panels[0], panels[1]),
            _mean_image_difference(panels[1], panels[2]),
            _mean_image_difference(panels[0], panels[2]),
        )
        if sum(scores) / 3 <= 38:
            return "vertical", boxes

    if width / max(height, 1) >= 2.2:
        boxes = build_boxes("horizontal")
        panels = [image.crop(box).resize((256, 256)) for box in boxes]
        scores = (
            _mean_image_difference(panels[0], panels[1]),
            _mean_image_difference(panels[1], panels[2]),
            _mean_image_difference(panels[0], panels[2]),
        )
        if sum(scores) / 3 <= 42:
            return "horizontal", boxes

    return None


def _normalize_repeated_panel_image(image: PILImage.Image, output_path: Path) -> tuple[PILImage.Image, bool]:
    detection = _detect_repeated_panel_boxes(image)
    if detection is None:
        return image, False

    _, boxes = detection
    normalized = image.crop(boxes[1]).copy()
    normalized.save(str(output_path), "PNG")
    return normalized, True


def _infer_room_scene(room_id: str, room_name: str) -> str:
    haystack = f"{room_id} {room_name}".lower()

    if any(keyword in haystack for keyword in ("客厅", "foyer", "玄关", "餐厅", "dining", "living", "multi", "多功能", "台球", "theater", "影音", "tea", "品茗", "bar", "水吧", "棋牌")):
        return "social"
    if any(keyword in haystack for keyword in ("主卧", "卧", "elderly", "老人房", "儿童房", "kid", "master")):
        return "bedroom"
    if any(keyword in haystack for keyword in ("厨房", "kitchen")):
        return "kitchen"
    if any(keyword in haystack for keyword in ("衣帽间", "closet")):
        return "closet"
    if any(keyword in haystack for keyword in ("卫生间", "湿区", "干区", "bath", "wet", "dry", "restroom")):
        return "bathroom"
    if any(keyword in haystack for keyword in ("书房", "study", "佛堂", "shrine")):
        return "focus"
    if any(keyword in haystack for keyword in ("健身", "gym")):
        return "fitness"
    if any(keyword in haystack for keyword in ("露台", "阳台", "terrace", "balcony", "花园")):
        return "terrace"
    return "generic"


def _build_room_program_constraints(room_id: str, room_name: str) -> tuple[str, ...]:
    haystack = f"{room_id} {room_name}".lower()

    if any(keyword in haystack for keyword in ("主卧", "master")):
        return (
            "This room is a master bedroom. Render exactly one primary bed only.",
            "Do not add a second bed, twin beds, bunk beds, or another sleeping zone.",
            "Secondary furniture may include one lounge chair, one bench, one vanity, or one writing desk when spatially believable.",
        )
    if any(keyword in haystack for keyword in ("儿童房", "kid", "child")):
        return (
            "This room is a children's bedroom. Render exactly one child bed only unless the plan explicitly indicates a shared room, which it does not here.",
            "Do not add twin beds, bunk beds, or a second sleeping setup.",
            "Supportive furniture such as a study desk, reading corner, wardrobe, and toy storage is allowed if circulation remains believable.",
        )
    if any(keyword in haystack for keyword in ("老人房", "elderly")):
        return (
            "This room is an elderly bedroom suite. Render exactly one bed only.",
            "Do not add a second bed or a hotel-style double-bed composition.",
        )
    if any(keyword in haystack for keyword in ("台球", "billiard")):
        return (
            "This room is a billiards room. Render exactly one billiards table as the dominant centerpiece.",
            "Do not add beds, dining tables, duplicate game tables, or unrelated bedroom furniture.",
        )
    if any(keyword in haystack for keyword in ("棋牌", "mahjong")):
        return (
            "This room is a mahjong or game room. Render exactly one main game table only.",
            "Do not add beds, duplicate tables, or unrelated living-room seating groups.",
        )
    if any(keyword in haystack for keyword in ("影音", "theater")):
        return (
            "This room is a home theater. Use one coherent screen wall and one main seating group only.",
            "Do not add beds, extra lounge zones, or duplicate focal walls.",
        )
    if any(keyword in haystack for keyword in ("客厅", "living")):
        return (
            "This room is a living room. Use one coherent main seating composition and one focal wall only.",
            "Do not add beds, duplicated sofa islands, or unrelated bedroom program elements.",
        )
    if any(keyword in haystack for keyword in ("餐厅", "dining")):
        return (
            "This room is a dining room. Use one main dining table composition only.",
            "Do not add beds, duplicate dining tables, or unrelated lounge zones.",
        )
    if any(keyword in haystack for keyword in ("厨房", "kitchen")):
        return (
            "This room is a kitchen. Keep one coherent kitchen workflow with one main island or one main counter composition as appropriate.",
            "Do not add beds, duplicate islands, or unrelated lounge furniture.",
        )
    if any(keyword in haystack for keyword in ("衣帽间", "closet")):
        return (
            "This room is a walk-in closet or dressing room. Focus on wardrobe storage and circulation only.",
            "Do not add beds, dining furniture, or unrelated living-room program.",
        )
    if any(keyword in haystack for keyword in ("书房", "study", "佛堂", "shrine")):
        return (
            "This room is a focused quiet space. Use one coherent primary function zone only, such as one desk zone or one worship focal arrangement.",
            "Do not add beds or multiple unrelated focal scenes.",
        )
    if any(keyword in haystack for keyword in ("卫生间", "湿区", "干区", "bath", "wet", "dry")):
        return (
            "This room is a bathroom area. Keep sanitary fixtures realistic and limited to the correct bathroom program.",
            "Do not add beds, sofas, dining furniture, or unrelated living-space objects.",
        )
    if any(keyword in haystack for keyword in ("露台", "阳台", "terrace", "balcony", "garden")):
        return (
            "This room is an outdoor terrace or balcony. Use one coherent outdoor seating or dining arrangement only.",
            "Do not add beds or indoor-only bedroom furniture.",
        )
    return (
        "Keep the room program singular and believable.",
        "Do not duplicate the dominant furniture set or introduce a second unrelated main function.",
    )


def _build_view_presets(room_id: str, room_name: str) -> tuple[dict[str, str], ...]:
    scene = _infer_room_scene(room_id, room_name)

    scene_presets: dict[str, tuple[dict[str, str], ...]] = {
        "social": (
            {
                "id": "view-01",
                "label": "入口主视角",
                "camera_prompt": "Render a wide eye-level hero shot from the entrance side or circulation edge, looking into the main seating or gathering zone. Use a 20mm to 24mm interior lens feel, keep the feature wall or main focal furniture centered, and show the overall room layout clearly.",
            },
            {
                "id": "view-02",
                "label": "对角纵深视角",
                "camera_prompt": "Render a clearly different eye-level diagonal view from the opposite rear corner, looking back across the room toward the main feature wall or seating group. The composition must be obviously different from the hero shot, with stronger side-to-side depth, a visible foreground element, and a 28mm to 32mm lens feel.",
            },
            {
                "id": "view-03",
                "label": "侧向材质视角",
                "camera_prompt": "Render a medium eye-level side angle from along one wall or beside a furniture group, focusing on material layers, lighting mood, cabinetry, and decorative detail. This shot must not look like another full-room overview; use a tighter 35mm to 50mm lens feel while still keeping enough context to recognize the same room.",
            },
        ),
        "bedroom": (
            {
                "id": "view-01",
                "label": "床尾主视角",
                "camera_prompt": "Render a wide eye-level shot from near the bedroom entrance or bed corner, showing the bed, headboard wall, and overall restful layout. Keep the bed as the dominant focal point with a 24mm interior lens feel.",
            },
            {
                "id": "view-02",
                "label": "床侧对角视角",
                "camera_prompt": "Render a clearly different eye-level diagonal shot from the opposite side of the bedroom, so the bed is seen from a side angle rather than the same frontal composition. Include the reading chair, vanity, or lounge corner when available, and use a 28mm to 35mm lens feel.",
            },
            {
                "id": "view-03",
                "label": "材质氛围视角",
                "camera_prompt": "Render a tighter eye-level side shot focused on textiles, bedside lighting, cabinetry, and premium material transitions. Avoid repeating the bed-wide overview; use a 40mm to 50mm lens feel and frame a more intimate composition.",
            },
        ),
        "kitchen": (
            {
                "id": "view-01",
                "label": "操作区主视角",
                "camera_prompt": "Render a wide eye-level kitchen hero shot from the entrance side, showing the island or main worktop, tall cabinetry, appliances, and practical circulation in a clean architectural composition. Use a 20mm to 24mm lens feel.",
            },
            {
                "id": "view-02",
                "label": "岛台纵深视角",
                "camera_prompt": "Render a clearly different eye-level diagonal shot running along the island or counter line, emphasizing depth, cabinet rhythm, and premium material continuity. Do not repeat the same entrance-facing overview; use a 28mm to 32mm lens feel.",
            },
            {
                "id": "view-03",
                "label": "收纳细节视角",
                "camera_prompt": "Render a medium eye-level side perspective focused on cabinetry, shelving, lighting, backsplash, and refined kitchen detailing. Keep it recognizably the same kitchen, but frame it tighter than the first two views with a 35mm to 50mm lens feel.",
            },
        ),
        "closet": (
            {
                "id": "view-01",
                "label": "通廊主视角",
                "camera_prompt": "Render an eye-level hero shot looking through the closet aisle, emphasizing symmetry, cabinetry rhythm, display shelving, and boutique-style depth.",
            },
            {
                "id": "view-02",
                "label": "柜体侧视角",
                "camera_prompt": "Render an eye-level diagonal side angle that highlights wardrobe doors, open shelving, integrated lighting, and premium organization details.",
            },
            {
                "id": "view-03",
                "label": "展示细节视角",
                "camera_prompt": "Render a tighter eye-level atmospheric angle focused on wardrobe textures, glass display units, hardware, and lighting accents, while still reading as a walk-in closet.",
            },
        ),
        "bathroom": (
            {
                "id": "view-01",
                "label": "入口主视角",
                "camera_prompt": "Render a wide eye-level bathroom shot from the doorway or dry-zone edge, clearly showing the vanity, mirror, and spatial order. Keep it architectural and realistic, never top-down, with a 20mm to 24mm lens feel.",
            },
            {
                "id": "view-02",
                "label": "台盆镜柜视角",
                "camera_prompt": "Render a clearly different eye-level diagonal shot from the opposite side of the vanity zone, focused on the vanity, mirror lighting, stone surfaces, niches, and storage. Avoid repeating the doorway overview; use a 28mm to 35mm lens feel.",
            },
            {
                "id": "view-03",
                "label": "湿区材质视角",
                "camera_prompt": "Render a tighter eye-level side perspective focused on shower or wet-zone materials, fixtures, lighting, and refined detailing. This must read as a more local material shot, not another overall bathroom overview.",
            },
        ),
        "focus": (
            {
                "id": "view-01",
                "label": "主功能视角",
                "camera_prompt": "Render an eye-level hero shot centered on the main desk, altar, or focus object, with balanced symmetry and a calm, intentional architectural composition.",
            },
            {
                "id": "view-02",
                "label": "空间关系视角",
                "camera_prompt": "Render an eye-level diagonal view showing the relationship between the focal furniture, storage, display walls, and circulation depth.",
            },
            {
                "id": "view-03",
                "label": "静谧氛围视角",
                "camera_prompt": "Render a quieter eye-level atmospheric view focused on lighting, joinery, art, texture, and contemplative mood while staying recognizably inside the same room.",
            },
        ),
        "fitness": (
            {
                "id": "view-01",
                "label": "训练区主视角",
                "camera_prompt": "Render a wide eye-level hero shot showing the main fitness equipment layout, mirrors, and circulation in a bright premium residential gym composition. Use a 20mm to 24mm lens feel.",
            },
            {
                "id": "view-02",
                "label": "动线纵深视角",
                "camera_prompt": "Render a clearly different eye-level diagonal corner shot from the opposite side, emphasizing workout flow, spatial depth, and the relationship between equipment and wall treatments. Do not repeat the same gym overview.",
            },
            {
                "id": "view-03",
                "label": "器械材质视角",
                "camera_prompt": "Render a medium eye-level side angle focused on premium finishes, mirrored surfaces, equipment detail, and lighting atmosphere while still reading clearly as the gym area. Keep this noticeably tighter than the first two views.",
            },
        ),
        "terrace": (
            {
                "id": "view-01",
                "label": "露台主视角",
                "camera_prompt": "Render a wide eye-level terrace hero shot from the access point, showing the primary lounge or garden arrangement with realistic outdoor residential perspective and layered depth.",
            },
            {
                "id": "view-02",
                "label": "景观纵深视角",
                "camera_prompt": "Render a clearly different eye-level diagonal angle from the opposite side, showing planting, seating, paving, and spatial layering across the terrace without turning into a top-down landscape plan.",
            },
            {
                "id": "view-03",
                "label": "氛围细节视角",
                "camera_prompt": "Render a medium eye-level side perspective focused on outdoor materials, lighting, soft furnishings, and garden atmosphere while remaining clearly inside the same terrace. This should feel tighter and more atmospheric than the first two views.",
            },
        ),
        "generic": (
            {
                "id": "view-01",
                "label": "入口主视角",
                "camera_prompt": "Render a wide eye-level hero shot from near the entrance, looking into the main functional zone. Camera height around 1.55m, lens feel around 20mm to 24mm, with the main feature or furniture group as the clear focal point.",
            },
            {
                "id": "view-02",
                "label": "对角纵深视角",
                "camera_prompt": "Render a clearly different eye-level diagonal shot from the opposite rear corner, showing spatial depth, circulation, and the relationship between the main furniture group and the surrounding walls. Do not reuse the same frontal composition as the hero shot.",
            },
            {
                "id": "view-03",
                "label": "侧向材质视角",
                "camera_prompt": "Render a medium eye-level side perspective focused on material layering, lighting atmosphere, cabinetry, and refined decorative details while still reading clearly as the same room. Keep this shot tighter and more lateral than the first two views.",
            },
        ),
    }

    return scene_presets.get(scene, scene_presets["generic"])


def _generate_with_retry(*, client, model_name: str, contents: list[object], output_resolution: str):
    response = None
    last_error: Exception | None = None

    for attempt in range(1, MAX_GENERATION_ATTEMPTS + 1):
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=contents,
                config=types.GenerateContentConfig(
                    response_modalities=["TEXT", "IMAGE"],
                    image_config=types.ImageConfig(image_size=output_resolution),
                ),
            )
            last_error = None
            break
        except Exception as exc:  # pragma: no cover
            last_error = exc
            if attempt >= MAX_GENERATION_ATTEMPTS or not _is_retryable_generation_error(exc):
                raise
            time.sleep(attempt * 2)

    if response is None:
        raise RuntimeError(f"Model request failed without a response: {last_error}")

    return response


def _save_generated_response_image(response, output_path: Path) -> tuple[PILImage.Image, str]:
    text_parts: list[str] = []
    image_saved = False

    for part in response.parts:
        if part.text:
            text_parts.append(part.text)
        elif part.inline_data is not None:
            save_image_part(part.inline_data.data, output_path)
            image_saved = True

    if not image_saved:
        raise RuntimeError("Model response did not include a generated image.")

    generated_image = load_saved_rgb_image(output_path)
    return generated_image, "\n".join(text_parts).strip()


def build_reference_assets(
    *,
    floor_id: str,
    room_id: str,
    room_name: str,
    polygons: Sequence[Sequence[Sequence[float]]],
    request_id: str,
) -> ReferenceAssets:
    floor_plan_path = FLOOR_PLAN_PATHS.get(floor_id)
    if not floor_plan_path or not floor_plan_path.exists():
        raise FileNotFoundError(f"Floor plan image not found for floor {floor_id}.")

    base_image = PILImage.open(floor_plan_path).convert("RGBA")
    width, height = base_image.size

    mask = PILImage.new("L", (width, height), 0)
    mask_draw = ImageDraw.Draw(mask)

    for polygon in polygons:
      mask_draw.polygon(_polygon_to_pixels(polygon, width, height), fill=255)

    bbox = mask.getbbox()
    if bbox is None:
        raise ValueError("Selected polygons did not produce a valid room mask.")

    crop_image = PILImage.new("RGB", (width, height), (248, 243, 231))
    crop_image.paste(base_image.convert("RGB"), mask=mask)
    crop_image = crop_image.crop(bbox)

    context_image = base_image.copy()
    overlay = PILImage.new("RGBA", (width, height), (255, 255, 255, 0))
    overlay_draw = ImageDraw.Draw(overlay)
    for polygon in polygons:
        points = _polygon_to_pixels(polygon, width, height)
        overlay_draw.polygon(points, fill=(214, 184, 103, 72), outline=(138, 106, 23, 255))
    context_image = PILImage.alpha_composite(context_image, overlay).convert("RGB")

    bbox_width = bbox[2] - bbox[0]
    bbox_height = bbox[3] - bbox[1]
    local_padding = round(max(bbox_width, bbox_height) * 0.45)
    local_padding = max(80, min(local_padding, round(max(width, height) * 0.16)))
    local_left = max(0, bbox[0] - local_padding)
    local_top = max(0, bbox[1] - local_padding)
    local_right = min(width, bbox[2] + local_padding)
    local_bottom = min(height, bbox[3] + local_padding)
    local_context_image = context_image.crop((local_left, local_top, local_right, local_bottom))

    mask_image = PILImage.new("RGB", (width, height), (18, 18, 18))
    mask_image.paste(PILImage.new("RGB", (width, height), (255, 255, 255)), mask=mask)
    mask_image = mask_image.crop(bbox)

    crop_path = REFERENCE_DIR / f"{request_id}-crop.png"
    context_path = REFERENCE_DIR / f"{request_id}-context.png"
    local_context_path = REFERENCE_DIR / f"{request_id}-local-context.png"
    mask_path = REFERENCE_DIR / f"{request_id}-mask.png"

    crop_image.save(crop_path, "PNG")
    context_image.save(context_path, "PNG")
    local_context_image.save(local_context_path, "PNG")
    mask_image.save(mask_path, "PNG")

    metadata_path = REFERENCE_DIR / f"{request_id}-request.json"
    metadata_path.write_text(
        json.dumps(
            {
                "roomId": room_id,
                "roomName": room_name,
                "floorId": floor_id,
                "polygons": polygons,
                "bbox": bbox,
                "localContextBox": [local_left, local_top, local_right, local_bottom],
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    return ReferenceAssets(
        crop_image=crop_image,
        context_image=context_image,
        local_context_image=local_context_image,
        mask_image=mask_image,
        crop_path=crop_path,
        context_path=context_path,
        local_context_path=local_context_path,
        mask_path=mask_path,
    )


def generate_room_image(
    *,
    floor_id: str,
    floor_name: str,
    room_id: str,
    room_name: str,
    polygons: Sequence[Sequence[Sequence[float]]],
    prompt: str,
    resolution: str,
) -> GenerationResult:
    api_key = get_api_key()
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is missing. Please configure it in the project .env file.")

    base_url = get_base_url()
    model_name = get_image_model()
    output_resolution = normalize_resolution(resolution)
    request_id = _request_id(room_id)

    references = build_reference_assets(
        floor_id=floor_id,
        room_id=room_id,
        room_name=room_name,
        polygons=polygons,
        request_id=request_id,
    )
    room_program_constraints = _build_room_program_constraints(room_id, room_name)

    base_prompt = "\n".join(
        [
            f"Target floor: {floor_name}",
            f"Target room: {room_name}",
            "Use the provided architectural references to generate one photorealistic interior render.",
            "The cropped image is the exact allowed room region. Keep the composition strictly inside this room and do not include adjacent spaces.",
            "Treat the floor-plan references as structural constraints, not loose inspiration.",
            "Preserve the room geometry implied by the plan, including wall directions, corner positions, major recesses, fixed wet areas, and believable overall proportion.",
            "Do not invent extra rooms, extra wall segments, random alcoves, new columns, or impossible ceiling geometry.",
            "Do not move, remove, or fabricate major door openings, window openings, or passage directions that conflict with the reference plan.",
            "Furniture placement, cabinetry, focal walls, and circulation must respect the plan boundaries and remain believable.",
            "This must be a normal eye-level interior perspective render, not a floor plan, not a bird's-eye view, not a top-down shot, and not an axonometric diagram.",
            "Keep the architecture visually stable and realistic. Avoid warped walls, bent cabinetry, stretched furniture, duplicated objects, broken symmetry, or impossible perspective distortions.",
            "The room program must stay singular and correct for this specific room type. Avoid mixing incompatible programs or duplicating the dominant focal furniture.",
            *room_program_constraints,
            prompt.strip(),
        ]
    ).strip()

    client = create_client(api_key, base_url)
    preset = _build_view_presets(room_id, room_name)[0]
    output_path = GENERATED_DIR / f"{request_id}-{preset['id']}.png"
    generated_image: PILImage.Image | None = None
    text_response = ""

    for layout_attempt in range(1, MAX_LAYOUT_REPAIR_ATTEMPTS + 1):
        prompt_sections = [
            base_prompt,
            "Generate exactly one single image only.",
            "This request needs one hero interior render for the finalized room design.",
            "Keep the composition as one normal architectural interior render with high clarity.",
            "Do not create a panorama, fisheye image, collage, split-frame, storyboard, contact sheet, or multi-panel layout.",
            "The canvas must contain only one uninterrupted camera view. Never repeat the same room multiple times inside one image.",
            preset["camera_prompt"],
        ]

        if layout_attempt > 1:
            prompt_sections.extend(
                [
                    f"Critical correction for retry {layout_attempt}: the previous image incorrectly repeated the scene multiple times in one canvas.",
                    "This retry must return one single uninterrupted render only, with no stacked duplicates and no triptych layout.",
                ]
            )

        contents: list[object] = [
            references.context_image,
            references.local_context_image,
            references.crop_image,
            references.mask_image,
            "\n".join(prompt_sections).strip(),
        ]

        response = _generate_with_retry(
            client=client,
            model_name=model_name,
            contents=contents,
            output_resolution=output_resolution,
        )
        candidate_image, text_response = _save_generated_response_image(response, output_path)

        if _detect_repeated_panel_boxes(candidate_image) is None:
            generated_image = candidate_image
            break

        generated_image = candidate_image

    if generated_image is None:
        raise RuntimeError(f"Failed to generate a usable image for {preset['label']}.")

    generated_image, _ = _normalize_repeated_panel_image(generated_image, output_path)
    generated_images = [
        GeneratedView(
            output_path=output_path.resolve(),
            output_url=f"/generated/{output_path.name}",
            view_id=preset["id"],
            label=preset["label"],
            text_response=text_response,
        )
    ]

    return GenerationResult(
        model_name=model_name,
        resolution=output_resolution,
        reference_urls={
            "crop": f"/references/{references.crop_path.name}",
            "context": f"/references/{references.context_path.name}",
            "localContext": f"/references/{references.local_context_path.name}",
            "mask": f"/references/{references.mask_path.name}",
        },
        images=generated_images,
    )
