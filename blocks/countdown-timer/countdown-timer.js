import parseLocalDateTime from '../../scripts/date.js';

const DAY = 24 * 60 * 60 * 1000;

export function daysRemaining(endTime, now = Date.now()) {
  return Math.max(0, Math.ceil((endTime - now) / DAY));
}

export default function decorate(block) {
  const cells = [...block.children].flatMap((row) => [...row.children])
    .filter((cell) => cell.textContent.trim());
  const [textCell, dateCell] = cells;
  const endTime = parseLocalDateTime(dateCell?.textContent.trim() || '');
  if (!textCell || !Number.isFinite(endTime) || !textCell.textContent.includes('{days}')) {
    // eslint-disable-next-line no-console
    console.warn('countdown-timer requires text containing {days} and a valid local end date.');
    block.hidden = true;
    return;
  }

  const content = document.createElement('div');
  content.className = 'countdown-timer-text';
  content.setAttribute('role', 'timer');
  content.append(...textCell.childNodes);

  const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  const numbers = [];
  textNodes.forEach((node) => {
    const parts = node.textContent.split('{days}');
    if (parts.length === 1) return;
    const replacement = document.createDocumentFragment();
    parts.forEach((part, index) => {
      if (index) {
        const calendar = document.createElement('span');
        calendar.className = 'countdown-timer-calendar';
        const number = document.createElement('span');
        number.className = 'countdown-timer-number';
        calendar.append(number);
        numbers.push(number);
        replacement.append(calendar);
      }
      replacement.append(document.createTextNode(part));
    });
    node.replaceWith(replacement);
  });
  block.replaceChildren(content);

  let timer;
  const controller = new AbortController();
  let observer;

  function stop() {
    clearTimeout(timer);
    controller.abort();
    observer.disconnect();
  }

  observer = new MutationObserver(() => {
    if (!block.isConnected) stop();
  });

  function update() {
    clearTimeout(timer);
    if (!block.isConnected) {
      stop();
      return;
    }
    const now = Date.now();
    const days = daysRemaining(endTime, now);
    numbers.forEach((number) => {
      number.textContent = String(days);
    });
    if (days === 0) {
      stop();
      return;
    }
    // Schedule the next change, not a polling interval, to avoid drift.
    timer = setTimeout(update, Math.max(1, endTime - (days - 1) * DAY - now));
  }

  observer.observe(document.body, { childList: true, subtree: true });
  document.addEventListener('visibilitychange', update, { signal: controller.signal });
  window.addEventListener('pageshow', update, { signal: controller.signal });
  update();
}
