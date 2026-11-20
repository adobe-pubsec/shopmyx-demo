import { createOptimizedPicture } from '../../scripts/aem.js';

const HEADING = 'h1, h2, h3, h4, h5, h6';
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
// "Dec 16", "December 16", "Dec. 16"
const DATE = /^([a-z]{3,9})\.?\s+(\d{1,2})$/i;

function text(el) {
  return el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
}

function stripButton(a) {
  a.classList.remove('button', 'primary', 'secondary', 'accent');
  if (!a.classList.length) a.removeAttribute('class');
  const p = a.closest('.button-wrapper, .button-container');
  if (p) p.classList.remove('button-wrapper', 'button-container');
}

/** Builds the CSS calendar for a date cell ("Dec 16"). */
function buildCalendar(dateText) {
  const cal = document.createElement('time');
  cal.className = 'shipping-deadlines-calendar';
  const match = dateText.match(DATE);
  const month = document.createElement('span');
  month.className = 'shipping-deadlines-month';
  const day = document.createElement('span');
  day.className = 'shipping-deadlines-day';
  if (match) {
    const [, monthName, dayNum] = match;
    month.textContent = monthName.slice(0, 3);
    day.textContent = dayNum;
    const m = MONTHS.indexOf(monthName.slice(0, 3).toLowerCase());
    if (m >= 0) cal.dateTime = `${String(m + 1).padStart(2, '0')}-${dayNum.padStart(2, '0')}`;
    cal.setAttribute('aria-label', dateText);
  } else {
    day.textContent = dateText;
  }
  if (month.textContent) cal.append(month);
  cal.append(day);
  return cal;
}

/** Reads a deadline row: [group | date | label]; the date cell is found by its pattern. */
function readDeadline(cells) {
  const texts = cells.map(text);
  let di = texts.findIndex((t) => DATE.test(t));
  if (di < 0) di = texts.length > 1 ? 1 : 0;
  return {
    group: texts.slice(0, di).filter(Boolean).join(' '),
    date: texts[di],
    label: texts.slice(di + 1).filter(Boolean).join(' '),
  };
}

/**
 * Shipping deadlines panel. Content model (rows detected by content):
 *  - title row: heading (+ link that makes the whole block clickable)
 *  - art row: [left image | right image]
 *  - deadline rows: [group | date (e.g. Dec 16) | label (optional)]
 *  - note row: single text cell, shown under the right image
 */
export default function decorate(block) {
  let titleCell = null;
  const art = [];
  const deadlines = [];
  const notes = [];

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const hasPic = !!row.querySelector('picture');
    if (!text(row) && !hasPic) return;
    if (!titleCell && row.querySelector(HEADING)) {
      titleCell = row;
    } else if (hasPic && !text(row)) {
      art.push(...row.querySelectorAll('picture'));
    } else if (cells.filter((c) => !c.querySelector('picture')).length >= 2) {
      deadlines.push(readDeadline(cells));
    } else {
      notes.push(row);
    }
  });

  const out = [];

  // title bar
  let link = null;
  if (titleCell) {
    const title = document.createElement('div');
    title.className = 'shipping-deadlines-title';
    const heading = titleCell.querySelector(HEADING);
    title.append(heading);
    link = titleCell.querySelector('a[href]');
    out.push(title);
  }

  const body = document.createElement('div');
  body.className = 'shipping-deadlines-body';

  // left art (first picture)
  const [leftPic, ...rest] = art;
  const rightPic = rest.length ? rest[rest.length - 1] : null;
  if (leftPic) {
    const left = document.createElement('div');
    left.className = 'shipping-deadlines-art shipping-deadlines-art-left';
    left.append(leftPic);
    body.append(left);
  }

  // deadline groups: consecutive rows with the same group share one heading
  const groups = document.createElement('div');
  groups.className = 'shipping-deadlines-groups';
  let current = null;
  deadlines.forEach((d) => {
    if (!current || current.key !== d.group.toLowerCase()) {
      const group = document.createElement('div');
      group.className = 'shipping-deadlines-group';
      if (d.group) {
        const name = document.createElement('p');
        name.className = 'shipping-deadlines-group-name';
        name.textContent = d.group;
        group.append(name);
      }
      const list = document.createElement('ul');
      list.className = 'shipping-deadlines-list';
      group.append(list);
      groups.append(group);
      current = { key: d.group.toLowerCase(), list };
    }
    const item = document.createElement('li');
    item.className = 'shipping-deadlines-item';
    item.append(buildCalendar(d.date));
    if (d.label) {
      const label = document.createElement('span');
      label.className = 'shipping-deadlines-label';
      label.textContent = d.label;
      item.append(label);
    }
    current.list.append(item);
  });
  if (groups.children.length) body.append(groups);

  // right art + note(s)
  if (rightPic || notes.length) {
    const aside = document.createElement('div');
    aside.className = 'shipping-deadlines-art shipping-deadlines-art-right';
    if (rightPic) aside.append(rightPic);
    notes.forEach((row) => {
      const note = document.createElement('p');
      note.className = 'shipping-deadlines-note';
      note.textContent = text(row);
      aside.append(note);
    });
    body.append(aside);
  }
  out.push(body);

  if (link) {
    stripButton(link);
    link.removeAttribute('title');
    link.classList.add('shipping-deadlines-link');
    block.classList.add('shipping-deadlines-clickable');
    out.push(link);
  }

  block.replaceChildren(...out);

  block.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
  });
}
