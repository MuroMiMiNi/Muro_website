# Muro Example E

This repository contains the current personal portfolio site for the `codex/example-e` branch.

## Develop and verify

```powershell
npm run dev
npm test
npm run build
```

- `npm run dev` starts a local preview at `http://127.0.0.1:5505`.
- `npm test` checks the artwork catalog and timeline rules.
- `npm run build` refreshes the artwork catalogs and produces the deployable `dist/` directory.

## Main locations

- `index.html` — site entry point.
- `scripts/example-e.js` — homepage and dialog behavior.
- `scripts/data/siteData.js` — profile, commission, and social-link copy.
- `assets/all-artworks/` — categorized artwork shown on the hanging mobile and in the all-works dialog; the sync GitHub Action refreshes the catalog on push, or run `npm run sync` locally.
- `styles/` — styles loaded by the current site.

`scripts/data/all-artwork-catalog.json` is a generated file and should not be edited manually.
