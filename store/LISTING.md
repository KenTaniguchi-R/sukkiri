# Chrome Web Store submission — Sukkiri

Everything below is copy-paste. Upload `sukkiri-v1.2.3.zip` from the v1.2.3
release, then work down this file.

Dashboard: https://chrome.google.com/webstore/devconsole
One-time developer registration fee: **US$5** (your Google account, not mine).

---

## Store listing — Japanese

Target users are Japanese Rakuten shoppers, so everything they read is in
Japanese. The reviewer-facing fields in the next section stay in English,
since that is who reads them.

**Item name** (45 char max)
```
Sukkiri（すっきり）
```
Deliberately not 「楽天市場…」 — putting a trademark in the extension name is
what gets listings pulled. Using it factually in the description is fine.

**Short description** (132 char max — this is what shows in search results)
```
楽天市場の商品ページと検索結果を見やすく整えます。価格とカートが上に来るので、ショップの宣伝を延々とスクロールせずに済みます。
```

**Category:** ショッピング (Shopping)
**Language:** 日本語 — set this as the primary listing language.

**Detailed description**
```
楽天市場の商品ページは、ショップの宣伝が商品より先に来ます。実際に測ったページでは、「かごに追加」ボタンが 121,273 ピクセル下にありました。画面にして約 143 枚分です。

Sukkiri は、必要な情報が先に来るようにページを組み直します。

■ 商品ページ
・写真、価格、ポイント、配送、購入ボタンを上部にまとめます
・写真はショップのバナー画像ではなく、楽天の商品画像を使います
・ポイント、分割払い、定期購入はそのまま残ります
・レビューはカード表示になり、星の分布も出ます
・ショップ独自のページは「ショップの商品説明」に折りたたんで残します

■ 検索・カテゴリページ
・カードと商品画像を大きく
・商品名は赤ではなく黒にして読みやすく
・お届け予定日を目立たせます
・広告（PR）商品は非表示

楽天のヘッダーには手を加えません。

■ オフにする
ツールバーのアイコンをクリックすると、バッジに OFF と表示され、ページは楽天のままの状態で再読み込みされます。オフの間は一切手を加えません。

Sukkiri はカートのフォームを複製せず、そのまま移動させています。数量や種類の選択、ログイン状態がそのまま使えるのはこのためです。万一途中で失敗した場合は、自動的に楽天の元のページに戻します。

■ プライバシー
アカウント登録なし、解析なし、追跡なし。情報の収集も送信も行いません。通信は、表示中の商品の星の分布を読み取るために review.rakuten.co.jp へ行うものだけです。

楽天グループ株式会社とは関係のない、個人が作った拡張機能です。
ソースコード: https://github.com/KenTaniguchi-R/sukkiri
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
| `manifest.description` | **132 chars** | 54 |
| `manifest.name` | 45 chars | 13 |
| `action.default_title` | 132 chars | 21 |
| Store short description | 132 chars | 63 |

Japanese counts as one character per character here, not per byte — the
132-character cap is generous in Japanese, but check it anyway before every
upload. That is what blocked v1.2.1.

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
