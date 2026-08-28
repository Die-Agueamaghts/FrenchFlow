# Skill: Update category data from pics/

Zweck

- Beschreibt, wie die automatische Aktualisierung der Dateien unter `data/` stattfinden soll,
  wenn neue Bilder im Ordner `pics/` hinzugefügt, gelöscht oder verschoben werden.

Trigger

- Änderungen in `pics/**` (neue Dateien, gelöschte Dateien, verschobene Dateien oder neue Unterordner).

Verhalten der KI / des Skripts

- Scanne `pics/` rekursiv nur eine Ebene tiefer (nur unmittelbare Unterordner von `pics/`).
- Für jeden Unterordner:
  - Liste alle Bilddateien mit Endungen: `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.svg`.
  - Sortiere die Dateinamen alphabetisch (case-insensitive), wobei führende französische
    Artikel (`le`, `la`, `l'`, `les`, `un`, `une`) beim Sortieren ignoriert werden.
  - Erzeuge POSIX-Pfade im Format `pics/<Ordner>/<Dateiname>` für die Einträge in der passenden Kategoriedatei.

- Mapping Ordner → Datei:
  - Verwende französische Dateinamen wie `fruits.js`, `legumes.js` oder
    `herbes-aromatiques.js`.
  - Jede Datei unter `data/` registriert genau eine Liste in `window.CATEGORIES`.

- Aktualisierung der Kategorie-Dateien:
  - Erzeuge oder aktualisiere genau eine Datei pro direktem Unterordner von `pics/`.
  - Jeder Array-Eintrag muss doppelt-quoted sein, ein Komma nach jedem Eintrag.
  - Sortiere die Keys alphabetisch im Dateioutput.

Commit / CI

- Der Updater soll alle aktualisierten Dateien unter `data/` sowie alle geänderten Dateien
  unter `pics/` (neue Bilder, gelöschte Bilder, verschobene Dateien) zum Commit aufnehmen,
  sodass die resultierende Änderung die tatsächlichen Bild-Änderungen enthält.
- In CI soll die Workflow-Logik einen Branch erstellen und einen Pull Request öffnen (statt direkt
  nach `main` zu pushen). Das Updater-Skript erzeugt nur die Dateien; das Committen und die PR-Erstellung
  übernimmt der Workflow.
- Commit-Message: `chore: update category data from pics/ (CI)`.
- Die Workflow-Konfiguration muss `actions/checkout` mit `persist-credentials: true` ausführen
  und `GITHUB_TOKEN` zur Verfügung stellen, damit Branch- und PR-Erstellung möglich sind.

Beispiele (Erwartet)

- Ordner `pics/les fruits/` → Datei `data/fruits.js`,
  Einträge: `pics/les fruits/la pomme.png`, `pics/les fruits/la poire.png`, ... (alphabetisch)

Fehlerbehandlung & Hinweise

- Wenn `pics/` nicht existiert, tue nichts.
- Das Skript darf keine anderen Dateien außerhalb von `FrenchFlow/` verändern.
- Bei lokalen Tests soll das Commiten optional sein (nur in CI automatisch).

Zusätzliche Hinweise

- Die Automation sollte nur Änderungen unter `pics/` und die aktualisierten Dateien unter `data/` committen.
- Die KI/Automation liefert standardmäßig nur den PR-Link zurück; automatische Label-Erstellung wird
  nicht versucht (Repository-Besitzer kann Labels manuell setzen).

Ort

- Dateien: `FrenchFlow/data/*.js`
- Updater-Skript(en): `.github/scripts/update_categories.py` (Python) — bevorzugt

Wenn du Änderungen an diesem Verhalten willst, aktualisiere diese `skill.md` entsprechend.
