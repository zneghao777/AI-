from __future__ import annotations

import json
from pathlib import Path
from threading import Lock
from typing import Any

PROJECT_ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIR = PROJECT_ROOT / "output"
STORAGE_DIR = OUTPUT_DIR / "storage"
GALLERY_DB_PATH = STORAGE_DIR / "gallery.json"
HISTORY_DB_PATH = STORAGE_DIR / "history.json"

_storage_lock = Lock()

for directory in (OUTPUT_DIR, STORAGE_DIR):
    directory.mkdir(parents=True, exist_ok=True)


def _read_records(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []

    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return []

    return data if isinstance(data, list) else []


def _write_records(path: Path, records: list[dict[str, Any]]) -> None:
    path.write_text(
        json.dumps(records, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def list_gallery_items() -> list[dict[str, Any]]:
    with _storage_lock:
        return _read_records(GALLERY_DB_PATH)


def save_gallery_item(item: dict[str, Any]) -> dict[str, Any]:
    with _storage_lock:
        records = _read_records(GALLERY_DB_PATH)
        records.insert(0, item)
        _write_records(GALLERY_DB_PATH, records)
    return item


def list_history_items() -> list[dict[str, Any]]:
    with _storage_lock:
        return _read_records(HISTORY_DB_PATH)


def save_history_item(item: dict[str, Any]) -> dict[str, Any]:
    with _storage_lock:
        records = _read_records(HISTORY_DB_PATH)
        records.insert(0, item)
        _write_records(HISTORY_DB_PATH, records)
    return item
