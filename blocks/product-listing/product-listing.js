const LISTING_URL = 'https://www.shopmyexchange.com/browse';

/**
 * Normalizes a category path: levels separated by ">", whitespace collapsed,
 * empty levels dropped. Returns the list of levels.
 */
function parseCategoryPath(text) {
  return text
    .split('>')
    .map((level) => level.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

/**
 * Content model: one row, [Category | <path>]. Accepts the path alone in a single
 * cell and skips empty rows. Returns the first category path found, or [].
 */
function readCategory(block) {
  const rows = [...block.children];
  for (let i = 0; i < rows.length; i += 1) {
    const cells = [...rows[i].children]
      .map((cell) => cell.textContent.replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    if (cells.length && !(cells.length === 1 && /^category\s*:?$/i.test(cells[0]))) {
      // [key | path] uses the second cell; a lone cell is the path (optional "Category:" prefix)
      const value = cells.length > 1 ? cells[1] : cells[0].replace(/^category\s*:?\s*(?=\S)/i, '');
      const levels = parseCategoryPath(value);
      if (levels.length) return levels;
    }
  }
  return [];
}

export default function decorate(block) {
  const levels = readCategory(block);
  block.replaceChildren();
  if (!levels.length) {
    block.classList.add('product-listing-empty');
    return;
  }

  const path = levels.join(' > ');
  block.dataset.category = path;

  // Placeholder rendering. To show live products, connect the store search system here:
  // query it with block.dataset.category and render the item count, sort, product grid
  // and paging in place of the call-to-action below.
  const link = document.createElement('a');
  link.href = `${LISTING_URL}?pageCategories=${encodeURIComponent(path)}`;
  link.className = 'button';
  link.textContent = `Shop all ${levels[levels.length - 1]}`;

  const p = document.createElement('p');
  p.className = 'button-wrapper';
  p.append(link);
  block.append(p);
}
