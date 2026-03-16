/**
 * Heuristic check for copy-like UI controls to gate clipboard reads on click.
 *
 * This helper is intentionally "best effort": we aim to avoid privacy-invasive
 * clipboard reads unless the user interacted with something that strongly looks
 * like a "copy" control. It supports multiple languages including Chinese,
 * Japanese, Korean, etc.
 */
export function isLikelyCopyActionTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false

  const COPY_SELECTORS = [
    "button",
    "[role='button']",
    "a",
    "input[type='button']",
    "input[type='submit']",
    "[data-clipboard-text]",
    "[data-clipboard-target]",
    "[data-copy]",
    "[data-copy-text]",
    "[data-clipboard]",
    "[data-clipboard-value]",
  ].join(", ")

  const candidate = target.closest(COPY_SELECTORS) as HTMLElement | null
  if (!candidate) return false

  const COPY_KEYWORDS = [
    "copy",
    "clipboard",
    "clip",
    "copy code",
    "copy link",
    "duplicate",
    "复制",
    "剪贴板",
    "拷贝",
    "複製",
    "剪貼板",
    "剪貼簿",
    "コピー",
    "クリップボード",
    "コピーする",
    "복사",
    "클립보드",
    "copiar",
    "copier",
    "kopieren",
    "копировать",
    "نسخ",
  ]

  const normalizedKeywords = COPY_KEYWORDS.map((keyword) =>
    keyword.trim(),
  ).filter(Boolean)

  const pattern = new RegExp(
    normalizedKeywords
      .map((keyword) => keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|"),
    "i",
  )

  const DATA_ATTRS = [
    "data-clipboard-text",
    "data-clipboard-target",
    "data-copy",
    "data-copy-text",
    "data-clipboard",
    "data-clipboard-value",
  ] as const

  for (const attr of DATA_ATTRS) {
    if (candidate.hasAttribute(attr)) return true
  }

  const SEMANTIC_ATTRS = [
    "aria-label",
    "title",
    "data-action",
    "data-tooltip",
    "data-tooltip-title",
  ] as const

  for (const attr of SEMANTIC_ATTRS) {
    const value = candidate.getAttribute(attr)
    if (value && pattern.test(value)) return true
  }

  const textContent = candidate.textContent?.trim()
  if (textContent && pattern.test(textContent)) return true

  // Fall back to structural hints when explicit text/attributes are missing.
  if (candidate.id && pattern.test(candidate.id)) return true
  if (candidate.className && pattern.test(candidate.className)) return true

  return false
}
