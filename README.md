# FesFolio Data

FesFolioで使用するイベントデータのリポジトリです。フェスやライブのタイムテーブル情報を管理しています。

## 📁 ディレクトリ構成

```
fesfolio-data/
├── events/           # イベントデータ（年ごとにディレクトリ分け）
│   ├── 2024/
│   │   ├── index.json (自動生成)
│   │   └── 2024-xx-xx_x_event.json
│   ├── 2025/
│   │   ├── index.json (自動生成)
│   │   └── 2025-xx-xx_x_event.json
│   └── index.json (自動生成)
├── schemas/          # JSONスキーマ定義
│   └── event.schema.json
├── sample/           # サンプルファイル
│   └── sample-event.json
└── .github/          # GitHub Actions設定
    ├── workflows/
    │   ├── validate_json.yml
    │   └── update_indices.yml
    └── PULL_REQUEST_TEMPLATE.md
```

## 🚀 イベントデータの追加方法

### 1. ファイル作成

`events/YYYY/` ディレクトリに以下の命名規則でJSONファイルを作成してください。

**ファイル名形式**: `YYYY-MM-DD_カテゴリ_スラッグ.json`

- `YYYY-MM-DD`: 開催日
- `カテゴリ`: `i`(アイドル), `r`(ロック), `e`(EDM), `o`(その他)
- `スラッグ`: イベント名を英数字とハイフンで表現

**例**: `2025-12-07_i_idol-koshien.json`

### 2. データ記述

[sample/sample-event.json](sample/sample-event.json) を参考に、以下の必須フィールドを含めてください。

#### イベント情報(必須)

| フィールド | 型 | 説明 |
|----------|-----|------|
| `event_id` | string | ファイル名（拡張子なし）と同じ (YYYY-MM-DD_カテゴリ_スラッグ) |
| `event_name` | string | イベント名 |
| `date` | string | 開催日（YYYY-MM-DD） |
| `venue` | string | 会場名 |
| `stages` | array | ステージ情報の配列 |
| `timetable` | array | タイムテーブルの配列 |

#### イベント情報(任意)

| フィールド | 型 | 説明 |
|----------|-----|------|
| `open_time` | string | 開場時刻（HH:MM） |
| `start_time` | string | 開演時刻（HH:MM） |
| `ticket_url` | string | チケットサイトURL |
| `description` | string | イベントの詳細説明 |
| `official_url` | string | 公式サイトURL |

#### ステージ情報

| フィールド | 型 | 説明 |
|----------|-----|------|
| `stage_id` | string | ステージID |
| `stage_name` | string | ステージ名 |
| `description` | string | ステージの説明（任意） |

#### タイムテーブル情報

| フィールド | 型 | 説明 |
|----------|-----|------|
| `stage_id` | string | ステージID（stagesで定義したものと一致） |
| `start` | string | 開始時刻 (形式: HH:MM) |
| `end` | string | 終了時刻 (形式: HH:MM) |
| `act` | string | 出演者・アクト名 |
| `type` | string | タイプ (live: ライブ, tokuten: 特典会, goods: 物販, other: その他)から選択 |
| `description` | string | 詳細説明（任意） |
| `emoji` | string | 絵文字（任意） |


### 3. プルリクエスト作成

1. このリポジトリをフォーク
2. 新しいブランチを作成: `git checkout -b add-event-YYYY-MM-DD`
3. ファイルを追加してコミット
4. プルリクエストを作成

プルリクエスト作成時、自動的にJSON構造の検証が実行されます。

## 🤖 自動処理

### インデックスファイルの自動更新

イベントJSONファイルがmainブランチにマージされると、GitHub Actionsが自動的に以下のファイルを生成・更新します:

- `events/index.json`: 利用可能な年のリスト
- `events/YYYY/index.json`: 各年のイベント一覧

**手動でインデックスファイルを編集する必要はありません。**

### バリデーション

プルリクエスト時に以下のチェックが自動実行されます:

- ✅ JSONスキーマに準拠しているか
- ✅ ファイル名が命名規則に従っているか
- ✅ 必須フィールドがすべて含まれているか
- ✅ 時刻フォーマットが正しいか（HH:MM）

## 📖 スキーマ詳細

詳細なスキーマ定義は [schemas/event.schema.json](schemas/event.schema.json) を参照してください。

## 🤝 コントリビューション

イベントデータの追加・修正は大歓迎です！以下のガイドラインに従ってください:

1. サンプルファイルを参考にする
2. 正確な情報を記載する
3. プルリクエストテンプレートのチェックリストを確認する
4. **インデックスファイル（`index.json`）は編集しない**（自動生成されます）

## 📝 ライセンス

このリポジトリのデータは、FesFolioアプリケーションでの使用を目的としています。

---

**質問や提案がある場合は、Issueを作成してください！**
