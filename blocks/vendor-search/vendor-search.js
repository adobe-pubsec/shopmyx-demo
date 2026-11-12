/*
 * Vendor search ("Find it fast"): filters the vendor lists that follow it in its
 * section as the visitor types. It searches what is on the page (no index): each
 * vendor's name, location, note and phone, plus its category (h2) and subcategory
 * (h3 + building lines) headings. Hours are not searched.
 *
 * | Vendor Search |                                                    |
 * | Label         | Find it fast                                       |  optional
 * | Placeholder   | Search vendors, e.g. Starbucks, barber, Bldg. 4250 |  optional
 */

const DEFAULTS = {
  label: 'Find it fast',
  placeholder: 'Search vendors',
};
const DEBOUNCE_MS = 100;
let instance = 0;

/** Lower-case, no accents or apostrophes, "&" as "and", punctuation as spaces. */
export function normalize(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’‘`]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function readConfig(block) {
  const config = { ...DEFAULTS };
  [...block.children].forEach((row) => {
    const [key, value] = row.children;
    if (!key || !value) return;
    const k = key.textContent.trim().toLowerCase();
    const v = value.textContent.trim();
    if (v && (k === 'label' || k === 'placeholder')) config[k] = v;
  });
  return config;
}

/**
 * Model of the directory after the search block: categories (h2) holding groups
 * (h3 + info lines, or none) holding vendor-list wrappers.
 */
function readDirectory(section, searchWrapper) {
  const categories = [];
  let category = null;
  let group = null;
  const newCategory = (h2) => {
    category = { heading: h2, text: h2 ? normalize(h2.textContent) : '', groups: [] };
    categories.push(category);
    group = null;
  };
  const newGroup = (h3) => {
    if (!category) newCategory(null);
    group = {
      heading: h3, infos: [], text: h3 ? normalize(h3.textContent) : '', lists: [],
    };
    category.groups.push(group);
  };
  let after = false;
  [...section.children].forEach((wrapper) => {
    if (wrapper === searchWrapper) { after = true; return; }
    if (!after) return;
    if (wrapper.classList.contains('vendor-list-wrapper')) {
      if (!group || group.closed) newGroup(null);
      group.lists.push(wrapper);
      return;
    }
    [...wrapper.children].forEach((el) => {
      if (el.tagName === 'H2') {
        newCategory(el);
      } else if (el.tagName === 'H3') {
        newGroup(el);
      } else if (group && group.heading && !group.lists.length) {
        group.infos.push(el); // building / info lines under the subcategory heading
        group.text = `${group.text} ${normalize(el.textContent)}`;
      }
    });
    // a vendor list after other default content starts a new, heading-less group
    if (group && group.lists.length) group.closed = true;
  });
  return categories;
}

function vendorText(item) {
  const vendor = item.querySelector('.vendor');
  if (!vendor) return null;
  const parts = ['.vendor-name', '.vendor-location', '.vendor-note', '.vendor-phone']
    .flatMap((sel) => [...vendor.querySelectorAll(sel)].map((el) => el.textContent));
  const digits = [...vendor.querySelectorAll('.vendor-phone')].map((el) => el.textContent.replace(/\D/g, '')).join(' ');
  return normalize(`${parts.join(' ')} ${digits}`);
}

function setHidden(el, hidden) {
  if (!el) return;
  if (hidden) el.setAttribute('hidden', '');
  else el.removeAttribute('hidden');
}

export default function decorate(block) {
  const config = readConfig(block);
  instance += 1;
  const id = `vendor-search-${instance}`;

  const form = document.createElement('form');
  form.setAttribute('role', 'search');
  form.className = 'vendor-search-form';
  form.addEventListener('submit', (e) => e.preventDefault());

  const label = document.createElement('label');
  label.htmlFor = `${id}-input`;
  label.className = 'vendor-search-label';
  label.textContent = config.label;

  const field = document.createElement('div');
  field.className = 'vendor-search-field';
  const input = document.createElement('input');
  input.type = 'search';
  input.id = `${id}-input`;
  input.placeholder = config.placeholder;
  input.autocomplete = 'off';
  input.setAttribute('aria-describedby', `${id}-status`);
  const clear = document.createElement('button');
  clear.type = 'button';
  clear.className = 'vendor-search-clear';
  clear.textContent = 'Clear';
  clear.hidden = true;
  field.append(input, clear);

  const status = document.createElement('p');
  status.id = `${id}-status`;
  status.className = 'vendor-search-status';
  status.setAttribute('aria-live', 'polite');

  form.append(label, field, status);
  block.replaceChildren(form);

  const section = block.closest('.section');
  const searchWrapper = block.closest('.vendor-search-wrapper') || block;
  if (section) {
    section.id = section.id || `${id}-results`;
    input.setAttribute('aria-controls', section.id);
  }

  const apply = () => {
    if (!section) return;
    const query = normalize(input.value);
    const tokens = query ? query.split(' ') : [];
    // Word-by-word matching only for words of 2+ characters ("and" ignored), so "h&r"
    // (h and r) matches only as a phrase, not every word starting with h or r.
    const words = tokens.filter((t) => t !== 'and');
    const byWords = words.length > 0 && words.every((t) => t.length > 1);
    clear.hidden = !input.value;
    let shown = 0;
    let total = 0;
    readDirectory(section, searchWrapper).forEach((category) => {
      let categoryShown = 0;
      category.groups.forEach((group) => {
        let groupShown = 0;
        const context = `${category.text} ${group.text}`;
        group.lists.forEach((list) => {
          let listShown = 0;
          list.querySelectorAll('.vendor-list-item').forEach((item) => {
            const own = vendorText(item);
            if (own === null) { // still loading (or failed): only shown without a query
              setHidden(item, tokens.length > 0);
              if (!tokens.length) listShown += 1;
              return;
            }
            total += 1;
            const haystack = ` ${own} ${context} `;
            const match = haystack.includes(` ${query}`)
              || (byWords && words.every((t) => haystack.includes(` ${t}`)));
            setHidden(item, !match);
            if (match) { listShown += 1; shown += 1; }
          });
          setHidden(list, listShown === 0);
          groupShown += listShown;
        });
        setHidden(group.heading, groupShown === 0);
        group.infos.forEach((el) => setHidden(el, groupShown === 0));
        categoryShown += groupShown;
      });
      setHidden(category.heading, categoryShown === 0);
    });
    // default-content wrappers left with nothing visible collapse too
    [...section.querySelectorAll(':scope > .default-content-wrapper')].forEach((w) => {
      const visible = [...w.children].some((el) => !el.hasAttribute('hidden'));
      setHidden(w, !visible);
    });

    if (!tokens.length) status.textContent = '';
    else if (!shown) status.textContent = `No vendors match “${input.value.trim()}”`;
    else status.textContent = `${shown} ${shown === 1 ? 'vendor matches' : 'vendors match'} “${input.value.trim()}”`;
    block.dataset.total = String(total);
  };

  let timer;
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      apply();
      // shareable: keep ?q= in the address in sync
      const url = new URL(window.location.href);
      if (input.value.trim()) url.searchParams.set('q', input.value.trim());
      else url.searchParams.delete('q');
      window.history.replaceState(window.history.state, '', url);
    }, DEBOUNCE_MS);
  };

  input.addEventListener('input', schedule);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && input.value) {
      e.preventDefault();
      input.value = '';
      schedule();
    }
  });
  clear.addEventListener('click', () => {
    input.value = '';
    schedule();
    input.focus();
  });

  // vendors arrive after the page renders: re-apply the current query as lists load
  if (section) section.addEventListener('vendor-list:loaded', () => { if (input.value.trim()) apply(); });

  const q = new URLSearchParams(window.location.search).get('q');
  if (q) {
    input.value = q;
    apply();
  }
}
