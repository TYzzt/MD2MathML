
from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:5173")

    # Initial markdown with citations
    initial_markdown = "This is a test with [cite_start]a citation[cite_end] and [cite: 123]."
    page.locator("textarea.editor").fill(initial_markdown)

    # Click the "More" button to reveal the "Remove Citations" button
    page.get_by_role("button", name="More").click()

    # Click the "Remove Citations" button
    page.get_by_role("button", name="Remove Citations").click()

    # Get the cleaned markdown from the editor
    cleaned_markdown = page.locator("textarea.editor").input_value()

    # Assert that the citations are removed
    assert "[cite_start]" not in cleaned_markdown
    assert "[cite_end]" not in cleaned_markdown
    assert "[cite: 123]" not in cleaned_markdown
    assert cleaned_markdown == "This is a test with a citation and ."

    page.screenshot(path="jules-scratch/verification/verification.png")
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
