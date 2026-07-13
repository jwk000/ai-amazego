#!/usr/bin/env python3
import argparse
import json
from collections import deque
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

GRID_SIZES = [(14, 20), (16, 22), (18, 26), (20, 28)]


def largest_component(mask):
    height = len(mask)
    width = len(mask[0])
    seen = set()
    largest = []
    for y in range(height):
        for x in range(width):
            if not mask[y][x] or (x, y) in seen:
                continue
            queue = deque([(x, y)])
            seen.add((x, y))
            component = []
            while queue:
                px, py = queue.popleft()
                component.append((px, py))
                for nx, ny in ((px + 1, py), (px - 1, py), (px, py + 1), (px, py - 1)):
                    if 0 <= nx < width and 0 <= ny < height and mask[ny][nx] and (nx, ny) not in seen:
                        seen.add((nx, ny))
                        queue.append((nx, ny))
            if len(component) > len(largest):
                largest = component
    result = [[False] * width for _ in range(height)]
    for x, y in largest:
        result[y][x] = True
    return result


def fill_holes(mask):
    height = len(mask)
    width = len(mask[0])
    outside = [[False] * width for _ in range(height)]
    queue = deque()
    for x in range(width):
        for y in (0, height - 1):
            if not mask[y][x] and not outside[y][x]:
                outside[y][x] = True
                queue.append((x, y))
    for y in range(height):
        for x in (0, width - 1):
            if not mask[y][x] and not outside[y][x]:
                outside[y][x] = True
                queue.append((x, y))
    while queue:
        x, y = queue.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < width and 0 <= ny < height and not mask[ny][nx] and not outside[ny][nx]:
                outside[ny][nx] = True
                queue.append((nx, ny))
    return [[mask[y][x] or not outside[y][x] for x in range(width)] for y in range(height)]


def image_to_mask(image):
    gray = image.convert("L")
    histogram = gray.histogram()
    total = sum(histogram)
    mean = sum(index * count for index, count in enumerate(histogram)) / max(total, 1)
    threshold = min(210, max(70, int(mean * 0.72)))
    return [[gray.getpixel((x, y)) < threshold for x in range(gray.width)] for y in range(gray.height)]


def mask_bounds(mask):
    points = [(x, y) for y, row in enumerate(mask) for x, value in enumerate(row) if value]
    if not points:
        return None
    xs = [point[0] for point in points]
    ys = [point[1] for point in points]
    return min(xs), min(ys), max(xs), max(ys)


def normalize_image(mask, size=1024, margin=96):
    bounds = mask_bounds(mask)
    if not bounds:
        raise ValueError("empty silhouette")
    min_x, min_y, max_x, max_y = bounds
    source = Image.new("L", (len(mask[0]), len(mask)), 255)
    pixels = source.load()
    for y, row in enumerate(mask):
        for x, value in enumerate(row):
            if value:
                pixels[x, y] = 0
    crop = source.crop((min_x, min_y, max_x + 1, max_y + 1))
    available = size - margin * 2
    scale = min(available / crop.width, available / crop.height)
    resized = crop.resize((max(1, round(crop.width * scale)), max(1, round(crop.height * scale))), Image.Resampling.LANCZOS)
    canvas = Image.new("L", (size, size), 255)
    canvas.paste(resized, ((size - resized.width) // 2, (size - resized.height) // 2))
    return canvas.filter(ImageFilter.MedianFilter(3))


def sample_grid(image, width, height, threshold=0.44):
    source = image.convert("L")
    mask = []
    for gy in range(height):
        row = []
        y0 = round(gy * source.height / height)
        y1 = round((gy + 1) * source.height / height)
        for gx in range(width):
            x0 = round(gx * source.width / width)
            x1 = round((gx + 1) * source.width / width)
            region = source.crop((x0, y0, max(x0 + 1, x1), max(y0 + 1, y1)))
            black_ratio = 1 - sum(region.getdata()) / (255 * region.width * region.height)
            row.append(black_ratio >= threshold)
        mask.append(row)
    return fill_holes(largest_component(mask))


def mask_rows(mask):
    return ["".join("1" if value else "0" for value in row) for row in mask]


def count_components(mask):
    component = largest_component(mask)
    return 0 if not any(any(row) for row in mask) else int(sum(sum(row) for row in component) != 0)


def process_record(record, root):
    raw_path = root / record["output"]
    if not raw_path.exists():
        return {"id": record["id"], "status": "missing"}
    image = Image.open(raw_path).convert("RGB")
    cleaned_mask = fill_holes(largest_component(image_to_mask(image)))
    cleaned = normalize_image(cleaned_mask)
    processed_path = root / "assets/silhouettes/processed" / f'{record["id"]}.png'
    processed_path.parent.mkdir(parents=True, exist_ok=True)
    cleaned.save(processed_path)

    grids = []
    for width, height in GRID_SIZES:
        grid = sample_grid(cleaned, width, height)
        active = sum(sum(row) for row in grid)
        grid_data = {
            "id": record["id"], "width": width, "height": height,
            "rows": mask_rows(grid), "activeCells": active,
            "connectedComponents": count_components(grid), "holeCount": 0,
        }
        grid_path = root / "assets/silhouettes/grids" / f'{record["id"]}-{width}x{height}.json'
        grid_path.parent.mkdir(parents=True, exist_ok=True)
        grid_path.write_text(json.dumps(grid_data, ensure_ascii=False, indent=2) + "\n")
        grids.append(grid_data)

    black_pixels = sum(sum(row) for row in cleaned_mask)
    area_ratio = black_pixels / (len(cleaned_mask) * len(cleaned_mask[0]))
    return {"id": record["id"], "status": "processed", "areaRatio": area_ratio, "grids": grids}


def create_contact_sheet(records, root):
    available = [record for record in records if (root / "assets/silhouettes/processed" / f'{record["id"]}.png').exists()]
    if not available:
        return
    cell = 180
    columns = 5
    rows = (len(available) + columns - 1) // columns
    sheet = Image.new("RGB", (columns * cell, rows * (cell + 28)), "white")
    draw = ImageDraw.Draw(sheet)
    for index, record in enumerate(available):
        image = Image.open(root / "assets/silhouettes/processed" / f'{record["id"]}.png').convert("RGB").resize((cell, cell))
        x = (index % columns) * cell
        y = (index // columns) * (cell + 28)
        sheet.paste(image, (x, y))
        draw.text((x + 4, y + cell + 4), record["id"][:24], fill="black")
    report_path = root / "assets/silhouettes/reports/contact-sheet.png"
    report_path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(report_path)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--id")
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    records = json.loads((root / "assets/silhouettes/prompts.json").read_text())
    if args.id:
        records = [record for record in records if record["id"] == args.id]
    reports = [process_record(record, root) for record in records]
    report_path = root / "assets/silhouettes/reports/report.json"
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(reports, ensure_ascii=False, indent=2) + "\n")
    create_contact_sheet(records, root)
    processed = sum(report["status"] == "processed" for report in reports)
    print(json.dumps({"selected": len(reports), "processed": processed, "missing": len(reports) - processed}))


if __name__ == "__main__":
    main()
