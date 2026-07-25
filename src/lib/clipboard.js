export class ClipboardCopyError extends Error {
  constructor() {
    super('Clipboard copy failed');
    this.name = 'ClipboardCopyError';
  }
}

export function tryLegacyCopy(text, documentRef = globalThis.document) {
  if (!documentRef?.body || typeof documentRef.execCommand !== 'function') return false;

  const textArea = documentRef.createElement('textarea');
  textArea.value = text;
  textArea.setAttribute('readonly', '');
  textArea.style.cssText = 'height:1px;left:-9999px;opacity:0;position:fixed;top:0;width:1px;';
  documentRef.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  textArea.setSelectionRange?.(0, text.length);

  let copied;
  try {
    copied = documentRef.execCommand('copy');
  } catch {
    copied = false;
  } finally {
    textArea.remove();
  }

  return copied;
}

export function isSafari(navigatorRef = globalThis.navigator) {
  const userAgent = navigatorRef?.userAgent || '';
  return navigatorRef?.vendor === 'Apple Computer, Inc.' && !/(CriOS|FxiOS|EdgiOS)/u.test(userAgent);
}

export async function copyPlainText(
  text,
  {
    documentRef = globalThis.document,
    navigatorRef = globalThis.navigator,
  } = {},
) {
  // Safari can reject an asynchronous clipboard write after user activation is lost,
  // so its synchronous fallback must run before awaiting anything.
  if (isSafari(navigatorRef) && tryLegacyCopy(text, documentRef)) return 'exec_command';

  if (navigatorRef?.clipboard?.writeText) {
    try {
      await navigatorRef.clipboard.writeText(text);
      return 'clipboard_api';
    } catch {
      if (tryLegacyCopy(text, documentRef)) return 'exec_command';
      throw new ClipboardCopyError();
    }
  }

  if (tryLegacyCopy(text, documentRef)) return 'exec_command';
  throw new ClipboardCopyError();
}

export function serializeMathElement(mathElement) {
  const mathClone = mathElement.cloneNode(true);
  ['aria-label', 'role', 'tabindex', 'title'].forEach((attribute) => mathClone.removeAttribute(attribute));
  mathClone.setAttribute('xmlns', 'http://www.w3.org/1998/Math/MathML');
  return mathClone.outerHTML;
}
