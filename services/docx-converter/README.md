# MD2MathML DOCX converter

FastAPI service that converts uploaded Markdown into DOCX with Pandoc. Equations are emitted as native Office Math (OMML), so they remain editable in Microsoft Word.

## API

- `GET /healthz`: readiness check.
- `POST /convert`: multipart upload with a `.md` or `.markdown` `file` field.
- `POST /convert?template=acm`: applies the bundled ACM reference document.

Uploads are limited to 8 MiB and Pandoc runs are limited to 45 seconds. The service never logs or persists document content; temporary files are deleted after the response.

## Local development

```powershell
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements-dev.txt
.venv\Scripts\python -m pytest
.venv\Scripts\python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

## Deploy

Run from this directory:

```powershell
flyctl deploy
```

The Fly application name is defined in `fly.toml`. The Cloudflare Pages Function in the repository proxies same-origin `/api/convert` requests to this service.
