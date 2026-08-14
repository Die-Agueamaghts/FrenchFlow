# FrenchFlow
An interactive web-based French vocabulary trainer designed for effective daily language practice and active recall.

## Bilder hinzufügen & Automatische Kategorie-Aktualisierung

Wenn du neue Bilder in `pics/` legst, gibt es zwei Wege, sie in die Web-App zu integrieren:

- Lokal (manuell):
	1. Lege die Bilddateien in `FrenchFlow/pics/<Kategorie-Ordner>/` (z. B. `pics/les fruits/`).
	2. Unterstützte Endungen: `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.svg`.
	3. Lokal ausführen:

```powershell
cd C:\workspace\scripts\html\FrenchFlow
python scripts/update_categories.py
```

	- Das Skript schreibt `FrenchFlow/categories.js` neu (alphabetisch sortiert).
	- Um das Skript automatisch committen und pushen zu lassen, setze die Umgebungsvariable `DO_GIT=1` (nur lokal, wenn du pushen willst):

```powershell
setx DO_GIT 1
python scripts/update_categories.py
```

- Über CI (empfohlen, automatisiert):
	1. Push die neuen Bilder in den Repo-Ordner `pics/` und erzeuge einen Commit.
	2. Der GitHub-Workflow `FrenchFlow/.github/workflows/update-categories.yml` wird ausgelöst.
	3. Das Workflow-Skript erzeugt `categories.js` und erstellt anstelle eines direkten Pushes einen neuen Branch `update/categories-<run_id>` und öffnet einen Pull Request zur `main`-Branch.

Hinweise zur Dateibenennung
- Dateinamen werden als Lösungen angezeigt (Dateiname ohne Endung). Vermeide Steuerzeichen und behalte Umlaute/diakritische Zeichen bei; das Skript normalisiert beim Sortieren.
- Beim Sortieren werden führende französische Artikel (`le`, `la`, `l'`, `les`, `un`, `une`) ignoriert, sodass z. B. `la pomme.png` unter `pomme` einsortiert wird.

KI-Prompt (Beispiel)
Wenn du eine KI verwenden möchtest, um Änderungen in `pics/` automatisch in `categories.js` einzutragen, kannst du diesen Prompt verwenden. Er beschreibt genau, was erwartet wird:

"Du bist ein Repository-Wartungsassistent. Scanne das Verzeichnis `pics/` (nur die direkten Unterordner). Für jeden Unterordner erzeugst du einen Key im JavaScript-Objekt `CATEGORIES` und fügst alle Bildpfade im Format `pics/<Ordner>/<Dateiname>` dem dazugehörigen Array hinzu. Sortiere die Dateinamen alphabetisch (case-insensitive) und ignoriere beim Sortiervergleich führende französische Artikel: `le`, `la`, `l'`, `les`, `un`, `une`. Wenn ein Key bereits in `categories.js` existiert und Pfade aus diesem Ordner enthält, erweitere diesen Key stattdessen. Gib am Ende die vollständige Datei `categories.js` aus, die genau eine `const CATEGORIES = { ... };`-Definition enthält."

Was du nach dem PR tun solltest
- Prüfe den automatisch erstellten Pull Request, kontrolliere die neuen/verschobenen Bildpfade und merge den PR in `main`.
- Die Seite nutzt `categories.js` zur Laufzeit und befüllt das Kategorie-Dropdown automatisch, sodass nach Merge die neuen Bilder in der Web-App verfügbar sind.

Fragen? Sag mir, ob du ein anderes Sortier- oder Mapping-Verhalten bevorzugst (z. B. deutschsprachige Labels, andere Article-Handling-Regeln).

