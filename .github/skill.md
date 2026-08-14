# Skill: Update categories.js from pics/

Zweck
- Beschreibt, wie die automatische Aktualisierung von `categories.js` stattfinden soll,
  wenn neue Bilder im Ordner `pics/` hinzugefügt, gelöscht oder verschoben werden.

Trigger
- Änderungen in `pics/**` (neue Dateien, gelöschte Dateien, verschobene Dateien oder neue Unterordner).

Verhalten der KI / des Skripts
- Scanne `pics/` rekursiv nur eine Ebene tiefer (nur unmittelbare Unterordner von `pics/`).
- Für jeden Unterordner:
  - Liste alle Bilddateien mit Endungen: `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.svg`.
  - Sortiere die Dateinamen alphabetisch (case-insensitive), wobei führende französische
    Artikel (`le`, `la`, `l'`, `les`, `un`, `une`) beim Sortieren ignoriert werden.
  - Erzeuge POSIX-Pfade im Format `pics/<Ordner>/<Dateiname>` für die Einträge in `categories.js`.

- Mapping Ordner → Schlüssel in `CATEGORIES`:
  - Falls ein bestehender Key in `categories.js` bereits Pfade aus dem Ordner enthält,
    behalte den bestehenden Key (erweitere ihn).
  - Ansonsten generiere einen Key durch "slugify" des Ordnernamens (NFKD, diakritische
    Zeichen entfernen, lowercase, Nicht-alphanumerische durch `_`, trim `_`).
  - Bei Schlüsselkonflikten hänge `_1`, `_2`, ... an.

- Aktualisierung von `categories.js`:
  - Ersetze die `CATEGORIES`-Definition vollständig durch die neu erstellte Objektstruktur.
  - Jeder Array-Eintrag muss doppelt-quoted sein, ein Komma nach jedem Eintrag.
  - Sortiere die Keys alphabetisch im Dateioutput.

Commit / CI
- Der Updater soll sowohl das regenerierte `categories.js` als auch alle geänderten Dateien
  unter `pics/` (neue Bilder, gelöschte Bilder, verschobene Dateien) zum Commit aufnehmen,
  sodass die resultierende Änderung die tatsächlichen Bild-Änderungen enthält.
- In CI soll die Workflow-Logik eine Branch erstellen und eine Pull Request öffnen (statt direkt
  nach `main` zu pushen). Das Updater-Skript selbst stage/commit/push in CI, aber die PR-Erstellung
  sollte durch den Workflow erfolgen.
- Commit-Message: `chore: update categories.js from pics/ (CI)`.
- Die Workflow-Konfiguration muss `actions/checkout` mit `persist-credentials: true` ausführen
  und `GITHUB_TOKEN` zur Verfügung stellen, damit Branch- und PR-Erstellung möglich sind.

Beispiele (Erwartet)
- Ordner `pics/les fruits/` → Key `les_fruits` (oder passende vorhandene Key-Zuordnung),
  Einträge: `pics/les fruits/la pomme.png`, `pics/les fruits/la poire.png`, ... (alphabetisch)

Fehlerbehandlung & Hinweise
- Wenn `pics/` nicht existiert, tue nichts.
- Das Skript darf keine anderen Dateien außerhalb von `FrenchFlow/` verändern.
- Bei lokalen Tests soll das Commiten optional sein (nur in CI automatisch).

Zusätzliche Hinweise
- Die Automation sollte nur Änderungen unter `pics/` und die aktualisierte `categories.js` committen.
- Die KI/Automation liefert standardmäßig nur den PR-Link zurück; automatische Label-Erstellung wird
  nicht versucht (Repository-Besitzer kann Labels manuell setzen).

Ort
- Datei: `FrenchFlow/categories.js`
- Updater-Skript(en): `FrenchFlow/scripts/update_categories.py` (Python) — bevorzugt

Wenn du Änderungen an diesem Verhalten willst, aktualisiere diese `skill.md` entsprechend.
