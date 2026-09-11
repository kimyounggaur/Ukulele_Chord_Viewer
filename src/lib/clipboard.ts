export type ClipboardCopyMethod = "clipboard" | "exec-command";

function copyWithExecCommand(text: string): boolean {
  if (typeof document === "undefined" || !document.body) {
    return false;
  }

  const activeElement = document.activeElement instanceof HTMLElement
    ? document.activeElement
    : null;
  const selection = document.getSelection();
  const previousRanges = selection
    ? Array.from({ length: selection.rangeCount }, (_, index) => selection.getRangeAt(index).cloneRange())
    : [];
  const textarea = document.createElement("textarea");

  textarea.value = text;
  textarea.readOnly = true;
  textarea.setAttribute("aria-hidden", "true");
  textarea.tabIndex = -1;
  Object.assign(textarea.style, {
    position: "fixed",
    inset: "0 auto auto -9999px",
    width: "1px",
    height: "1px",
    opacity: "0",
    pointerEvents: "none",
  });

  document.body.appendChild(textarea);
  textarea.focus({ preventScroll: true });
  textarea.select();
  textarea.setSelectionRange(0, text.length);

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  } finally {
    textarea.remove();

    if (selection) {
      selection.removeAllRanges();
      previousRanges.forEach((range) => selection.addRange(range));
    }

    activeElement?.focus({ preventScroll: true });
  }

  return copied;
}

/**
 * Copies text using the secure Clipboard API first, then falls back to the
 * legacy selection-based command for older and embedded browsers.
 */
export async function copyTextToClipboard(text: string): Promise<ClipboardCopyMethod | null> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return "clipboard";
    } catch {
      // Permission-denied and non-secure contexts can still use the DOM fallback.
    }
  }

  return copyWithExecCommand(text) ? "exec-command" : null;
}
