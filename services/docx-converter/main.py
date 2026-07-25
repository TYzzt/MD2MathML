import asyncio
import os
import shutil
import subprocess
import tempfile
import time
import uuid
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask

APP_DIR = Path(__file__).resolve().parent
ACM_TEMPLATE = APP_DIR / "acm_template.docx"
MAX_UPLOAD_BYTES = 8 * 1024 * 1024
PANDOC_TIMEOUT_SECONDS = 45

app = FastAPI(docs_url=None, redoc_url=None, title="MD2MathML DOCX converter")
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=os.getenv(
        "ALLOWED_ORIGIN_REGEX",
        r"https://([a-z0-9-]+\.)?(pages\.dev|uuuu\.site)",
    ),
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)


@app.get("/")
def read_root():
    return {"service": "md2mathml-docx-converter", "status": "ok"}


@app.get("/healthz")
def healthcheck():
    if not ACM_TEMPLATE.is_file():
        raise HTTPException(status_code=503, detail="Reference document is unavailable")
    return {"status": "ok"}


def pandoc_command(markdown_path: Path, docx_path: Path, template: Optional[str]) -> list[str]:
    command = ["pandoc", str(markdown_path), "-o", str(docx_path)]
    if template is None:
        return command
    if template != "acm":
        raise HTTPException(status_code=400, detail="Unknown template")
    if not ACM_TEMPLATE.is_file():
        raise HTTPException(status_code=503, detail="Reference document is unavailable")
    command.append(f"--reference-doc={ACM_TEMPLATE}")
    return command


async def save_upload(upload: UploadFile, destination: Path) -> None:
    size = 0
    try:
        with destination.open("wb") as output:
            while chunk := await upload.read(64 * 1024):
                size += len(chunk)
                if size > MAX_UPLOAD_BYTES:
                    raise HTTPException(status_code=413, detail="Document is too large")
                output.write(chunk)
    finally:
        await upload.close()


def execute_pandoc(command: list[str]) -> None:
    try:
        subprocess.run(
            command,
            check=True,
            capture_output=True,
            text=True,
            timeout=PANDOC_TIMEOUT_SECONDS,
        )
    except subprocess.TimeoutExpired as error:
        raise HTTPException(status_code=504, detail="Conversion timed out") from error
    except subprocess.CalledProcessError as error:
        raise HTTPException(status_code=422, detail="Pandoc could not convert this document") from error
    except FileNotFoundError as error:
        raise HTTPException(status_code=503, detail="Converter is unavailable") from error


@app.post("/convert")
async def convert_markdown_to_word(file: UploadFile = File(...), template: Optional[str] = None):
    filename = file.filename or ""
    if not filename.lower().endswith((".md", ".markdown")):
        raise HTTPException(status_code=400, detail="Upload a Markdown file")

    request_id = uuid.uuid4().hex
    temp_dir = Path(tempfile.mkdtemp(prefix="md2mathml-"))
    markdown_path = temp_dir / f"{request_id}.md"
    docx_path = temp_dir / f"{request_id}.docx"
    started_at = time.monotonic()

    try:
        command = pandoc_command(markdown_path, docx_path, template)
        await save_upload(file, markdown_path)
        await asyncio.to_thread(execute_pandoc, command)
        if not docx_path.is_file() or docx_path.stat().st_size == 0:
            raise HTTPException(status_code=500, detail="Conversion produced no document")
    except Exception:
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise

    duration_ms = int((time.monotonic() - started_at) * 1000)
    download_name = f"{Path(filename).stem or 'document'}.docx"
    return FileResponse(
        path=docx_path,
        filename=download_name,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        background=BackgroundTask(shutil.rmtree, temp_dir, ignore_errors=True),
        headers={
            "Cache-Control": "no-store",
            "Server-Timing": f"convert;dur={duration_ms}",
            "X-Request-ID": request_id,
        },
    )
