import { loadFragment } from '../fragment/fragment.js';
import parseOnTime from '../../scripts/date.js';

const MAX_TIMEOUT = 2147483647;

export { parseOnTime };

export function readSchedule(block) {
  return [...block.children].flatMap((row) => {
    const [pathCell, timeCell] = row.children;
    if (!pathCell || !timeCell) return [];

    const link = pathCell.querySelector('a');
    const value = (link?.getAttribute('href') || pathCell.textContent).trim();
    const onTime = parseOnTime(timeCell.textContent.trim());
    if (!value || !Number.isFinite(onTime)
      || (!value.startsWith('/') && !/^https?:\/\//.test(value))) return [];

    try {
      const url = new URL(value, window.location.href);
      if (url.origin !== window.location.origin) return [];
      return [{ path: url.pathname.replace(/(?:\.plain)?\.html$/, ''), onTime }];
    } catch {
      return [];
    }
  });
}

export function selectFragment(schedule, now = Date.now()) {
  return schedule.reduce((selected, entry) => (
    entry.onTime <= now && (!selected || entry.onTime >= selected.onTime) ? entry : selected
  ), null);
}

export default async function decorate(block) {
  const schedule = readSchedule(block);
  block.hidden = true;
  block.replaceChildren();
  if (!schedule.length) return;

  let activeEntry = null;
  let timer;
  let observer;
  let requestId = 0;
  const controller = new AbortController();

  function stop() {
    clearTimeout(timer);
    requestId += 1;
    controller.abort();
    observer.disconnect();
  }

  observer = new MutationObserver(() => {
    if (!block.isConnected) stop();
  });

  async function update() {
    clearTimeout(timer);
    if (!block.isConnected) {
      stop();
      return;
    }

    const now = Date.now();
    const nextTime = schedule.reduce((next, entry) => (
      entry.onTime > now ? Math.min(next, entry.onTime) : next
    ), Infinity);
    if (Number.isFinite(nextTime)) {
      timer = setTimeout(update, Math.min(nextTime - now, MAX_TIMEOUT));
    }

    const entry = selectFragment(schedule, now);
    if (entry === activeEntry) return;
    activeEntry = entry;
    requestId += 1;
    const request = requestId;
    block.hidden = true;
    block.replaceChildren();
    if (!entry) return;

    const fragment = await loadFragment(entry.path).catch(() => null);
    if (request === requestId && block.isConnected && fragment) {
      block.replaceChildren(...fragment.children);
      block.hidden = false;
    }
  }

  observer.observe(document.body, { childList: true, subtree: true });
  document.addEventListener('visibilitychange', update, { signal: controller.signal });
  window.addEventListener('pageshow', update, { signal: controller.signal });
  await update();
}
