/**
 * Shared utility to find the best scrollable container for scroll-to-top/bottom functionality.
 * Uses word-boundary regex checks for robust class and id matching.
 */
export function findBestScrollableContainer(): HTMLElement {
  const allDivs = Array.from(
    document.querySelectorAll('div, main, section')
  ) as HTMLElement[];

  // Prefer elements that look like main content areas
  const scored = allDivs.map((el) => {
    const style = window.getComputedStyle(el);
    const hasOverflow =
      style.overflowY === 'auto' ||
      style.overflow === 'auto' ||
      style.overflowY === 'scroll';
    const height = el.scrollHeight;
    let score = height;

    if (hasOverflow) score += 10000;

    // Use word-boundary regex for robust class matching
    if (/\b(main|content|scroll|container)\b/i.test(el.className))
      score += 5000;

    // Use word-boundary regex for robust id matching
    if (/\b(root|app)\b/i.test(el.id)) score -= 1000; // root usually not the scroller

    return { el, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.el || document.documentElement;
}
