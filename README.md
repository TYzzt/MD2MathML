# MD2MathML

MD2MathML turns Markdown from ChatGPT, Claude, Gemini, Obsidian, or a local file into a Word document with native, editable equations.

Live app: https://md2mathml.uuuu.site/

Browser extension:

- Edge: https://microsoftedge.microsoft.com/addons/detail/select2obsidian/foenpoepoknbjfiejgcjcnlkogaophen
- Chrome/Chromium ZIP: https://github.com/TYzzt/select2obsidian/releases/latest/download/select-to-note-browser-extension.zip
- Source: https://github.com/TYzzt/select2obsidian

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

The public conversion endpoint allows credential-free cross-origin POST requests so the Select to Word & Obsidian browser extension can request DOCX downloads. It does not allow cookies or authorization credentials.

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

`npm run check` runs lint, unit tests, and the production build. `npm run test:export` calls the deployed converter and inspects the returned DOCX archive for native Office Math, a Word table, footnotes, and embedded media.

## Deployment

### Frontend and landing page

The frontend is deployed from this repository by the Cloudflare Pages project `md2mathml`. Both public sites use the same production build:

- `https://uuuu.site/` renders the promotional landing page.
- `https://md2mathml.uuuu.site/` renders the Markdown converter.

`src/lib/site.js` selects the page from `window.location.hostname`; no separate landing-page deployment is required.

Configure the Cloudflare Pages project with:

| Setting | Value |
| --- | --- |
| Git repository | this repository |
| Production branch | `main` |
| Framework preset | Vite |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | repository root |

Add these custom domains to the `md2mathml` Pages project:

```text
uuuu.site
md2mathml.uuuu.site
```

For the apex domain, create a proxied DNS record in the `uuuu.site` zone:

```text
Type: CNAME
Name: @
Target: md2mathml.pages.dev
Proxy status: Proxied
```

Cloudflare applies CNAME flattening at the zone apex. Remove any Worker custom-domain binding for `uuuu.site` before adding the apex domain to Pages; otherwise the bindings conflict. Do not change the MX or TXT records used for email and domain verification.

Set `DOCX_EXPORT_URL` in the Pages project's production environment when the converter endpoint differs from the default. Secrets and provider credentials must stay in the Cloudflare dashboard or another encrypted secret store, never in this repository.

Before deploying, verify the production build locally:

```powershell
npm ci
npm run check
```

Push or merge the verified commit to `main`. The GitHub integration then creates the production Pages deployment automatically:

```powershell
git push origin main
```

After Cloudflare reports both custom domains as `active`, verify:

```powershell
curl.exe -I https://uuuu.site/
curl.exe -I https://md2mathml.uuuu.site/
```

The first URL must display the landing page, and every primary call to action must link to the second URL. The second URL must continue to display the converter.

### DOCX converter

Deploy the converter from its directory:

```powershell
cd services/docx-converter
flyctl deploy --remote-only
```

The converter's detailed prerequisites and environment configuration are documented in `services/docx-converter/README.md`.
