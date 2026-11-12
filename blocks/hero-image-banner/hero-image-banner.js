import { createOptimizedPicture } from '../../scripts/aem.js';

function optimizePictures(root) {
  root.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, true, [
      { media: '(min-width: 900px)', width: '2000' },
      { width: '900' },
    ]));
  });
}

export default function decorate(block) {
  const pic = block.querySelector('picture');
  if (!pic) return;

  // Content model: [banner image | destination link]. The picture is wrapped in the
  // destination link; its text is the accessible label only when the image has no alt.
  let anchor = pic.closest('a');
  if (!anchor) {
    const link = block.querySelector('a[href]');
    if (link) {
      anchor = link.cloneNode(false);
      anchor.removeAttribute('title');
      const label = link.textContent.trim();
      const hasAlt = Boolean(pic.querySelector('img')?.alt);
      if (!hasAlt && label && !/^(https?:)?\/\//.test(label) && !label.startsWith('/')) {
        anchor.setAttribute('aria-label', label);
      }
      const holder = link.closest('p') || link;
      // Keep any surrounding text that isn't just the link
      if (holder.textContent.trim() === link.textContent.trim()) holder.remove();
      else link.replaceWith(...link.childNodes);
    }
  }

  const media = document.createElement('div');
  media.className = 'hero-image-banner-media';
  if (anchor) {
    if (anchor !== pic.closest('a')) anchor.append(pic);
    media.append(anchor);
  } else {
    media.append(pic);
  }

  // Optional text: anything left with real content
  const text = document.createElement('div');
  text.className = 'hero-image-banner-text';
  [...block.querySelectorAll(':scope > div > div')].forEach((cell) => {
    [...cell.children].forEach((child) => {
      if (child.textContent.trim() || child.querySelector('picture, img')) text.append(child);
    });
  });

  block.replaceChildren(media);
  if (text.children.length) block.append(text);
  optimizePictures(block);

  // Top-of-page banner: load eagerly like the source hero (fetchpriority="high").
  const img = media.querySelector('img');
  if (img) {
    img.loading = 'eager';
    img.fetchPriority = 'high';
  }
}
