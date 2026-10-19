import io
from pathlib import Path
import shutil
import xml.etree.ElementTree as ET
from zipfile import ZipFile

from fastapi.testclient import TestClient
import pytest

import main


client = TestClient(main.app)


def fake_execute(command: list[str]) -> None:
    output_path = Path(command[command.index("-o") + 1])
    output_path.write_bytes(b"PK-fake-docx")


def test_healthcheck():
    response = client.get("/healthz")
    assert response.status_code == 200


def test_converts_markdown_without_exposing_content(monkeypatch):
    monkeypatch.setattr(main, "execute_pandoc", fake_execute)
    response = client.post(
        "/convert",
        files={"file": ("thesis.md", b"# Secret thesis\n\n$E=mc^2$", "text/markdown")},
    )

    assert response.status_code == 200
    assert response.content == b"PK-fake-docx"
    assert response.headers["cache-control"] == "no-store"
    assert response.headers["content-disposition"].endswith('filename="thesis.docx"')
    assert "Secret thesis" not in str(response.headers)


def test_rejects_unknown_templates():
    response = client.post(
        "/convert?template=unknown",
        files={"file": ("test.md", b"# Test", "text/markdown")},
    )
    assert response.status_code == 400


def test_rejects_non_markdown_files():
    response = client.post(
        "/convert",
        files={"file": ("test.txt", b"plain text", "text/plain")},
    )
    assert response.status_code == 400


def test_rejects_oversized_uploads(monkeypatch):
    monkeypatch.setattr(main, "MAX_UPLOAD_BYTES", 4)
    response = client.post(
        "/convert",
        files={"file": ("test.md", b"12345", "text/markdown")},
    )
    assert response.status_code == 413


@pytest.mark.skipif(shutil.which("pandoc") is None, reason="Pandoc is required for DOCX integration")
def test_exports_backslash_and_dollar_math_as_editable_word_equations():
    markdown = r"""Inline \(x^2\) and $y^2$.

\[
\frac{1}{2}
\]

$$
z^2
$$

Literal code: `\(literal\)` and `\[literal\]`.
"""
    response = client.post(
        "/convert",
        files={"file": ("google-ai-mode.md", markdown.encode(), "text/markdown")},
    )

    assert response.status_code == 200
    with ZipFile(io.BytesIO(response.content)) as document:
        root = ET.fromstring(document.read("word/document.xml"))

    ns = {
        "m": "http://schemas.openxmlformats.org/officeDocument/2006/math",
        "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
    }
    assert len(root.findall(".//m:oMath", ns)) == 4
    assert len(root.findall(".//m:oMathPara", ns)) == 2
    assert len(root.findall(".//m:f", ns)) == 1
    text = "".join(node.text or "" for node in root.findall(".//w:t", ns))
    assert r"\(literal\)" in text
    assert r"\[literal\]" in text
