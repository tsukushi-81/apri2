// UIモジュール間で使う共通イベント名を1箇所にまとめる。
// これにより各UIモジュールが互いのDOM要素や内部状態を直接触らずに連携できる。

export const EVENT_OUTFIT_GENERATED = "outfit:generated";

// お気に入りが追加・削除されたときに favorites.js から発火するイベント。
// favoritesUI.js はこのイベントを購読して一覧を再描画するだけでよく、
// timeOfDayUI.js など他のモジュールから保存された場合でも一覧が自動更新される。
export const EVENT_FAVORITES_UPDATED = "favorites:updated";
