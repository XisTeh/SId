#!/usr/bin/env python3
"""Create lightweight display images while preserving the full-resolution WebP originals."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageOps


def save_variant(source: Path, target: Path, max_side: int, quality: int) -> None:
    with Image.open(source) as original:
        image = ImageOps.exif_transpose(original).convert("RGB")
        image.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)
        image.save(target, "WEBP", quality=quality, method=6)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--media", type=Path, default=Path("assets/images/media"))
    parser.add_argument("--gallery-side", type=int, default=520)
    parser.add_argument("--quality", type=int, default=90)
    parser.add_argument("--feature-name", default="AGN00774-Editar")
    parser.add_argument("--feature-side", type=int, default=760)
    parser.add_argument("--card-art-side", type=int, default=260)
    args = parser.parse_args()

    media = args.media.resolve()
    photos = sorted(media.glob("AGN*.webp"))
    photos = [path for path in photos if not any(tag in path.stem for tag in ("-gallery", "-poster", "-thumbnail", "-feature"))]
    if not photos:
        raise SystemExit(f"No original AGN WebP photos found in {media}")

    total_after = 0
    for source in photos:
        gallery = source.with_name(f"{source.stem}-gallery-520.webp")
        save_variant(source, gallery, args.gallery_side, args.quality)
        total_after += gallery.stat().st_size
        print(f"GALLERY {gallery.name} · {gallery.stat().st_size / 1024:.0f} KiB")
        if source.stem in {"AGN00867-Editar", "AGN00850-Editar", "AGN00948-Editar"}:
            art = source.with_name(f"{source.stem}-art-260.webp")
            save_variant(source, art, args.card_art_side, args.quality)
            total_after += art.stat().st_size

        if source.stem == args.feature_name:
            feature = source.with_name(f"{source.stem}-feature-760.webp")
            save_variant(source, feature, args.feature_side, args.quality)
            total_after += feature.stat().st_size
            print(f"FEATURE {feature.name} · {feature.stat().st_size / 1024:.0f} KiB")

    for source in sorted(media.glob("forro-clip-*-poster.webp")):
        poster = source.with_name(f"{source.stem}-520.webp")
        save_variant(source, poster, args.gallery_side, args.quality)
        total_after += poster.stat().st_size
        print(f"POSTER {poster.name} · {poster.stat().st_size / 1024:.0f} KiB")

    print(f"DONE {len(photos)} photos · gallery variants total {total_after / 1024:.0f} KiB")


if __name__ == "__main__":
    main()
