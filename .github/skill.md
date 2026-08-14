# Skill: Update categories.js from pics/

Zweck
- Beschreibt, wie die automatische Aktualisierung von `categories.js` stattfinden soll,
  wenn neue Bilder im Ordner `pics/` hinzugefügt werden.

Trigger
- Änderungen in `pics/**` (neue Dateien oder neue Unterordner).

Verhalten der KI / des Skripts
- Scanne `pics/` rekursiv nur eine Ebene tiefer (nur unmittelbare Unterordner von `pics/`).
- Für jeden Unterordner:
  - Liste alle Bilddateien mit Endungen: `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.svg`.
  - Sortiere die Dateinamen alphabetisch (case-insensitive).
  - Erzeuge POSIX-Pfade im Format `pics/<Ordner>/<Dateiname>` für die Einträge in `categories.js`.

- Mapping Ordner → Schlüssel in `CATEGORIES`:
  - Falls ein bestehender Key in `categories.js` bereits Pfade aus dem Ordner enthält,
    behalte den bestehenden Key ( erweitere ihn ).
  - Ansonsten generiere einen Key durch "slugify" des Ordnernamens:
    - Unicode normalisieren (NFKD), diakritische Zeichen entfernen,
    - in Kleinbuchstaben umwandeln,
    - Nicht-alphanumerische Zeichen durch `_` ersetzen,
    - führende/trailende `_` entfernen.
  - Bei Schlüsselkonflikten hänge `_1`, `_2`, ... an.

- Aktualisierung von `categories.js`:
  - Ersetze die `CATEGORIES`-Definition vollständig durch die neu erstellte Objektstruktur.
  - Jeder Array-Eintrag muss doppelt-quoted sein, ein Komma nach jedem Eintrag.
  - Sortiere die Keys alphabetisch im Dateioutput.

- Commit / CI:
  - In CI (GitHub Actions) darf das Skript versuchen zu committen und zu pushen.
  - Commit-Message: `chore: update categories.js from pics/ (CI)`
  - Workflow muss `actions/checkout` mit `persist-credentials: true` nutzen und
    `GITHUB_TOKEN` verfügbar machen.

Beispiele (Erwartet)
- Ordner `pics/les fruits/` → Key `les_fruits` (oder passende vorhandene Key-Zuordnung),
  Einträge: `pics/les fruits/la pomme.png`, `pics/les fruits/la poire.png`, ... (alphabetisch)

Fehlerbehandlung & Hinweise
- Wenn `pics/` nicht existiert, tue nichts.
- Das Skript darf keine anderen Dateien außerhalb von `FrenchFlow/` verändern.
- Bei lokalen Tests soll das Commiten optional sein (nur in CI automatisch).

Ort
- Datei: `FrenchFlow/categories.js`
- Updater-Skript(en): `FrenchFlow/scripts/update_categories.py` (Python) — bevorzugt

Wenn du Änderungen an diesem Verhalten willst, aktualisiere diese `skill.md` entsprechend.
