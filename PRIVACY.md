# プライバシーポリシー / Privacy Policy

**Sukkiri（すっきり）** — Chrome 拡張機能
最終更新: 2026年9月9日

---

## 日本語

### 収集する情報

**ありません。**

この拡張機能は、利用者に関する情報を一切収集しません。個人情報、閲覧履歴、
検索内容、購入内容、Cookie、端末情報、いずれも取得しません。

アカウント登録はありません。解析ツール、広告、トラッキングも組み込んでいません。

### 端末に保存する情報

ブラウザ内に 1 つだけ値を保存します。

| 項目 | 内容 |
|---|---|
| `sukkiriEnabled` | 拡張機能をオンにしているか、オフにしているか（true / false） |

ツールバーのアイコンをクリックして表示を切り替えたとき、その選択を覚えておく
ためだけに使います。`chrome.storage.local` に保存され、利用者のブラウザから
外に出ることはありません。開発者もこの値を見ることはできません。

### 外部への通信

この拡張機能が行う通信は、次の 1 種類だけです。

- **宛先**: `review.rakuten.co.jp`
- **目的**: いま表示している商品の星の分布（星5〜星1 の件数）を読み取り、
  商品ページ上に表示するため
- **送信する情報**: ありません。ログイン情報を伴わない（`credentials: 'omit'`）
  読み取りのみです
- **タイミング**: 対象の商品ページを開いたときのみ

この通信で取得した内容は画面に表示するだけで、保存も送信もしません。

利用者の情報を、第三者に販売・提供することはありません。

### 権限について

| 権限 | 用途 |
|---|---|
| `storage` | 上記のオン・オフの状態を 1 つだけ保存するため |
| `item.rakuten.co.jp` ほか楽天市場のページ | ページの表示を組み替えるため |
| `review.rakuten.co.jp` | 星の分布を読み取るため |

### ソースコード

すべて公開しています。上記の内容はコードで確認できます。
https://github.com/KenTaniguchi-R/sukkiri

### お問い合わせ

https://github.com/KenTaniguchi-R/sukkiri/issues

### その他

この拡張機能は、楽天グループ株式会社とは関係のない、個人が作ったものです。

---

## English

### What is collected

**Nothing.**

This extension collects no information about its users. No personal data, no
browsing history, no search terms, no purchase data, no cookies, no device
information. There is no account, no analytics, no advertising and no tracking.

### What is stored on the device

Exactly one value, in the browser:

| Key | Meaning |
|---|---|
| `sukkiriEnabled` | Whether the user has the extension turned on or off (true / false) |

It exists only so the extension remembers the choice made with the toolbar
button. It is held in `chrome.storage.local`, never leaves the user's browser,
and is not visible to the developer.

### Network requests

The extension makes exactly one kind of request:

- **To**: `review.rakuten.co.jp`
- **Why**: to read the star-rating breakdown (the 5-star through 1-star counts)
  for the product currently being viewed, so it can be shown on the product page
- **What is sent**: nothing. It is a read made without credentials
  (`credentials: 'omit'`)
- **When**: only when the user opens that product's page

The result is displayed on screen. It is not stored and not transmitted anywhere.

No user data is ever sold or transferred to third parties.

### Permissions

| Permission | Used for |
|---|---|
| `storage` | Storing the single on/off value described above |
| Rakuten Ichiba page hosts | Rearranging the page the user is viewing |
| `review.rakuten.co.jp` | Reading the star-rating breakdown |

### Source code

Everything is public, and all of the above can be verified in the code:
https://github.com/KenTaniguchi-R/sukkiri

### Contact

https://github.com/KenTaniguchi-R/sukkiri/issues

### Note

This is an independent extension made by an individual. It is not affiliated
with, endorsed by, or connected to Rakuten Group, Inc.
