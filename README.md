# 天候と服装のシステム

> 天気・気温・湿度をもとに、その日に適した服装を提案するReact PWA（Progressive Web App）の要件定義ドキュメント

---

## 目次

1. [プロジェクト概要](#1-プロジェクト概要)
2. [技術スタック](#2-技術スタック)
3. [機能一覧](#3-機能一覧)
4. [機能要求・非機能要求](#4-機能要求非機能要求)
5. [ユースケース](#5-ユースケース)
6. [クラス設計](#6-クラス設計)
7. [シーケンス図](#7-シーケンス図)
8. [状態遷移図](#8-状態遷移図)
9. [使用プラットフォーム](#9-使用プラットフォーム)

---

## 1. プロジェクト概要

### アプリ名
天候と服装のシステム

### 目的
天気・気温・湿度をもとに、その日に適した服装をユーザーに提案するReact PWA（Progressive Web App）を開発する。朝・昼・夜の時間帯別に提案を行い、ユーザーが気に入った服装をメモとしてブラウザのローカルストレージに保存できる。Service Workerによるオフライン対応とホーム画面へのインストール（Add to Home Screen）に対応する。

### 作らないもの（非目標）
- 服装のコーディネート画像表示・ブランド推薦
- 週間予報・降水確率の表示
- 手動での都市名検索・時間帯のカスタマイズ
- 複数デバイス間のデータ同期・クラウド保存
- ユーザー認証

---

## 2. 技術スタック

| 項目 | 内容 |
|------|------|
| フレームワーク | React（JavaScript / TypeScript） |
| PWA対応 | Vite PWA Plugin または Create React App（Workbox） |
| 対応プラットフォーム | モダンブラウザ（Chrome / Firefox / Safari / Edge）+ ホーム画面インストール |
| 天気データAPI | [Open-Meteo](https://open-meteo.com/)（APIキー不要・完全無料） |
| ローカル保存 | localStorage（Web Storage API） |
| オフラインキャッシュ | Service Worker + Cache API（Workbox） |
| バックエンド | なし（クライアントサイドのみ） |
| 位置情報取得 | Geolocation API（ブラウザ標準） |

### PWA必須ファイル

| ファイル | 役割 |
|----------|------|
| `manifest.json` | アプリ名・アイコン・テーマカラー・表示モードを定義 |
| `service-worker.js` | リソースのキャッシュ戦略・オフライン対応を実装 |
| アイコン画像 | 192×192px / 512×512px の PNG（インストール時に使用） |

### Workbox キャッシュ戦略

| 対象 | 戦略 | 理由 |
|------|------|------|
| HTML / JS / CSS | Cache First | 静的リソースは変化が少ない |
| Open-Meteo API | Network First（5分TTL） | 天気データは鮮度が重要 |
| アイコン・画像 | Cache First | 変化しないため積極的にキャッシュ |

### Open-Meteo APIエンドポイント例

```
GET https://api.open-meteo.com/v1/forecast
  ?latitude={lat}
  &longitude={lng}
  &hourly=temperature_2m,relativehumidity_2m,weathercode
```

---

## 3. 機能一覧

### コア機能（優先度：高）

| 機能名 | 概要 |
|--------|------|
| 天気データ取得 | Open-Meteo APIから気温・湿度・天気状態を取得する |
| 服装レコメンド表示 | 気象データをルールベースで判定し服装を提案する |
| 時間帯別提案（朝・昼・夜） | 3時間予報から朝昼夜ごとに服装を提示する |

### サポート機能（優先度：中）

| 機能名 | 概要 |
|--------|------|
| お気に入り登録 | ユーザーが任意のテキストを服装メモとして保存する |
| お気に入り一覧・削除 | 保存済みメモを一覧表示し個別に削除できる |
| オフライン時キャッシュ表示 | Service Workerが直前の天気データをキャッシュし、オフライン時も表示する |
| ローカルデータ永続化 | localStorage でブラウザ内に保存する |
| ホーム画面インストール | manifest.jsonによりAdd to Home Screenを促すバナーを表示する |

### 共通機能

| 機能名 | 優先度 | 概要 |
|--------|--------|------|
| 位置情報取得（Geolocation API） | 高 | ブラウザのGeolocation APIで現在地の緯度・経度を取得する |
| Service Worker登録 | 高 | Workboxでキャッシュ戦略を実装しオフライン対応する |
| Web App Manifest | 高 | アプリ名・アイコン・テーマカラーを定義しインストール可能にする |
| ページナビゲーション | 中 | 画面間の遷移（React Router 等） |
| インストールバナー | 中 | beforeinstallpromptイベントでAdd to Home Screenを促す |
| ローディング表示 | 低 | API通信中のスピナー・スケルトン |
| ファビコン・OGP設定 | 低 | ブラウザタブのアイコンとSNSシェア時のメタ情報 |

---

## 4. 機能要求・非機能要求

### 機能要求

システムが「何をするか」を定義する。

| 機能名 | 内容 | 分類 |
|--------|------|------|
| 天気データ取得 | Open-Meteo APIから気温・湿度・天気状態を取得する | コア |
| 位置情報取得 | ブラウザのGeolocation APIで現在地の緯度・経度を取得する | コア |
| 服装レコメンド表示 | 気象データをルールベースで判定し服装を提案する | コア |
| 時間帯別提案 | 朝・昼・夜それぞれに異なる服装提案を表示する | コア |
| お気に入り登録 | ユーザーが任意のテキストを服装メモとして保存する | サポート |
| お気に入り一覧・削除 | 保存済みメモを一覧表示し個別に削除できる | サポート |
| オフライン時キャッシュ表示 | Service Workerが直前の天気データを返し画面を表示する | サポート |
| ホーム画面インストール | manifest.jsonとbeforeinstallpromptでインストールを促す | サポート |

### 非機能要求

システムが「どのように動くか」を定義する。

#### 性能

| 要求 | 基準・根拠 |
|------|-----------|
| ページ表示から天気表示まで3秒以内 | Open-Meteo応答速度 + Geolocation取得の合計を考慮 |
| お気に入りの読み込みは即時（500ms以内） | localStorageはI/O待ちなしで読み込める |

#### セキュリティ

| 要求 | 基準・根拠 |
|------|-----------|
| 位置情報はOpen-Meteo以外に送信しない | APIへの送信は緯度経度のみ・匿名 |
| お気に入りデータはlocalStorageにのみ保存 | クラウド送信・外部共有なし |
| 位置情報取得はブラウザの許可ダイアログを通じて行う | Geolocation APIの仕様に準拠（HTTPS必須） |
| 本番環境はHTTPS必須 | Geolocation API・Service Workerの両方がHTTPS環境でのみ動作する |
| Service Workerのスコープを `/` に限定する | 意図しないリソースへのインターセプトを防ぐ |

#### ユーザビリティ

| 要求 | 基準・根拠 |
|------|-----------|
| 主要操作は3クリック以内で完結する | 起動→天気確認、起動→お気に入り登録の両導線 |
| エラー・ローディング状態を必ず画面上に示す | 通信中スピナー、オフライン時メッセージ表示 |
| PC・スマホブラウザ両方でレスポンシブ対応する | CSSメディアクエリまたはTailwind CSSを活用 |

#### 保守性

| 要求 | 基準・根拠 |
|------|-----------|
| 服装提案ロジックを独立したファイルに分離する | ルール変更時にUIコンポーネントを触らなくてよい構造 |
| APIのエンドポイントや閾値は定数として一元管理 | 変更箇所を1ファイルに集約し修正コストを下げる |
| ReactのコンポーネントをAtomicDesign等で分割する | 再利用性と可読性の確保。テスト容易性にも寄与 |
| Service Workerのキャッシュバージョンを定数で管理する | デプロイ時にキャッシュを確実に更新できる構造 |

---

## 5. ユースケース

アクターは3つ定義している。「ユーザー」が主アクター、「ブラウザGeolocation」と「Open-Meteo API」が外部システムとしての副アクターとなる。PWA対応によりオフライン時はService Workerがキャッシュを返すため、UC8はエラーではなくキャッシュ表示に変わる。

```mermaid
flowchart LR
  User(["ユーザー"])
  GPS(["ブラウザ Geolocation API"])
  API(["Open-Meteo API"])
  SW(["Service Worker"])

  subgraph SYS ["天候と服装のシステム（PWA）"]
    UC1["天気・気温・湿度を確認する"]
    UC2["服装レコメンドを見る"]
    UC3["時間帯別の服装提案を見る"]
    UC4["お気に入り服装を登録する"]
    UC5["お気に入り一覧を管理する"]
    UC6["位置情報を取得する"]
    UC7["天気データを取得する"]
    UC8["キャッシュデータを返す（オフライン時）"]
    UC9["ホーム画面にインストールする"]
  end

  User -->|uses| UC1
  User -->|uses| UC2
  User -->|uses| UC3
  User -->|uses| UC4
  User -->|uses| UC5
  User -->|uses| UC9

  UC1 -->|«include»| UC6
  UC1 -->|«include»| UC7
  UC2 -->|«include»| UC1
  UC3 -->|«include»| UC1
  UC7 -.->|«extend» オフライン時| UC8

  UC6 --- GPS
  UC7 --- API
  UC8 --- SW
```

### 矢印の読み方

- **実線 `«include»`** — 必ず呼び出される関係（服装提案は必ず天気確認を内包）
- **点線 `«extend»`** — 条件付きで発生する関係（オフライン時のみエラー表示が起動）

---

## 6. クラス設計

> Web版ではDartの型をJavaScript/TypeScriptの型に読み替える。`LocalStorage` クラスはブラウザの `window.localStorage` をラップした実装となる。PWA対応として `ServiceWorkerManager` と `InstallPromptManager` を追加している。

```mermaid
classDiagram
  class Location {
    +number latitude
    +number longitude
    +string cityName
    +Date fetchedAt
    +getCurrentLocation() Promise~Location~
    +isValid() boolean
  }

  class WeatherData {
    +number temperature
    +number humidity
    +string condition
    +Date observedAt
    +HourlyForecast[] hourlyForecasts
    +isStale() boolean
    +isCached() boolean
  }

  class HourlyForecast {
    +string time
    +number temperature
    +number humidity
    +string condition
  }

  class OutfitRecommendation {
    +string morningOutfit
    +string afternoonOutfit
    +string eveningOutfit
    +Date generatedAt
    +getSummary() string
  }

  class OutfitRule {
    +number tempMin
    +number tempMax
    +number humidityMax
    +string condition
    +string suggestion
    +matches(temp number, humidity number, cond string) boolean
  }

  class RecommendationEngine {
    +OutfitRule[] rules
    +generate(weather WeatherData) OutfitRecommendation
    +selectRule(temp number, humidity number, cond string) OutfitRule
  }

  class FavoriteOutfit {
    +string id
    +string memo
    +Date savedAt
    +update(memo string) void
  }

  class FavoriteRepository {
    +save(item FavoriteOutfit) void
    +findAll() FavoriteOutfit[]
    +delete(id string) void
    +findById(id string) FavoriteOutfit
  }

  class WeatherRepository {
    +fetchWeather(loc Location) Promise~WeatherData~
    +getCached() WeatherData
    +clearCache() void
  }

  class WeatherService {
    +baseUrl: string
    +get(lat number, lng number) Promise~WeatherData~
  }

  class LocalStorage {
    +set(key string, value string) void
    +get(key string) string
    +remove(key string) void
  }

  class ServiceWorkerManager {
    +swPath: string
    +cacheVersion: string
    +register() Promise~void~
    +unregister() Promise~void~
    +onUpdateFound(callback Function) void
  }

  class InstallPromptManager {
    +deferredPrompt: BeforeInstallPromptEvent
    +isInstallable() boolean
    +showPrompt() Promise~void~
    +onInstalled(callback Function) void
  }

  WeatherData        "1"   *-- "1..*" HourlyForecast      : contains
  RecommendationEngine "1" o-- "1..*" OutfitRule           : holds
  RecommendationEngine "1" --> "1"    WeatherData          : uses
  RecommendationEngine "1" --> "1"    OutfitRecommendation : creates
  WeatherRepository  "1"   --> "1"    WeatherService       : calls
  WeatherRepository  "1"   --> "1"    Location             : uses
  WeatherRepository  "1"   --> "1"    WeatherData          : returns
  FavoriteRepository "1"   --> "1..*" FavoriteOutfit       : manages
  FavoriteRepository "1"   --> "1"    LocalStorage         : uses
```

### 関連の種類

| 記法 | 種類 | 説明 |
|------|------|------|
| `*--` | コンポジション | WeatherDataが消えるとHourlyForecastも消える強い所有 |
| `o--` | 集約 | OutfitRuleはEngineとは独立して差し替え可能 |
| `-->` | 依存 | 「使う」関係。実装を差し替えても影響が少ない |

---

## 7. シーケンス図

### UC1：天気取得・服装提案

```mermaid
sequenceDiagram
  autonumber
  actor User as ユーザー
  participant UI as ホーム画面
  participant SW as Service Worker
  participant Ctrl as WeatherController
  participant Repo as WeatherRepository
  participant API as Open-Meteo API
  participant Eng as RecommendationEngine

  User->>UI: ページを開く
  UI->>SW: リソースリクエスト
  SW-->>UI: キャッシュ済みHTML/JS/CSSを返す
  UI->>Ctrl: useEffect / onMount()
  Ctrl->>Repo: getCurrentLocation()
  alt 位置情報の権限なし
    Repo-->>Ctrl: GeolocationPermissionDenied
    Ctrl-->>UI: showPermissionDialog()
    UI-->>User: ブラウザの位置情報許可を求める
    User->>UI: 許可する
    UI->>Ctrl: retryWithPermission()
  end
  Repo-->>Ctrl: Location
  alt キャッシュが有効（5分以内）
    Ctrl->>Repo: getCached()
    Repo-->>Ctrl: WeatherData
  else オンライン・キャッシュ期限切れ
    Ctrl->>Repo: fetchWeather(Location)
    Repo->>SW: fetch(/forecast?lat&lng)
    alt オンライン
      SW->>API: GET /forecast?lat&lng&hourly
      API-->>SW: JSON（3時間ごと予報）
      SW->>SW: Cache APIに保存（TTL:5分）
      SW-->>Repo: WeatherData
    else オフライン
      SW-->>Repo: キャッシュ済みWeatherData（stale表示付き）
    end
    Repo-->>Ctrl: WeatherData
  end
  Ctrl->>Eng: generate(WeatherData)
  loop 朝・昼・夜の各時間帯
    Eng->>Eng: selectRule(temp, humidity, condition)
  end
  Eng-->>Ctrl: OutfitRecommendation
  Ctrl-->>UI: setState(WeatherData, OutfitRecommendation)
  UI-->>User: 天気＋時間帯別服装を表示
```

### UC4：お気に入り登録

```mermaid
sequenceDiagram
  autonumber
  actor User as ユーザー
  participant UI as お気に入り登録画面
  participant Ctrl as FavoriteController
  participant Repo as FavoriteRepository
  participant DB as localStorage

  User->>UI: 「お気に入りに追加」をクリック
  UI-->>User: テキスト入力モーダルを表示
  User->>UI: 服装メモを入力して保存
  UI->>Ctrl: onSave(memo)
  alt メモが空
    Ctrl-->>UI: showValidationError()
    UI-->>User: 「メモを入力してください」
  else 入力あり
    Ctrl->>Repo: save(FavoriteOutfit)
    Repo->>DB: localStorage.setItem(id, JSON)
    DB-->>Repo: 保存完了
    Repo-->>Ctrl: success
    Ctrl-->>UI: showSuccessToast()
    UI-->>User: 「保存しました」トースト表示
  end
```

### UC5：お気に入り管理

```mermaid
sequenceDiagram
  autonumber
  actor User as ユーザー
  participant UI as お気に入り一覧画面
  participant Ctrl as FavoriteController
  participant Repo as FavoriteRepository
  participant DB as localStorage

  User->>UI: お気に入りページを開く
  UI->>Ctrl: useEffect / onMount()
  Ctrl->>Repo: findAll()
  Repo->>DB: localStorage.getItem(favorites)
  DB-->>Repo: 保存済みデータ
  alt データなし
    Repo-->>Ctrl: 空配列
    Ctrl-->>UI: showEmptyState()
    UI-->>User: 「まだ登録がありません」
  else データあり
    Repo-->>Ctrl: FavoriteOutfit[]
    Ctrl-->>UI: setState(list)
    UI-->>User: お気に入り一覧を表示
  end
  User->>UI: 削除ボタンをクリック
  UI->>Ctrl: onDelete(id)
  Ctrl->>Repo: delete(id)
  Repo->>DB: localStorage.removeItem(id)
  DB-->>Repo: 削除完了
  Repo-->>Ctrl: success
  Ctrl->>Repo: findAll()
  Repo->>DB: localStorage.getItem(favorites)
  DB-->>Repo: 更新済みデータ
  Repo-->>Ctrl: FavoriteOutfit[]
  Ctrl-->>UI: setState(updatedList)
  UI-->>User: 一覧を更新して表示
```

---

## 8. 状態遷移図

### アプリ全体

```mermaid
stateDiagram-v2
  [*] --> Launching : ページ読み込み

  state Launching {
    [*] --> CheckingPermission : 初期化開始
    CheckingPermission --> PermissionGranted : 位置情報が許可済み
    CheckingPermission --> PermissionDenied : 権限なし
    PermissionDenied --> PermissionGranted : ユーザーがブラウザ許可
    PermissionDenied --> [*] : ユーザーが拒否
    PermissionGranted --> [*] : 起動処理完了
  }

  Launching --> LoadingWeather : 権限取得完了
  Launching --> PermissionError : 権限を拒否

  state LoadingWeather {
    [*] --> FetchingLocation : Geolocation取得開始
    FetchingLocation --> FetchingAPI : 位置情報取得成功
    FetchingLocation --> LocationError : Geolocation取得失敗
    FetchingAPI --> WeatherLoaded : APIレスポンス受信
    FetchingAPI --> NetworkError : 通信エラー
    WeatherLoaded --> [*]
    LocationError --> [*]
    NetworkError --> [*]
  }

  LoadingWeather --> HomeReady : 天気・服装提案の表示完了
  LoadingWeather --> HomeReadyCached : オフライン・キャッシュあり
  LoadingWeather --> LocationError : Geolocation取得失敗

  HomeReady --> LoadingWeather : 更新ボタンクリック / 5分経過
  HomeReadyCached --> LoadingWeather : オンライン復帰 → 再取得
  HomeReady --> FavoriteFlow : お気に入りタブをクリック
  HomeReadyCached --> FavoriteFlow : お気に入りタブをクリック

  state FavoriteFlow {
    [*] --> FavoriteList : 一覧読み込み
    FavoriteList --> AddingFavorite : 追加ボタンクリック
    AddingFavorite --> Validating : 保存ボタンクリック
    Validating --> FavoriteList : 保存成功
    Validating --> AddingFavorite : バリデーションエラー
    FavoriteList --> DeletingFavorite : 削除ボタンクリック
    DeletingFavorite --> FavoriteList : 削除完了
    FavoriteList --> [*]
  }

  FavoriteFlow --> HomeReady : ホームタブをクリック
  PermissionError --> [*] : ページを閉じる
  HomeReady --> [*] : ページを閉じる
  HomeReadyCached --> [*] : ページを閉じる
```

### 天気データ（WeatherData）

```mermaid
stateDiagram-v2
  [*] --> Absent : ページ初回読み込み

  Absent --> Fetching : fetchWeather()呼び出し

  state Fetching {
    [*] --> ResolvingLocation : Geolocation取得中
    ResolvingLocation --> CallingAPI : 位置情報取得成功
    ResolvingLocation --> LocationFailed : Geolocation取得失敗
    CallingAPI --> Parsing : HTTPレスポンス200
    CallingAPI --> NetworkFailed : 通信エラー / タイムアウト
    Parsing --> [*] : パース完了
    LocationFailed --> [*]
    NetworkFailed --> [*]
  }

  Fetching --> Fresh : データ取得・キャッシュ保存成功（Service Worker）
  Fetching --> Cached : オフライン・Service Workerキャッシュあり
  Fetching --> Error : オフライン・キャッシュなし

  Fresh --> Fresh : キャッシュ参照（5分以内）
  Fresh --> Stale : 5分経過
  Fresh --> Fetching : 手動更新

  Cached --> Fetching : オンライン復帰
  Cached --> Stale : 5分経過

  Stale --> Fetching : fetchWeather()呼び出し
  Stale --> Stale : キャッシュ参照（期限切れ表示付き）

  Error --> Fetching : 再試行
  Error --> Absent : キャッシュクリア

  note right of Fresh : isStale() = false / SW Cache有効
  note right of Cached : isCached() = true / オフライン表示
  note right of Stale : isStale() = true / 再取得が必要
```

### お気に入り（FavoriteOutfit）

```mermaid
stateDiagram-v2
  [*] --> Idle : お気に入りページを開く

  Idle --> Loading : findAll()呼び出し

  state Loading {
    [*] --> ReadingStorage : localStorage読み込み中
    ReadingStorage --> [*] : 読み込み完了
  }

  Loading --> Empty : データ件数 = 0
  Loading --> Listed : データ件数 ≥ 1

  Empty --> Adding : 追加ボタンクリック
  Listed --> Adding : 追加ボタンクリック
  Listed --> Deleting : 削除ボタンクリック

  state Adding {
    [*] --> ModalOpen : モーダル表示
    ModalOpen --> Validating : 保存ボタンクリック
    Validating --> Saving : 入力あり（バリデーション通過）
    Validating --> ModalOpen : 入力なし（バリデーションエラー）
    Saving --> [*] : localStorage.setItem()完了
    ModalOpen --> [*] : キャンセル
  }

  state Deleting {
    [*] --> ConfirmingDelete : 削除確認ダイアログ表示
    ConfirmingDelete --> Removing : 削除を確定
    ConfirmingDelete --> [*] : キャンセル
    Removing --> [*] : localStorage.removeItem()完了
  }

  Adding --> Loading : 保存完了 → 再読み込み
  Adding --> Listed : キャンセル
  Deleting --> Loading : 削除完了 → 再読み込み
  Deleting --> Listed : キャンセル

  Empty --> [*] : ページを離れる
  Listed --> [*] : ページを離れる
```

---

## 9. 使用プラットフォーム

本ドキュメントの要件定義作業はすべて以下のツールのみで完結した。

| ツール | 用途 |
|--------|------|
| [Claude（claude.ai）](https://claude.ai) | ヒアリング・要件整理・全図の生成 |
| [Mermaid.js](https://mermaid.js.org/) | ユースケース図・クラス図・シーケンス図・状態遷移図のレンダリング |

外部ツールへのアクセスやファイルエクスポートは一切行っておらず、すべてブラウザ内で完結している。

---

*このドキュメントはClaude（claude.ai）を使用して生成された要件定義ドキュメントです。*
