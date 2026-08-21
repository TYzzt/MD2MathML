import { describe, expect, it, vi } from 'vitest';
import {
  copyPlainText,
  isSafari,
  normalizeMathElement,
  serializeMathElement,
} from '../src/lib/clipboard';

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
      outerHTML: '<math xmlns="http://www.w3.org/1998/Math/MathML"><mrow><mfrac><mn>1</mn><mn>2</mn></mfrac><mi>$</mi><mtext>&#x20;</mtext><mtext>&nbsp;</mtext></mrow></math>',
      querySelectorAll: vi.fn(() => []),
      removeAttribute: vi.fn(),
      setAttribute: vi.fn(),
    };
    const element = { cloneNode: vi.fn(() => clone) };

    const serialized = serializeMathElement(element);

    expect(serialized).toContain('<mfrac><mn>1</mn><mn>2</mn></mfrac><mi>$</mi>');
    expect(serialized).not.toMatch(/&(?:nbsp|#x20);/u);
    expect(clone.setAttribute).toHaveBeenCalledWith('xmlns', 'http://www.w3.org/1998/Math/MathML');
    expect(clone.removeAttribute).toHaveBeenCalledTimes(4);
  });

  it('joins adjacent Malayalam text nodes so combining letters shape together', () => {
    const first = {
      attributes: [],
      localName: 'mtext',
      remove: vi.fn(),
      textContent: 'മ',
    };
    const second = {
      attributes: [],
      localName: 'mtext',
      remove: vi.fn(),
      textContent: 'ലയാളം',
    };
    const row = { children: [first, second] };
    const math = {
      querySelectorAll: vi.fn((selector) => (selector === 'mtext' ? [first, second] : [row])),
    };

    expect(normalizeMathElement(math)).toBe(math);
    expect(first.textContent).toBe('മലയാളം');
    expect(second.remove).toHaveBeenCalledOnce();
  });
});
