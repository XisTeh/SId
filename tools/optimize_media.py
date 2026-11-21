#!/usr/bin/env python3
"""Create web-sized WebP images and high-quality WebM clips without touching originals."""

from __future__ import annotations

import argparse
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image, ImageOps
from optimize_display_images import save_variant


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=Path("../Sidney e Raabe"))
    parser.add_argument("--output", type=Path, default=Path("assets/images/media"))
    parser.add_argument("--ffmpeg", default="ffmpeg", help="FFmpeg executable or path")
    parser.add_argument("--max-image-side", type=int, default=8000)
    parser.add_argument("--quality", type=int, default=95)
    parser.add_argument("--crf", type=int, default=30)
    parser.add_argument("--cpu-used", type=int, default=4)
    parser.add_argument("--target-percent", type=float, default=0.90, help="Target total media bitrate as a fraction of each source's average bitrate")
    parser.add_argument("--audio-bitrate-kbps", type=int, default=96)
    parser.add_argument("--skip-video-encode", action="store_true", help="Reuse existing WebM files and regenerate only their stills")
    args = parser.parse_args()

    project = Path.cwd()
    source = (project / args.input).resolve()
    output = (project / args.output).resolve()
    output.mkdir(parents=True, exist_ok=True)
    if not source.is_dir():
        raise SystemExit(f"Media source folder not found: {source}")

    image_files = sorted(p for p in source.iterdir() if p.suffix.lower() in {".jpg", ".jpeg", ".png"})
    video_files = sorted(source.glob("*.mp4"))
    records: list[dict[str, object]] = []

    for path in image_files:
        target = output / f"{path.stem}.webp"
        with Image.open(path) as original:
            image = ImageOps.exif_transpose(original).convert("RGB")
            source_size = image.size
            image.thumbnail((args.max_image_side, args.max_image_side), Image.Resampling.LANCZOS)
            save_options: dict[str, object] = {
                "format": "WEBP",
                "quality": args.quality,
                "method": 6,
            }
            if original.info.get("icc_profile"):
                save_options["icc_profile"] = original.info["icc_profile"]
            image.save(target, **save_options)
        gallery_variant = output / f"{path.stem}-gallery-520.webp"
        save_variant(target, gallery_variant, 520, 90)
        if path.stem == "AGN00774-Editar":
            save_variant(target, output / f"{path.stem}-feature-760.webp", 760, 90)
        records.append({
            "kind": "photo",
            "source": path.name,
            "output": target.name,
            "source_bytes": path.stat().st_size,
            "output_bytes": target.stat().st_size,
            "source_pixels": list(source_size),
            "output_pixels": list(Image.open(target).size),
            "encoding": f"WebP quality {args.quality}, max side {args.max_image_side}px",
        })
        print(f"PHOTO {path.name} -> {target.name} ({target.stat().st_size / 1_000_000:.2f} MB)", flush=True)

    for index, path in enumerate(video_files, start=1):
        stem = f"forro-clip-{index:02d}"
        target = output / f"{stem}.webm"
        poster = output / f"{stem}-poster.webp"
        thumbnail = output / f"{stem}-thumbnail.webp"
        print(f"ENCODING video {index}/{len(video_files)}: {path.name[:22]}…", flush=True)

        duration_result = subprocess.run(
            [args.ffmpeg, "-hide_banner", "-i", str(path)],
            capture_output=True,
            text=True,
        )
        import re
        duration_match = re.search(r"Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)", duration_result.stderr)
        duration = 1.0
        if duration_match:
            hours, minutes, seconds = duration_match.groups()
            duration = int(hours) * 3600 + int(minutes) * 60 + float(seconds)
        total_source_bitrate = path.stat().st_size * 8 / max(duration, 1)
        target_video_bitrate = max(
            450_000,
            int(total_source_bitrate * args.target_percent - args.audio_bitrate_kbps * 1000),
        )
        max_video_bitrate = int(target_video_bitrate * 1.25)

        command = [
            args.ffmpeg,
            "-hide_banner", "-loglevel", "warning", "-stats", "-y",
            "-i", str(path),
            "-map", "0:v:0", "-map", "0:a?",
            "-map_metadata", "0",
            "-c:v", "libvpx-vp9",
            "-crf", str(args.crf), "-b:v", str(target_video_bitrate),
            "-maxrate", str(max_video_bitrate), "-bufsize", str(max_video_bitrate * 2),
            "-row-mt", "1", "-deadline", "good", "-cpu-used", str(args.cpu_used),
            "-pix_fmt", "yuv420p",
            "-c:a", "libopus", "-b:a", f"{args.audio_bitrate_kbps}k",
            "-f", "webm", str(target),
        ]
        if args.skip_video_encode:
            if not target.is_file():
                raise SystemExit(f"Cannot skip encoding; WebM output is missing: {target}")
        else:
            subprocess.run(command, check=True)

        # A representative still gives the browser an immediate frame without downloading the clip.
        poster_filter = f"scale='min(1000,iw)':-2"
        for still_path, position in ((poster, 0.4), (thumbnail, 0.15)):
            subprocess.run([
                args.ffmpeg,
                "-hide_banner", "-loglevel", "error", "-y",
                "-ss", f"{duration * position:.3f}", "-i", str(path),
                "-frames:v", "1", "-vf", poster_filter,
                "-c:v", "libwebp", "-quality", "92", "-compression_level", "6",
                str(still_path),
            ], check=True)
        save_variant(poster, output / f"{stem}-poster-520.webp", 520, 90)

        records.append({
            "kind": "video",
            "source": path.name,
            "output": target.name,
            "poster": poster.name,
            "thumbnail": thumbnail.name,
            "duration_seconds": round(duration, 3),
            "source_bytes": path.stat().st_size,
            "output_bytes": target.stat().st_size,
            "poster_bytes": poster.stat().st_size,
            "video_encoding": f"VP9 CRF {args.crf}, target {args.target_percent:.0%} of source average bitrate, maxrate 125% of target",
            "audio_encoding": f"Opus {args.audio_bitrate_kbps} kb/s; all source audio streams retained when present",
        })
        print(f"VIDEO {path.name[:22]}… -> {target.name} ({target.stat().st_size / 1_000_000:.2f} MB)", flush=True)

    total_source = sum(int(row["source_bytes"]) for row in records)
    total_output = sum(int(row["output_bytes"]) for row in records)
    report = {
        "created_at": datetime.now(timezone.utc).isoformat(),
        "source_folder": str(source),
        "output_folder": str(output),
        "originals_preserved": True,
        "photos": {"count": len(image_files), "quality": args.quality, "max_side_px": args.max_image_side},
        "videos": {"count": len(video_files), "codec": "VP9 + Opus", "crf": args.crf, "target_percent": args.target_percent, "audio_bitrate_kbps": args.audio_bitrate_kbps},
        "source_media_bytes": total_source,
        "converted_primary_media_bytes": total_output,
        "reduction_percent": round((1 - total_output / total_source) * 100, 2) if total_source else 0,
        "files": records,
    }
    report_path = output / "conversion-report.json"
    report_path.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"DONE {len(records)} media files · {total_source / 1_000_000:.1f} MB -> {total_output / 1_000_000:.1f} MB · {report['reduction_percent']}% smaller", flush=True)
    print(f"REPORT {report_path}", flush=True)


if __name__ == "__main__":
    main()
