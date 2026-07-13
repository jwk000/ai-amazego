#!/usr/bin/env python3
import json
import subprocess
import tempfile
from collections import deque
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets/silhouettes/source-svg/filled"
OUTPUT = ROOT / "src/data/silhouette-boards.json"
PREVIEWS = ROOT / "assets/silhouettes/svg-previews"
DUPLICATES = ROOT / "assets/silhouettes/duplicate-silhouettes.json"


def largest_component(mask):
    h, w = len(mask), len(mask[0])
    seen, largest = set(), []
    for y in range(h):
        for x in range(w):
            if not mask[y][x] or (x, y) in seen:
                continue
            queue, component = deque([(x, y)]), []
            seen.add((x, y))
            while queue:
                px, py = queue.popleft()
                component.append((px, py))
                for nx, ny in ((px+1,py),(px-1,py),(px,py+1),(px,py-1)):
                    if 0 <= nx < w and 0 <= ny < h and mask[ny][nx] and (nx,ny) not in seen:
                        seen.add((nx,ny)); queue.append((nx,ny))
            if len(component) > len(largest): largest = component
    result = [[False] * w for _ in range(h)]
    for x, y in largest: result[y][x] = True
    return result


def fill_holes(mask):
    h, w = len(mask), len(mask[0])
    outside = [[False] * w for _ in range(h)]
    queue = deque()
    for x in range(w):
        for y in (0, h-1):
            if not mask[y][x] and not outside[y][x]: outside[y][x] = True; queue.append((x,y))
    for y in range(h):
        for x in (0, w-1):
            if not mask[y][x] and not outside[y][x]: outside[y][x] = True; queue.append((x,y))
    while queue:
        x, y = queue.popleft()
        for nx, ny in ((x+1,y),(x-1,y),(x,y+1),(x,y-1)):
            if 0 <= nx < w and 0 <= ny < h and not mask[ny][nx] and not outside[ny][nx]:
                outside[ny][nx] = True; queue.append((nx,ny))
    return [[mask[y][x] or not outside[y][x] for x in range(w)] for y in range(h)]


def bounds(mask):
    points = [(x,y) for y,row in enumerate(mask) for x,value in enumerate(row) if value]
    if not points: return None
    xs, ys = zip(*points)
    return min(xs), min(ys), max(xs), max(ys)


def rasterize(svg_path):
    with tempfile.NamedTemporaryFile(suffix=".png") as tmp:
        subprocess.run(["rsvg-convert", "-w", "1024", "-h", "1024", "-b", "white", "-o", tmp.name, str(svg_path)], check=True)
        image = Image.open(tmp.name).convert("L")
        return image.copy()


def image_mask(image):
    reduced = image.resize((144, 144), Image.Resampling.LANCZOS)
    values = list(reduced.get_flattened_data())
    return [[values[y * reduced.width + x] < 200 for x in range(reduced.width)] for y in range(reduced.height)]


def choose_grid(mask):
    box = bounds(mask)
    if not box: raise ValueError("empty silhouette")
    min_x, min_y, max_x, max_y = box
    ratio = (max_x - min_x + 1) / (max_y - min_y + 1)
    if ratio >= 1:
        width = 36
        height = max(28, min(52, round(36 / ratio)))
    else:
        height = 52
        width = max(28, min(36, round(52 * ratio)))
    return width, height, box


def sample(mask, width, height, box):
    min_x, min_y, max_x, max_y = box
    crop_w, crop_h = max_x-min_x+1, max_y-min_y+1
    inner_w, inner_h = width-2, height-2
    scale = min(inner_w/crop_w, inner_h/crop_h)
    draw_w, draw_h = crop_w*scale, crop_h*scale
    offset_x, offset_y = (width-draw_w)/2, (height-draw_h)/2
    grid = [[False]*width for _ in range(height)]
    for gy in range(height):
        for gx in range(width):
            sx = min_x + ((gx+0.5-offset_x)/scale)
            sy = min_y + ((gy+0.5-offset_y)/scale)
            radius = max(1, round(0.42/scale))
            hits = total = 0
            cx, cy = round(sx), round(sy)
            for py in range(cy-radius, cy+radius+1):
                for px in range(cx-radius, cx+radius+1):
                    if 0 <= py < len(mask) and 0 <= px < len(mask[0]):
                        hits += int(mask[py][px]); total += 1
            grid[gy][gx] = total > 0 and hits/total >= 0.38
    return fill_holes(largest_component(grid))


def rows(mask): return ["".join("1" if value else "0" for value in row) for row in mask]


def crop_mask(mask):
    box = bounds(mask)
    if not box: return [[False]]
    min_x, min_y, max_x, max_y = box
    return [row[min_x:max_x+1] for row in mask[min_y:max_y+1]]


def signature(mask):
    cropped = crop_mask(mask)
    source = Image.new("L", (len(cropped[0]), len(cropped)), 255)
    pixels = source.load()
    for y,row in enumerate(cropped):
        for x,value in enumerate(row):
            if value: pixels[x,y] = 0
    normalized = source.resize((48,48), Image.Resampling.NEAREST)
    values = list(normalized.get_flattened_data())
    direct = "".join("1" if value < 128 else "0" for value in values)
    mirrored = normalized.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    mirror_values = list(mirrored.get_flattened_data())
    mirror = "".join("1" if value < 128 else "0" for value in mirror_values)
    return min(direct, mirror)


def main():
    PREVIEWS.mkdir(parents=True, exist_ok=True)
    records = []
    signatures = {}
    duplicates = []
    for index, svg_path in enumerate(sorted(SOURCE.glob("*.svg")), start=1):
        image = rasterize(svg_path)
        mask = fill_holes(largest_component(image_mask(image)))
        width, height, box = choose_grid(mask)
        grid = sample(mask, width, height, box)
        grid_signature = signature(grid)
        if grid_signature in signatures:
            duplicates.append({"duplicate": svg_path.name, "kept": signatures[grid_signature]})
            continue
        signatures[grid_signature] = svg_path.name
        active = sum(sum(row) for row in grid)
        if active < 35:
            grid = sample(mask, min(36, width+2), min(52, height+2), box)
            height, width = len(grid), len(grid[0])
            active = sum(sum(row) for row in grid)
        preview = Image.new("L", (width*20, height*20), 255)
        pixels = preview.load()
        for y,row in enumerate(grid):
            for x,value in enumerate(row):
                if value:
                    for py in range(y*20,(y+1)*20):
                        for px in range(x*20,(x+1)*20): pixels[px,py]=0
        level_index = len(records) + 1
        preview.save(PREVIEWS / f"{level_index:04d}.png")
        records.append({
            "id": f"silhouette-{level_index:04d}", "name": f"关卡 {level_index}",
            "source": f"assets/silhouettes/source-svg/filled/{svg_path.name}", "width": width, "height": height,
            "rows": rows(grid), "activeCells": active,
        })
    OUTPUT.write_text(json.dumps(records, ensure_ascii=False, indent=2)+"\n")
    DUPLICATES.write_text(json.dumps(duplicates, ensure_ascii=False, indent=2)+"\n")
    print(json.dumps({"sourceCount": len(records)+len(duplicates), "uniqueCount": len(records), "duplicateCount": len(duplicates), "minCells": min(r["activeCells"] for r in records), "maxCells": max(r["activeCells"] for r in records)}))

if __name__ == "__main__": main()
