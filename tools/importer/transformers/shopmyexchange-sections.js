/* eslint-disable */
/* global WebImporter */

/**
 * Section transformer for www.shopmyexchange.com.
 * Uses payload.template.sections. Only templates with 2+ sections need it
 * (currently "category": rc1 = main:has(#category), rc2 =
 * #recommendationContainer). Single-section templates (home, deals) are a
 * no-op, so it is safe to share.
 *
 * beforeTransform: insert <hr> before every non-first section while the
 * parser targets still exist; styled sections get a temporary marker.
 * afterTransform: add Section Metadata for styled sections after the marker,
 * then drop the marker attribute / the first section's temporary <hr>.
 */

const MARKER = 'data-excat-section-id';

function findSectionElement(root, section) {
  const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
  for (const sel of selectors) {
    if (!sel) continue;
    try {
      const el = root.querySelector(sel);
      if (el) return el;
    } catch (e) {
      // invalid selector in this DOM implementation; try next
    }
  }
  return null;
}

export default function transform(hookName, element, payload) {
  const sections = (payload && payload.template && payload.template.sections) || [];
  if (sections.length < 2) return;
  const document = element.ownerDocument;

  if (hookName === 'beforeTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const el = findSectionElement(element, section);
      if (!el || !el.parentNode) continue;
      if (i === 0 && !section.style) continue;
      const hr = document.createElement('hr');
      if (section.style) hr.setAttribute(MARKER, section.id);
      el.parentNode.insertBefore(hr, el);
    }
  }

  if (hookName === 'afterTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section.style) continue;
      const marker = element.querySelector(`hr[${MARKER}="${section.id}"]`);
      const anchor = marker || findSectionElement(element, section);
      if (!anchor || !anchor.parentNode) continue;
      const meta = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });
      if (marker) {
        // Metadata goes at the end of the section, i.e. before the next break.
        let next = marker.nextElementSibling;
        while (next && next.tagName !== 'HR') next = next.nextElementSibling;
        if (next) next.parentNode.insertBefore(meta, next);
        else marker.parentNode.appendChild(meta);
        if (i === 0) marker.remove();
        else marker.removeAttribute(MARKER);
      } else {
        anchor.after(meta);
      }
    }
    // Clean any leftover markers.
    element.querySelectorAll(`hr[${MARKER}]`).forEach((hr) => hr.removeAttribute(MARKER));
  }
}
