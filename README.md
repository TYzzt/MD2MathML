# MD2MathML

MD2MathML turns Markdown from ChatGPT, Claude, Gemini, Obsidian, or a local file into a Word document with native, editable equations.

Live app: https://md2mathml.uuuu.site/

## Product workflow

1. Paste or upload Markdown.
2. Review the rendered document and MathML equations.
3. Click a formula to copy MathML, or download the whole document as DOCX.
4. Open the DOCX in Microsoft Word and edit equations as native Office Math objects.

The app is free, requires no account, stores drafts only in browser local storage, and does not send document content to analytics.

## Architecture

- `src/`: React/Vite editor, Markdown preview, MathML copy, anonymous funnel events, and DOCX download.
- `functions/api/convert.js`: same-origin Cloudflare Pages Function that streams conversion requests to the backend without reading document content.
- `services/docx-converter/`: recovered and reproducible FastAPI/Pandoc service deployed on Fly.io.
- `tests/`: browser-side regression fixtures and unit tests.
- `scripts/verify-export.mjs`: production integration check that verifies DOCX equations, tables, footnotes, and embedded media.

Cloudflare Pages deploys the frontend and Pages Function from GitHub. The backend converts Markdown with Pandoc and returns DOCX. The Pages Function can use a `DOCX_EXPORT_URL` runtime variable to switch upstreams without rebuilding the frontend.

## Local development

```powershell
npm install
npm run dev
```

Vite proxies `/api/convert` to the production converter so local browser testing follows the same-origin production workflow.

## Verification

```powershell
npm run check
npm run test:export

cd services/docx-converter
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements-dev.txt
.venv\Scripts\python -m pytest
```

`npm run check` runs lint, 16 unit tests, and the production build. `npm run test:export` calls the deployed converter and inspects the returned DOCX archive for native Office Math, a Word table, footnotes, and embedded media.

## Deployment

Pushing the repository to GitHub triggers the configured Cloudflare Pages deployment.

Deploy the converter from its directory:

```powershell
cd services/docx-converter
flyctl deploy --remote-only
```

No Cloudflare or Fly credentials belong in this repository. Store runtime values in the provider dashboard or encrypted secret store.
