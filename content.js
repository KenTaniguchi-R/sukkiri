/* ==========================================================================
   Sukkiri — rebuilds a Rakuten Ichiba item page as an Amazon PDP.

   This is not a restyle. Rakuten item pages have no shared layout: every shop
   hand-writes its own HTML, so there is nothing stable to style. What IS
   stable is the data Rakuten itself injects into every shop page:

     meta[itemprop=image]              canonical product gallery (not the
                                       shop's marketing banners)
     meta[itemprop=name]               product name
     #priceCalculationConfig           data-price, data-free-shipping
     #js-review-widget                 rating + review list
     table.normal-reserve-form         the live cart form
     script[type=ld+json]              BreadcrumbList

   The cart form is MOVED into the new buy box with appendChild rather than
   cloned, so Rakuten's own event listeners, SKU logic and CSRF state survive
   and the item is still purchasable.
   ========================================================================== */
(() => {
  'use strict';

  /* The toolbar button asks the page to reload itself, so turning the
     extension off needs no "tabs" permission. */
  try {
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg && msg.type === 'sukkiri-reload') location.reload();
    });
  } catch (e) { /* extension context unavailable */ }
  /* Tag the page type on <html> so content.css can scope its destructive rules.
     Without this the promo-banner hide matched a shop top page's whole
     storefront (one div, 3,379 descendants, 7,044 chars, 21 images) and left
     nothing but the header and footer. */
  const isItem   = location.hostname === 'item.rakuten.co.jp' &&
                   /^\/[^/]+\/[^/]+\/?$/.test(location.pathname);
  /* Category pages live on www.rakuten.co.jp/category/<id>/ but render the very
     same .searchresultitem cards in the same grid-container--* as search, so
     they get the same treatment. Matched on the /category/ prefix specifically:
     a shop top page is www.rakuten.co.jp/<shop>/ and must stay untouched. */
  const isSearch = location.hostname === 'search.rakuten.co.jp' ||
                   (location.hostname === 'www.rakuten.co.jp' &&
                    /^\/category\//.test(location.pathname));
  /* Off means off, not a visual undo: when disabled we add no page-type class
     at all, and since every rule in content.css is scoped to .rz-item /
     .rz-search, none of the stylesheet applies and nothing is rebuilt. */
  const start = () => {
    document.documentElement.classList.add(
      isItem ? 'rz-item' : isSearch ? 'rz-search' : 'rz-other');
    if (!isItem) return;                      // only item pages get rebuilt
    if (document.getElementById('sukkiri-pdp')) return;
    render();
  };

  try {
    chrome.storage.local.get('sukkiriEnabled', (v) => {
      if (v && v.sukkiriEnabled === false) return;   // default on
      start();
    });
  } catch (e) { start(); }                    // storage unavailable: fail open

  function render() {

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  /* Rakuten appends the shop name to both og:title and itemprop=name, with
     either separator and several suffixes (｜ロジクール 公式ストア /
     ：SANNE shop 楽天市場店). Only strip a trailing segment that actually
     looks like a shop name, so real titles containing ｜ survive. */
  const clean = s => (s || '')
    .replace(/^【楽天市場】/, '')
    .replace(/[：:|｜][^：:|｜]{1,40}(?:楽天市場店|公式ストア|オンラインショップ|ストア|ショップ|shop|店)\s*$/i, '')
    .trim();

  /* ---------- extract ---------- */
  const D = {};
  /* Rakuten appends the shop name to BOTH metas but with different separators:
       og:title      「…敬老の日：越後銘門酒会 新潟県の酒とグルメ」
       itemprop=name 「…敬老の日｜越後銘門酒会 新潟県の酒とグルメ」
     Suffix patterns alone can't strip it — this shop's name ends in neither
     店 nor ストア. Diffing the two metas finds where they diverge, which is
     exactly the separator, so everything before it is the product name. */
  const ogT = (($('meta[property="og:title"]') || {}).content || '').replace(/^【楽天市場】/, '');
  const ipT = (($('meta[itemprop=name]') || {}).content || '');
  let raw = ipT || ogT;
  if (ogT && ipT) {
    let i = 0;
    while (i < ogT.length && i < ipT.length && ogT[i] === ipT[i]) i++;
    // only trust it when the divergence really is a separator
    if (i > 10 && /[：:|｜]/.test((ogT[i] || '') + (ipT[i] || ''))) raw = ipT.slice(0, i);
  }
  D.name = clean(raw.replace(/[：:|｜]\s*$/, ''));
  D.desc = (($('meta[property="og:description"]') || {}).content || '').trim();

  /* Price.
     meta[itemprop=price] (with #priceCalculationConfig[data-price] as backup)
     is the authoritative current price — verified correct on all 12 shops
     sampled. #itemPrice is only parsed for the two things the meta lacks:
       - a list price, whose label varies by shop:
         「当店通常価格3,980円 2,980 円」/「メーカー希望小売価格1,650円 1,370 円」
       - a variant range, which is present only when 〜 appears:
         「3,410 〜 3,630 円」
     Parsing #itemPrice for the price itself reads the struck-through list
     price instead (3,980 for a 2,980 item), so don't. */
  const cfg  = $('#priceCalculationConfig');
  D.freeShip = cfg ? cfg.dataset.freeShipping === '1' : false;

  D.price = +(($('meta[itemprop=price]') || {}).content || 0)
         || +((cfg && cfg.dataset.price) || 0) || null;

  const ipEl = $('#itemPrice') || $('[class*="item-price--"]');
  const ptxt = ipEl ? (ipEl.innerText || '').replace(/\s+/g, ' ').trim() : '';

  const lp = ptxt.match(/(?:メーカー希望小売価格|当店通常価格|参考価格|通常価格)\s*([\d,]+)\s*円/);
  D.listPrice = lp ? lp[1] : null;

  // strip the list price before scanning the range, or 「メーカー希望小売価格3,990円
  // 1,499 〜 1,999」 reports the range as 1,499〜3,990
  const rtxt = lp ? ptxt.replace(lp[0], ' ') : ptxt;

  D.priceHigh = null;
  if (/[〜~～]/.test(rtxt)) {
    const nums = (rtxt.match(/[\d,]+/g) || []).map(n => +n.replace(/,/g, '')).filter(n => n > 0);
    if (nums.length >= 2) {
      const lo = Math.min(...nums), hi = Math.max(...nums);
      if (!D.price) D.price = lo;
      if (hi > D.price) D.priceHigh = hi;
    }
  }

  /* meta[itemprop=image] order is arbitrary — orbis-shop leads with a 保証
     banner — so seed the gallery with og:image, which is the shot the shop
     picked as the main one, then dedupe the rest in. */
  const ogImg = (($('meta[property="og:image"]') || {}).content || '').trim();
  D.imgs = [...new Set([ogImg, ...$$('meta[itemprop=image]').map(m => m.content)]
                        .filter(Boolean))].slice(0, 14);

  const rt   = ($('#js-review-widget') || {}).innerText || '';
  D.rating   = (rt.match(/総合評価\s*([\d.]+)/) || [])[1] || null;
  D.rcount   = (rt.match(/すべてのレビューを見る（([\d,]+)件）/) || [])[1] || null;

  try {
    const ld = $$('script[type="application/ld+json"]')
      .map(s => { try { return JSON.parse(s.textContent); } catch (e) { return null; } })
      .find(j => j && j['@type'] === 'BreadcrumbList');
    D.crumbs = ld ? ld.itemListElement.map(x => ({
      name: (x.item && x.item.name) || x.name,
      url:  (x.item && (x.item['@id'] || x.item.url)) || x.url || null
    })) : [];
  } catch (e) { D.crumbs = []; }

  D.shop   = location.pathname.split('/')[1];
  D.cart   = $('table.normal-reserve-form') || $('[id^=normal_basket_]');
  /* #offers is Rakuten's canonical buy-side block, present on 10/10 shops
     sampled and always ahead of the cart. It carries the things the meta tags
     do not: points, 3回払い installments, per-variant pricing and — when the
     shop sells one — the 通常購入 / 定期購入 subscription chooser. Rebuilding
     the buy box without it silently dropped the subscription option. */
  D.offers = $('#offers');
  D.spec   = $$('table').find(t => /^\s*商品仕様/.test(t.innerText || ''));
  D.review = $('#js-review-widget');

  // bail out rather than wreck the page if the anchors are missing
  if (!D.cart || !D.imgs.length || !D.price) return;

  const ex = (u, n) => u.includes('r10s.jp') ? u.split('?')[0] + '?_ex=' + n + 'x' + n : u;
  /* Item pages carry <base href="https://image.rakuten.co.jp/">, so ANY relative
     href resolves against the image CDN instead of the site — "/orbis-shop/"
     became https://image.rakuten.co.jp/orbis-shop/ (dead), and even a bare
     "#rz-reviews" fragment would navigate off-page. Every href we emit is
     therefore absolute. */
  const self = location.href.split('#')[0];
  const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
  /* Stars are two stacked ★★★★★ runs, the orange one clipped to a %% width.
     The half-star glyph ⯪ is not in Hiragino and rendered as tofu; this also
     gives true fractional accuracy (4.58 -> 91.6%) the way Amazon does. */
  const stars = r => `<span class="rz-stars"><i style="width:${Math.max(0, Math.min(100, r / 5 * 100))}%"></i></span>`;

  /* ---------- build ---------- */
  /* The review widget is a nested <table> of GIF stars with no classes or ids
     to hook, so parse its innerText — which is strictly regular:
       <name>さん[　<age>/<gender>] / 評価\t\t5.00 / 投稿日：YYYY年MM月DD日 / body…
     A review with 2+ body lines leads with a title, the way Amazon shows one. */
  function buildReviews(widget, avg, count, stars, el) {
    const sec = el('div', 'rz-sec'); sec.id = 'rz-reviews';
    sec.appendChild(el('h2', null, 'カスタマーレビュー'));
    if (!widget) return sec;
    const lines = (widget.innerText || '').split('\n').map(x => x.trim()).filter(Boolean);
    const items = [];
    for (let i = 0; i < lines.length - 2; i++) {
      if (!/^評価\s/.test(lines[i + 1]) || !/^投稿日[：:]/.test(lines[i + 2])) continue;
      const who = lines[i].split(/[　\s]+/);
      const body = [];
      for (let k = i + 3; k < lines.length; k++) {
        if (k + 2 < lines.length && /^評価\s/.test(lines[k + 1]) && /^投稿日[：:]/.test(lines[k + 2])) break;
        body.push(lines[k]);
      }
      items.push({
        name: who[0] || '購入者さん', meta: who[1] || '',
        score: (lines[i + 1].match(/([\d.]+)/) || [])[1] || null,
        date: lines[i + 2].replace(/^投稿日[：:]\s*/, ''),
        title: body.length > 1 ? body[0] : '',
        text: body.length > 1 ? body.slice(1).join(' ') : (body[0] || '')
      });
    }
    if (avg) {
      const sum = el('div', 'rz-rsum',
        `<div class="rz-rbig">${avg}<span>/5</span></div>` +
        `<div>${stars(+avg)}<div class="rz-rcount">${count ? count + '件の評価' : ''}</div></div>`);
      sec.appendChild(sum);
    }
    const all = [...widget.querySelectorAll('a')].find(a => /すべてのレビューを見る/.test(a.textContent || ''));
    if (all) {
      const a = el('a', 'rz-rall'); a.href = all.href;
      a.textContent = `すべてのレビューを見る${count ? '（' + count + '件）' : ''}`;
      sec.appendChild(a);
    }
    const list = el('div', 'rz-rlist');
    items.slice(0, 8).forEach(r => {
      const card = el('div', 'rz-rcard');
      card.innerHTML =
        `<div class="rz-rwho"><span class="rz-av">${(r.name || '?').slice(0, 1)}</span>` +
        `<span class="rz-rname"></span>${r.meta ? `<span class="rz-rmeta">${r.meta}</span>` : ''}</div>` +
        `<div class="rz-rhead">${r.score ? stars(+r.score) : ''}` +
        `${r.title ? '<b class="rz-rtitle"></b>' : ''}</div>` +
        `<div class="rz-rdate">${r.date}</div><div class="rz-rtext"></div>`;
      card.querySelector('.rz-rname').textContent = r.name;
      if (r.title) card.querySelector('.rz-rtitle').textContent = r.title;
      card.querySelector('.rz-rtext').textContent = r.text;
      list.appendChild(card);
    });
    if (items.length) sec.appendChild(list);
    else { sec.appendChild(widget); }   // parser found nothing: keep the original

    /* Star histogram. The PDP widget doesn't carry the distribution, but the
       review page does — server-rendered, behind aria-label="Rating
       Distribution" — so fetch and parse it. Async: the section renders
       immediately and the bars drop in when they arrive. */
    if (all && avg) loadHistogram(all.href, sec, avg, count, el);
    return sec;
  }

  /* The fetch happens in background.js — a content script cannot read another
     origin under MV3 — and only renders if the numbers reconcile with what the
     PDP already claims: same total, and a weighted average within 0.05 of the
     shown rating. A mismatch means the review page changed shape, and a wrong
     distribution is worse than none, so it bails silently. */
  function loadHistogram(url, sec, avg, count, el) {
    let done = false;
    try {
      chrome.runtime.sendMessage({ type: 'rz-histogram', url }, (data) => {
        if (done || chrome.runtime.lastError || !data) return;
        done = true;
        const { counts } = data;
        const total = counts.reduce((a, b) => a + b, 0);
        if (!total) return;
        const calc = counts.reduce((s, n, i) => s + n * (5 - i), 0) / total;
        if (Math.abs(calc - parseFloat(avg)) > 0.05) return;
        if (count && total !== +String(count).replace(/,/g, '')) return;

        const hist = el('div', 'rz-hist');
        counts.forEach((n, i) => {
          const starN = 5 - i;
          const pct = (data.pcts && data.pcts.length === 5) ? data.pcts[i] : Math.round(n / total * 100);
          const row = el('a', 'rz-hrow');
          row.href = url;
          row.title = n.toLocaleString() + '件';
          row.innerHTML =
            `<span class="rz-hlabel">星${starN}つ</span>` +
            `<span class="rz-htrack"><span class="rz-hfill" style="width:${pct}%"></span></span>` +
            `<span class="rz-hpct">${pct}%</span>`;
          hist.appendChild(row);
        });
        const sum = sec.querySelector('.rz-rsum');
        if (sum) sum.after(hist); else sec.querySelector('h2').after(hist);
      });
    } catch (e) { /* extension context gone — leave the summary as-is */ }
  }

  const root = el('div'); root.id = 'sukkiri-pdp';

  root.appendChild(el('div', 'rz-crumb', D.crumbs.map(c =>
    c.url ? `<a class="rz-c" href="${c.url}">${c.name}</a>` : `<span class="rz-c">${c.name}</span>`
  ).join('<span class="rz-sep">›</span>')));

  const main = el('div', 'rz-main');

  const thumbs = el('div', 'rz-thumbs');
  const hero   = el('div', 'rz-hero');
  const heroImg = el('img'); heroImg.src = ex(D.imgs[0], 700); heroImg.alt = D.name;
  hero.appendChild(heroImg);
  D.imgs.forEach((u, i) => {
    const t = el('img'); t.src = ex(u, 120); t.alt = '';
    if (!i) t.className = 'on';
    const pick = () => { heroImg.src = ex(u, 700); $$('.rz-thumbs img', root).forEach(x => x.classList.remove('on')); t.classList.add('on'); };
    t.addEventListener('mouseenter', pick); t.addEventListener('click', pick);
    thumbs.appendChild(t);
  });
  main.appendChild(thumbs); main.appendChild(hero);

  const cen = el('div', 'rz-cen');
  cen.appendChild(el('h1', 'rz-title', ''));
  $('.rz-title', cen).textContent = D.name;
  cen.appendChild(el('div', 'rz-by',
    `<a href="https://www.rakuten.co.jp/${D.shop}/">${D.shop} ストアを表示</a>`));
  if (D.rating) cen.appendChild(el('div', 'rz-rate',
    `<b>${D.rating}</b>${stars(+D.rating)}` +
    `<a class="rz-n" href="${self}#rz-reviews">${D.rcount ? '(' + D.rcount + ')' : 'レビュー'}</a>`));

  const yen = n => `<span class="cur">￥</span>${n.toLocaleString()}`;
  const priceHtml = `<span class="amt">${yen(D.price)}` +
    (D.priceHigh ? ` <span class="dash">〜</span> ${yen(D.priceHigh)}` : '') + '</span>';
  // amazon order: discount % and price on one line, list price struck BELOW it
  const listNum = D.listPrice ? +D.listPrice.replace(/,/g, '') : 0;
  const pct = listNum > D.price ? `<span class="pct">-${Math.round((1 - D.price / listNum) * 100)}%</span>` : '';
  const listLine = listNum > D.price
    ? `<div class="rz-list">参考価格: <s>￥${listNum.toLocaleString()}</s></div>` : '';
  cen.appendChild(el('div', 'rz-price',
    `<div class="rz-priceline">${pct}${priceHtml}<span class="rz-tax">税込</span></div>` +
    listLine + (D.freeShip ? '<div class="rz-ship"><b>送料無料</b></div>' : '')));

  // og:description repeats the title; cut it back to the human sentence
  if (D.desc) {
    let d = D.desc; const head = D.name.slice(0, 18);
    const i = head ? d.indexOf(head) : -1;
    if (i > 20) d = d.slice(0, i);
    const dz = el('div', 'rz-desc'); dz.textContent = clean(d).replace(/[。\s]+$/, '。');
    if (dz.textContent.length > 4) cen.appendChild(dz);
  }
  main.appendChild(cen);

  const buy = el('div', 'rz-buy');
  if (D.offers) {
    // move it in rather than re-deriving price/points/subscription ourselves
    const oh = el('div', 'rz-offers'); oh.appendChild(D.offers); buy.appendChild(oh);
  } else {
    buy.innerHTML =
      `<div class="amt">${yen(D.price)}${D.priceHigh ? ` <span class="dash">〜</span> ${yen(D.priceHigh)}` : ''}<span class="rz-tax">税込</span></div>` +
      (D.freeShip ? '<div class="free">送料無料</div>' : '');
  }
  buy.appendChild(el('div', 'stock', '在庫あり'));

  /* ---- danger window opens here --------------------------------------
     Moving the cart detaches the only way to buy this item. Everything from
     here to the point the new page is attached is wrapped, with an anchor
     left behind so the cart can be put back exactly where it was. Without
     this, a throw on markup I've never seen (this has been verified against
     12 of Rakuten's ~50,000 shops) leaves a product page with no cart, no
     error, and no clue the extension caused it. */
  const cartAnchor = document.createComment('rz-cart-anchor');
  D.cart.parentNode.insertBefore(cartAnchor, D.cart);
  const pagebodyParent = ($('#pagebody') || {}).parentNode || null;

  const rollback = () => {
    try {
      if (cartAnchor.parentNode) cartAnchor.parentNode.insertBefore(D.cart, cartAnchor);
      const r = document.getElementById('sukkiri-pdp');
      const pb = $('#pagebody');
      if (pb && pagebodyParent && pb.parentNode !== pagebodyParent) pagebodyParent.appendChild(pb);
      if (pb) pb.style.display = '';
      if (r) r.remove();
      document.documentElement.classList.remove('sukkiri-on');
    } catch (e) { /* nothing further we can safely do */ }
  };

  try {
  const cartHost = el('div', 'rz-cart');
  cartHost.appendChild(D.cart);            // MOVE, not clone — keeps listeners
  /* Amazon paints カートに入れる #FFD814 and 今すぐ買う #FFA41C. A CSS
     :nth-of-type(2) cannot pick the second one out: Rakuten wraps each button
     in its own div, so both are the first button in their parent. Tag it. */
  cartHost.querySelectorAll('button').forEach(b => {
    if (/購入手続き|今すぐ|レジに進む/.test(b.textContent || '')) b.classList.add('rz-buynow');
  });
  buy.appendChild(cartHost);
  main.appendChild(buy);
  root.appendChild(main);

  if (D.spec) {
    // the table usually carries its own 商品仕様 caption; don't stack two headings
    const own = /^\s*商品仕様/.test(D.spec.innerText || '');
    const sp = el('div', 'rz-details', own ? '' : '<h3>商品の詳細</h3>');
    sp.appendChild(D.spec); cen.appendChild(sp);
  }
  root.appendChild(buildReviews(D.review, D.rating, D.rcount, stars, el));

  // the shop's original page, folded away but reachable
  const old = $('#pagebody');
  const sec = el('div', 'rz-sec', '<h2>ショップの商品説明</h2>');
  const det = el('details', 'rz-shopwrap');
  det.appendChild(el('summary', null, 'ショップが作成した商品ページを表示'));
  const body = el('div', 'rz-shopbody');
  if (old) { old.parentNode.insertBefore(root, old); body.appendChild(old); }
  else     { document.body.appendChild(root); }
  det.appendChild(body); sec.appendChild(det); root.appendChild(sec);

  document.documentElement.classList.add('sukkiri-on');
  } catch (err) {
    rollback();
    return;
  } finally {
    if (cartAnchor.parentNode) cartAnchor.remove();
  }

  /* Post-flight: the rebuild can succeed and still strand the buyer if the
     cart ended up detached or invisible. Assert it, and undo if not. */
  const live = document.getElementById('sukkiri-pdp');
  const cartIn = live && live.contains(D.cart) && document.contains(D.cart);
  const cartShown = cartIn && D.cart.getClientRects().length > 0;
  if (!cartShown) rollback();
  }
})();
