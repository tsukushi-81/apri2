// UIモジュール間で使う共通イベント名を1箇所にまとめる。
// これにより outfitFormUI.js と favoritesUI.js が互いのDOM要素を直接触らずに連携できる。

export const EVENT_OUTFIT_GENERATED = "outfit:generated";
