import { describe, expect, it, vi } from 'vitest';
import { copyPlainText, isSafari, serializeMathElement } from '../src/lib/clipboard';

function fakeDocument(copyResult) {
  const textArea = {
    focus: vi.fn(),
    remove: vi.fn(),
    select: vi.fn(),
    setAttribute: vi.fn(),
    setSelectionRange: vi.fn(),
    style: {},
    value: '',
  };
  return {
    body: { appendChild: vi.fn() },
    createElement: vi.fn(() => textArea),
    execCommand: vi.fn(() => copyResult),
    textArea,
  };
}

describe('clipboard compatibility', () => {
  it('uses the synchronous copy path first in Safari', async () => {
    const documentRef = fakeDocument(true);
    const writeText = vi.fn();

    await expect(copyPlainText('MathML', {
      documentRef,
      navigatorRef: {
        clipboard: { writeText },
        userAgent: 'Mozilla/5.0 Version/18.0 Safari/605.1.15',
        vendor: 'Apple Computer, Inc.',
      },
    })).resolves.toBe('exec_command');
    expect(writeText).not.toHaveBeenCalled();
    expect(documentRef.textArea.setSelectionRange).toHaveBeenCalledWith(0, 6);
  });

  it('uses the Clipboard API first in Chromium', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);

    await expect(copyPlainText('MathML', {
      documentRef: fakeDocument(false),
      navigatorRef: { clipboard: { writeText } },
    })).resolves.toBe('clipboard_api');
    expect(writeText).toHaveBeenCalledWith('MathML');
  });

  it('does not mistake iOS Chrome for Safari', () => {
    expect(isSafari({
      userAgent: 'Mozilla/5.0 CriOS/126.0 Mobile/15E148 Safari/604.1',
      vendor: 'Apple Computer, Inc.',
    })).toBe(false);
  });

  it('serializes clean MathML for Word', () => {
    const clone = {
      outerHTML: '<math xmlns="http://www.w3.org/1998/Math/MathML"><mi>x</mi></math>',
      removeAttribute: vi.fn(),
      setAttribute: vi.fn(),
    };
    const element = { cloneNode: vi.fn(() => clone) };

    expect(serializeMathElement(element)).toContain('<math');
    expect(clone.setAttribute).toHaveBeenCalledWith('xmlns', 'http://www.w3.org/1998/Math/MathML');
    expect(clone.removeAttribute).toHaveBeenCalledTimes(4);
  });
});
