# Mitsubishi WOW! Kampagnenseite

Responsive Standalone-Kampagnenseite mit HTML, CSS und JavaScript. Die Seite benötigt keinen Build-Schritt.

## Live

https://danielmobilityminds.github.io/wow-test/

## Lokal starten

Im Projektordner einen lokalen Webserver starten, zum Beispiel:

```powershell
python -m http.server 4173
```

Danach `http://localhost:4173/` im Browser öffnen.

## Struktur

- `index.html` – Inhalt und Seitenstruktur
- `mobile-first.css` – responsives Layout und Gestaltung
- `script.js` – Navigation, Interaktionen und Animationen
- `assets/` – Bilder, Logo und Schriften
- `data/campaign-content.json` – strukturierte Kampagnendaten

## Tagging

Die Seite nutzt das Mitsubishi-Muster `data-page` und `data-ga4push`. Beim Laden und bei markierten Klicks werden strukturierte Objekte in `window.dataLayer` geschrieben. Erfasst werden Seitenaufruf, Desktop-, Mobile- und Kampagnennavigation sowie Angebots-, Probefahrt- und Inhalts-CTAs.

Die Instrumentierung selbst überträgt keine Daten. Ein Consentmanager und ein GTM-Container werden erst nach Freigabe für die spätere Produktionsdomain ergänzt. Für lokale QA steht `window.wowTracking.push({...})` zur Verfügung; außerdem wird nach jedem Push das DOM-Event `wow:tracking` ausgelöst.
