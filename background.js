/* ==========================================================================
   Service worker: fetches the star histogram off the review page.

   This exists because of a Manifest V3 rule: a content script's fetch is
   subject to the *page's* CORS, so item.rakuten.co.jp cannot read
   review.rakuten.co.jp directly no matter what host_permissions say — it
   fails with "Failed to fetch". Only the extension's own worker can.

   Parsing is regex rather than DOM because a service worker has no DOMParser.
   The naive /([\d,]+)件/ double-counts, since every figure appears twice (once
   as the button's aria-label, once as its visible text), which produced
   [1336,1336,326,326,63]. Anchoring on aria-label="…件" matches once per row.
   ========================================================================== */
const MARK = 'aria-label="Rating Distribution"';

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg || msg.type !== 'rz-histogram') return;
  (async () => {
    try {
      if (!/^https:\/\/review\.rakuten\.co\.jp\//.test(msg.url)) return sendResponse(null);
      const res = await fetch(msg.url, { credentials: 'omit' });
      if (!res.ok) return sendResponse(null);
      const html = await res.text();
      const i = html.indexOf(MARK);
      if (i < 0) return sendResponse(null);
      const slice = html.slice(i, i + 20000);
      const counts = [...slice.matchAll(/aria-label="([\d,]+)件"/g)]
        .slice(0, 5).map(m => +m[1].replace(/,/g, ''));
      const pcts = [...slice.matchAll(/aria-valuenow="(\d+)"/g)]
        .slice(0, 5).map(m => +m[1]);
      sendResponse(counts.length === 5 ? { counts, pcts } : null);
    } catch (e) { sendResponse(null); }
  })();
  return true;                       // keep the channel open for the async reply
});


/* ==========================================================================
   On/off switch.

   The escape hatch matters more than usual here: this extension MOVES the
   live cart form, so a shop whose markup it mishandles could leave someone
   unable to buy. One click on the toolbar icon must always get Rakuten back.

   The toolbar click only flips a stored flag and tells the page to reload —
   the content script reloads itself, so no "tabs" permission is needed.
   Because every rule in content.css is scoped to .rz-item / .rz-search, and
   those classes are only added when enabled, "off" really is off: no styling
   and no rebuild, not a visual undo.
   ========================================================================== */
const KEY = 'sukkiriEnabled';

async function isEnabled() {
  const v = await chrome.storage.local.get(KEY);
  return v[KEY] !== false;                       // default on
}

async function paintBadge(enabled) {
  await chrome.action.setBadgeText({ text: enabled ? '' : 'OFF' });
  await chrome.action.setBadgeBackgroundColor({ color: '#767676' });
}

chrome.runtime.onInstalled.addListener(async () => paintBadge(await isEnabled()));
chrome.runtime.onStartup.addListener(async () => paintBadge(await isEnabled()));

chrome.action.onClicked.addListener(async (tab) => {
  const next = !(await isEnabled());
  await chrome.storage.local.set({ [KEY]: next });
  await paintBadge(next);
  try { await chrome.tabs.sendMessage(tab.id, { type: 'sukkiri-reload' }); }
  catch (e) { /* not a Rakuten page, or no content script here */ }
});
