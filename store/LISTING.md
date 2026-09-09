# Chrome Web Store submission — Sukkiri

Everything below is copy-paste. Upload `sukkiri-v1.2.2.zip` from the v1.2.2
release, then work down this file.

Dashboard: https://chrome.google.com/webstore/devconsole
One-time developer registration fee: **US$5** (your Google account, not mine).

---

## Store listing

**Item name** (45 char max)
```
Sukkiri — clean layout for Rakuten Ichiba
```

**Short description** (132 char max — this is the one that shows in search)
```
Rebuilds 楽天市場 product and search pages into a clean layout, so the price and cart are at the top instead of far below.
```

**Category:** Shopping
**Language:** Japanese (primary). Add English if you want a second listing.

**Detailed description**
```
Rakuten Ichiba product pages put the shop's own marketing above the product.
On a real page measured with this extension, the cart button sat 121,273
pixels down — about 143 screens of banners and photographs before you could
buy anything.

Sukkiri rebuilds the page so the useful parts come first.

PRODUCT PAGES
• Photos, price, points, delivery and the buy button at the top
• Product gallery from Rakuten's own image data, not the shop's banner art
• Points, instalments and 定期購入 (subscription) all preserved
• Reviews shown as cards, with a star breakdown
• The shop's original page is kept, folded under 「ショップの商品説明」

SEARCH AND CATEGORY PAGES
• Larger cards with bigger photos
• Titles in plain black instead of every result in red
• Delivery estimate promoted, since that is what you compare
• Sponsored results hidden

Rakuten's own header is left exactly as it is.

TURNING IT OFF
Click the toolbar icon. The badge shows OFF and the page reloads exactly as
Rakuten made it. Nothing is restyled and nothing is rebuilt while it is off.

This matters because Sukkiri moves the real cart form into its new layout
rather than copying it, so your quantity, variant choice and login session
keep working. If a rebuild ever fails partway, the extension detects it and
restores Rakuten's original page by itself.

PRIVACY
No accounts, no analytics, no tracking. Nothing is collected and nothing is
sent anywhere. The only network request is to review.rakuten.co.jp, to read
the star breakdown for the product page you are already looking at.

Independent project, not affiliated with or endorsed by Rakuten.
Source code: https://github.com/KenTaniguchi-R/sukkiri
```

---

## Privacy practices tab (required — submission is blocked without these)

**Single purpose description**
```
Sukkiri reformats Rakuten Ichiba (rakuten.co.jp) shopping pages into a
cleaner layout, so that product information and the purchase controls appear
at the top of the page instead of below the shop's marketing content.
```

**Justification — `storage` permission**
```
Stores one boolean: whether the user has turned the extension on or off with
the toolbar button. Nothing else is written, and it never leaves the browser.
```

**Justification — host permission `https://review.rakuten.co.jp/*`**
```
Reads the star-rating breakdown (5-star through 1-star counts) for the
product the user is currently viewing, so it can be shown on the product page
itself. Manifest V3 subjects a content script's fetch to the page's own CORS
policy, so this request must be made from the extension's service worker,
which requires this host permission. Only the review page for the current
product is requested; nothing is written or sent.
```

**Justification — content scripts on `item/search/www.rakuten.co.jp`**
```
These are the pages the extension reformats. The content script reads the
product data Rakuten already publishes in the page and rearranges the
existing elements; it does not send page contents anywhere.
```

**Data usage — tick these**
- [x] I do not sell or transfer user data to third parties, outside of approved use cases
- [x] I do not use or transfer user data for purposes unrelated to my item's single purpose
- [x] I do not use or transfer user data to determine creditworthiness or for lending purposes

**Collected data categories:** none. Do not tick any category.

**Privacy policy URL:** not required while collecting no data. If the form
insists, point it at the Privacy section of the README:
`https://github.com/KenTaniguchi-R/sukkiri#privacy`

---

## Graphics (in this folder)

| File | Size | Use |
|---|---|---|
| `screenshot-1-product-after.png` | 1280×800 | required, make it first |
| `screenshot-2-product-before.png` | 1280×800 | shows the problem |
| `screenshot-3-search.png` | 1280×800 | search results |
| `screenshot-4-reviews.png` | 1280×800 | star breakdown |
| `promo-440x280.png` | 440×280 | small promo tile (optional) |
| `../icons/icon-128.png` | 128×128 | store icon (required) |

---

## Field limits that actually bite

The dashboard rejects the upload before you see any form if these are wrong:

| Field | Limit | Ours |
|---|---|---|
| `manifest.description` | **132 chars** | 119 |
| `manifest.name` | 45 chars | 7 |
| Store short description | 132 chars | see above |

The manifest description is the one that catches people — it is a *different*
field from the store listing description, and only the manifest one is capped
at 132.

---

## Expect this at review

The extension hides sponsored search results. That is permitted, but it is
the most likely thing a reviewer asks about. It is disclosed in the listing
text above, which is the right way to handle it.

Review usually takes a few days. A rejection is not unusual on a first
submission and normally names the exact field to fix.
