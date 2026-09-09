# Sukkiri（すっきり）

Rebuilds Rakuten Ichiba (楽天市場) product and search pages into a clean,
scannable layout modelled on Amazon.co.jp.

**Independent project. Not affiliated with, endorsed by, or connected to Rakuten.**
"Rakuten" and "楽天市場" are trademarks of Rakuten Group, Inc., used here only to
say factually which site this works on.

Not a restyle. Rakuten item pages have no shared layout — every shop hand-writes
its own HTML — so there is nothing stable to style. What *is* stable is the data
Rakuten itself injects into every shop page:

| anchor | gives |
|---|---|
| `meta[itemprop=image]` | canonical product gallery (not the shop's banners) |
| `meta[itemprop=name]` | product name |
| `#itemPrice` | price, incl. ranges + list price |
| `meta[itemprop=price]` | numeric low price (fallback) |
| `#js-review-widget` | rating + reviews |
| `#offers` | price, points, installments, **定期購入 subscription chooser** |
| `table.normal-reserve-form` | the live cart form |
| `ld+json BreadcrumbList` | category path |
| review page `aria-label="Rating Distribution"` | star histogram (fetched) |

`content.js` reads those, builds an Amazon PDP, and **moves** both `#offers` and
the real cart form into the new buy box with `appendChild` (not a clone) so
Rakuten's own listeners, SKU logic and CSRF state survive and the item stays
purchasable. `#offers` matters: it carries points, installments and the
定期購入 subscription option, none of which are in the meta tags — rebuilding
the buy box without it silently drops the ability to subscribe.

The buy column is 400px rather than Amazon's 275px, because the blocks moved
into it are Rakuten components authored for 400px; below that they visibly
break (prices split mid-number, labels stack one character per line). The shop's
original page is kept, collapsed, under 「ショップの商品説明」.

The **layout** is Amazon's; the **colour** is Rakuten's. Actions use Rakuten
crimson `#BF0000` (buy-now `#8F0000`) with white labels, links `#BF0000`,
stars `#F5A623`, borders `#DDDDDD`, 在庫あり `#0B7B3C`, prices flat `#0F1111`.

Rakuten's own header is left completely untouched. Restyling it meant painting
its text white, and every light popover nested inside it then rendered
white-on-white — the SPU point panel, then all ten search suggestions. The
value here is the rebuilt product page, not the chrome.

## Install

1. `chrome://extensions` → enable Developer mode
2. "Load unpacked" → select this folder

## Safety

`content.js` returns early unless the cart form, gallery and price are all found,
so a shop with unexpected markup is left untouched rather than broken.


## Turning it off

Click the toolbar icon. The badge shows `OFF` and the page reloads untouched.

This matters more than it would for a normal theme: the extension **moves the
live cart form** into the rebuilt buy box, so a shop whose markup it mishandles
could leave someone unable to buy. One click always gets Rakuten back.

"Off" is genuinely off rather than a visual undo. Every rule in `content.css` is
scoped to `.rz-item` / `.rz-search`, and those classes are only added when the
extension is enabled — so when it is off, no stylesheet applies and no rebuild
runs. Verified: zero classes added on the disabled path.

## Known limits

- Verified against 12 shops. Rakuten has roughly 50,000, each writing its own
  product-page HTML.
- No purchase has been completed end to end with it enabled.
- Class names are hashed (`title-link--3Yuev`). Selectors use `[class*="prefix--"]`
  so they survive hash changes, but a Rakuten redesign will break them at once.
- Sponsored (CPC) results are hidden.

## License

MIT — see [LICENSE](LICENSE).
