#!/usr/bin/env python3
from pathlib import Path
import unicodedata
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent
PICS_DIR = ROOT / 'pics'
CATEGORIES_FILE = ROOT / 'categories.js'

EXTS = {'.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'}

def slugify(s: str) -> str:
    s = unicodedata.normalize('NFKD', s)
    s = ''.join(c for c in s if not unicodedata.combining(c))
    s = s.lower()
    s = re.sub(r'[^a-z0-9]+', '_', s)
    s = re.sub(r'^_|_$', '', s)
    return s or 'category'

def read_existing() -> str:
    try:
        return CATEGORIES_FILE.read_text(encoding='utf8')
    except FileNotFoundError:
        return ''

def list_folders():
    if not PICS_DIR.exists():
        return []
    return [p.name for p in PICS_DIR.iterdir() if p.is_dir()]

def list_images(folder_path: Path):
    if not folder_path.exists():
        return []
    images = [p.name for p in folder_path.iterdir() if p.is_file() and p.suffix.lower() in EXTS]
    return sorted(images, key=lambda s: s.lower())

def build_folder_map():
    mapping = {}
    for folder in list_folders():
        imgs = list_images(PICS_DIR / folder)
        if imgs:
            # use POSIX-style paths inside JS
            paths = [f"pics/{folder}/{img}" for img in imgs]
            mapping[folder] = paths
    return mapping

def extract_existing_keys(content: str):
    return re.findall(r'([A-Za-z0-9_]+)\s*:\s*\[', content)

def generate_categories_object(folder_map: dict, existing_content: str):
    existing_keys = extract_existing_keys(existing_content)
    used = set()
    result = {}

    for folder in sorted(folder_map.keys()):
        matched_key = None
        # try to find an existing key that mentions this folder
        for key in existing_keys:
            pattern = re.compile(key + r"\s*:\s*\[([\s\S]*?)\]", re.M)
            m = pattern.search(existing_content)
            if m and f"pics/{folder}/" in m.group(1):
                matched_key = key
                break

        if not matched_key:
            base = slugify(folder)
            candidate = base
            i = 1
            while candidate in used or candidate in existing_keys:
                candidate = f"{base}_{i}"
                i += 1
            matched_key = candidate

        used.add(matched_key)

        # Sort entries ignoring leading French articles (le, la, l', les, un, une)
        def sort_key(path_str: str):
            # get filename without extension
            name = Path(path_str).stem
            # remove leading articles (with optional space/apostrophe)
            name = re.sub(r"^(?:le|la|l'|les|un|une)\s*", '', name, flags=re.IGNORECASE)
            # normalize accents for consistent ordering
            name = unicodedata.normalize('NFKD', name)
            name = ''.join(c for c in name if not unicodedata.combining(c))
            return name.lower()

        result[matched_key] = sorted(folder_map[folder], key=sort_key)

    return result

def format_categories(obj: dict) -> str:
    lines = []
    lines.append('const CATEGORIES = {')
    for key in sorted(obj.keys()):
        lines.append(f'  {key}: [')
        for p in obj[key]:
            lines.append(f'    "{p}",')
        lines.append('  ],')
    lines.append('};')
    lines.append('')
    return '\n'.join(lines)

def try_git_commit():
    try:
        subprocess.run(['git', 'config', 'user.name', 'github-actions[bot]'], check=True)
        subprocess.run(['git', 'config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com'], check=True)
        subprocess.run(['git', 'add', str(CATEGORIES_FILE)], check=True)
        subprocess.run(['git', 'commit', '-m', 'chore: update categories.js from pics/ (CI)'], check=True)
        subprocess.run(['git', 'push'], check=True)
        print('Committed and pushed changes')
    except Exception as e:
        print('Git commit/push failed:', e)

def main():
    folder_map = build_folder_map()
    existing = read_existing()
    new_obj = generate_categories_object(folder_map, existing)
    new_content = format_categories(new_obj)

    if existing.strip() == new_content.strip():
        print('No changes to categories.js')
        return 0

    CATEGORIES_FILE.write_text(new_content, encoding='utf8')
    print('Updated categories.js')
    # try to commit (CI will have credentials)
    try_git_commit()
    return 0

if __name__ == '__main__':
    sys.exit(main())
