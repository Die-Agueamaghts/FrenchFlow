# FrenchFlow

An interactive web-based French vocabulary trainer designed for effective daily language practice and active recall.

## Bilder hinzufügen & Automatische Kategorie-Aktualisierung

Wenn du neue Bilder in `pics/` legst, gibt es zwei Wege, sie in die Web-App zu integrieren:

- Lokal (manuell):
  1.  Lege die Bilddateien in `FrenchFlow/pics/<Kategorie-Ordner>/` (z. B. `pics/les fruits/`).
  2.  Unterstützte Endungen: `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.svg`.
  3.  Lokal ausführen:

```powershell
cd C:\workspace\scripts\html\FrenchFlow
python .github/scripts/update_categories.py
```

    - Das Skript schreibt die einzelnen Dateien unter `FrenchFlow/data/` neu (alphabetisch sortiert).
    - Um das Skript automatisch committen und pushen zu lassen, setze die Umgebungsvariable `DO_GIT=1` (nur lokal, wenn du pushen willst):

```powershell
setx DO_GIT 1
python .github/scripts/update_categories.py
```

- Über CI (empfohlen, automatisiert):
  1.  Push die neuen Bilder in den Repo-Ordner `pics/` und erzeuge einen Commit.
  2.  Der GitHub-Workflow `.github/workflows/update-categories.yml` wird ausgelöst.
  3.  Das Workflow-Skript erzeugt die Dateien unter `data/` und erstellt einen neuen Branch `update/categories-<run_id>` mit Pull Request zur `main`-Branch.

Hinweise zur Dateibenennung

- Dateinamen werden als Lösungen angezeigt (Dateiname ohne Endung). Vermeide Steuerzeichen und behalte Umlaute/diakritische Zeichen bei; das Skript normalisiert beim Sortieren.
- Beim Sortieren werden führende französische Artikel (`le`, `la`, `l'`, `les`, `un`, `une`) ignoriert, sodass z. B. `la pomme.png` unter `pomme` einsortiert wird.

KI-Prompt (Beispiel)
Wenn du eine KI verwenden möchtest, um Änderungen in `pics/` automatisch in die Dateien unter `data/` einzutragen, kannst du diesen Prompt verwenden. Er beschreibt genau, was erwartet wird:

"Du bist ein Repository-Wartungsassistent. Scanne `pics/` (nur die direkten Unterordner). Erzeuge für jeden Unterordner eine französisch benannte Datei unter `data/`, die genau eine Liste in `window.CATEGORIES` registriert und alle Bildpfade im Format `pics/<Ordner>/<Dateiname>` enthält. Sortiere die Dateinamen alphabetisch und ignoriere dabei führende französische Artikel: `le`, `la`, `l'`, `les`, `un`, `une`."

Was du nach dem PR tun solltest

- Prüfe den automatisch erstellten Pull Request, kontrolliere die neuen/verschobenen Bildpfade und merge den PR in `main`.
- Die Seite lädt die Dateien unter `data/` und befüllt das Kategorie-Dropdown automatisch.

Fragen? Sag mir, ob du ein anderes Sortier- oder Mapping-Verhalten bevorzugst (z. B. deutschsprachige Labels, andere Article-Handling-Regeln).
