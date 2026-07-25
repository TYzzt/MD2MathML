from pathlib import Path

from fastapi.testclient import TestClient

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
