#!/usr/bin/env python3
from pathlib import Path
import re
import os

ROOT = Path(__file__).resolve().parent.parent
PICS = ROOT / 'pics'

# Mapping of regex patterns to replacement names (applied to filename only)
REPLACEMENTS = [
    (re.compile(r"ambilance", re.IGNORECASE), 'ambulance'),
    (re.compile(r"montfofli[eè]re", re.IGNORECASE), 'montgolfière'),
    (re.compile(r"ébébiste", re.IGNORECASE), 'ébéniste'),
    (re.compile(r"panier\s+vareur", re.IGNORECASE), 'panier vapeur'),
    (re.compile(r"sésame\s+noire", re.IGNORECASE), 'sésame noir'),
    (re.compile(r"\bpoits\b", re.IGNORECASE), 'pois'),
    (re.compile(r"plat\s+car[eé]", re.IGNORECASE), 'plat carré'),
    (re.compile(r"\b(le)\s+cour(\.png)?$", re.IGNORECASE), r"\1 cœur\2"),
]

renames = []
for p in PICS.rglob('*'):
    if p.is_file():
        name = p.name
        new_name = name
        for pattern, repl in REPLACEMENTS:
            if pattern.search(new_name):
                new_name = pattern.sub(repl, new_name)
        if new_name != name:
            src = p
            dst = p.with_name(new_name)
            # Avoid overwrite
            if dst.exists():
                print(f"Skipping rename because target exists: {dst}")
            else:
                print(f"Will rename: {src} -> {dst}")
                renames.append((src, dst))

# Apply renames
for src, dst in renames:
    os.rename(src, dst)

print(f"Renamed {len(renames)} files")
