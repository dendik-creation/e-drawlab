#!/usr/bin/env python
"""
Packs a named set of loose sprite files into one spritesheet + a Phaser-
compatible ("TexturePacker JSON Hash") atlas JSON, so a scene can load a whole
UI group with a single `this.load.atlas()` / one GPU texture bind instead of
one `this.load.image()` per icon.

Source files under assets/images/** are left untouched (folder layout stays
final, per the asset-pipeline constraint) — this only reads them and writes
new files under assets/images/atlases/.

Usage: python scripts/pack_atlas.py
Requires: Pillow (already installed in this environment).
"""

from __future__ import annotations

import json
import os

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMAGES = os.path.join(ROOT, "assets", "images")
OUT_DIR = os.path.join(IMAGES, "atlases")

# group name -> ordered list of (frame key, path relative to assets/images)
# Frame keys match the texture keys already used in src/game/**/*.ts, so
# resolveTexture() can look a key up and hand back [atlasGroup, key] instead
# of [key] with no other code needing to change.
GROUPS: dict[str, list[tuple[str, str]]] = {
    "menu-buttons": [
        ("btn-masuklab", "01_menu_buttons/btn_masuklab.webp"),
        ("menu-desain-skema", "01_menu_buttons/menu_desain_skema.webp"),
        ("menu-jalur-pcb", "01_menu_buttons/menu_jalur_pcb.webp"),
        ("menu-cad-casing", "01_menu_buttons/menu_cad_casing.webp"),
        ("menu-evaluasi-akhir", "01_menu_buttons/menu_evaluasi_akhir.webp"),
        ("menu-keluar", "01_menu_buttons/menu_keluar.webp"),
    ],
    "global-buttons": [
        ("bgm-on", "02_global_buttons/global_bgm_on.webp"),
        ("bgm-off", "02_global_buttons/global_bgm_off.webp"),
        ("global-minus", "02_global_buttons/global_minus.webp"),
        ("global-plus", "02_global_buttons/global_plus.webp"),
        ("global-pause", "02_global_buttons/global_pause.webp"),
        ("global-resume-play", "02_global_buttons/global_resume_play.webp"),
        ("go-back", "02_global_buttons/go_back.webp"),
        ("go-home", "02_global_buttons/go_home.webp"),
    ],
    "component-icons": [
        ("badge-checklist", "03_electronic_assets/badge_checklist.webp"),
        ("elec-cube", "03_electronic_assets/elec_3d_cube_icon.webp"),
        ("elec-battery", "03_electronic_assets/elec_battery.webp"),
        ("elec-capacitor", "03_electronic_assets/elec_capacitor.webp"),
        ("elec-diode", "03_electronic_assets/elec_diode.webp"),
        ("elec-etiket", "03_electronic_assets/elec_etiket.webp"),
        ("elec-ic-chip", "03_electronic_assets/elec_ic_chip1.webp"),
        ("elec-ic-chip-orange", "03_electronic_assets/elec_ic_chip_orange.webp"),
        ("elec-inductor", "03_electronic_assets/elec_inductor_coil.webp"),
        ("elec-led", "03_electronic_assets/elec_led.webp"),
        ("elec-opamp", "03_electronic_assets/elec_opamp_triangle.webp"),
        ("elec-pcb-trace", "03_electronic_assets/elec_pcb_trace_icon.webp"),
        ("elec-resistor", "03_electronic_assets/elec_resistor.webp"),
        ("elec-terminal-block", "03_electronic_assets/elec_terminal_block_green.webp"),
        ("elec-usb-connector", "03_electronic_assets/elec_usb_connector.webp"),
    ],
}

PADDING = 2  # px gutter between frames, guards against texture bleed while filtering/scaling


def shelf_pack(sizes: list[tuple[str, int, int]], max_width: int = 2048):
    """Simple shelf packer: sort tallest-first, fill left-to-right, wrap rows.
    Good enough for a few dozen small UI icons; not a general bin packer."""
    ordered = sorted(sizes, key=lambda s: s[2], reverse=True)
    x = y = row_height = 0
    canvas_width = 0
    placements: dict[str, tuple[int, int, int, int]] = {}

    for key, w, h in ordered:
        if x + w > max_width and x > 0:
            x = 0
            y += row_height + PADDING
            row_height = 0
        placements[key] = (x, y, w, h)
        canvas_width = max(canvas_width, x + w)
        row_height = max(row_height, h)
        x += w + PADDING

    canvas_height = y + row_height
    return placements, canvas_width, canvas_height


def pack_group(name: str, entries: list[tuple[str, str]]):
    images: dict[str, Image.Image] = {}
    sizes: list[tuple[str, int, int]] = []

    for key, rel_path in entries:
        path = os.path.join(IMAGES, rel_path)
        im = Image.open(path).convert("RGBA")
        images[key] = im
        sizes.append((key, im.width, im.height))

    placements, width, height = shelf_pack(sizes)

    sheet = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    frames = {}
    for key, (x, y, w, h) in placements.items():
        sheet.paste(images[key], (x, y))
        frames[key] = {
            "frame": {"x": x, "y": y, "w": w, "h": h},
            "rotated": False,
            "trimmed": False,
            "spriteSourceSize": {"x": 0, "y": 0, "w": w, "h": h},
            "sourceSize": {"w": w, "h": h},
        }

    os.makedirs(OUT_DIR, exist_ok=True)
    image_name = f"{name}.webp"
    # Lossy at high quality: these are flat-color UI glyphs rendered at
    # 40-100px on screen, so quality 90 is visually lossless there while
    # landing close to (not 2x+ over) the combined size of the original
    # per-icon webp files that lossless re-encoding of the padded RGBA
    # canvas produced.
    sheet.save(os.path.join(OUT_DIR, image_name), "WEBP", quality=90, method=6)

    atlas = {
        "frames": frames,
        "meta": {
            "app": "e-drawlab/scripts/pack_atlas.py",
            "image": image_name,
            "format": "RGBA8888",
            "size": {"w": width, "h": height},
            "scale": "1",
        },
    }
    with open(os.path.join(OUT_DIR, f"{name}.json"), "w", encoding="utf-8") as f:
        json.dump(atlas, f, indent=2)

    saved_calls = len(entries) - 1
    print(f"{name}: {len(entries)} frames -> {width}x{height} ({saved_calls} fewer draw calls per redraw)")


def main():
    for name, entries in GROUPS.items():
        pack_group(name, entries)


if __name__ == "__main__":
    main()
