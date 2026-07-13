// お気に入り（保存した服装提案）のリポジトリ
// localStorage をラップし、UI側（app.js）はこのファイルのAPIだけを使う。
// 要件定義書「セキュリティ」要求: データはlocalStorageにのみ保存し、外部送信しない。

import { EVENT_FAVORITES_UPDATED } from "./events.js";

const STORAGE_KEY = "weather-outfit:favorites";

function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `fav-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error("お気に入りの読み込みに失敗しました", error);
    return [];
  }
}

function writeAll(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  // 保存元のUIモジュールを問わず、一覧表示側（favoritesUI.js）が再描画できるように通知する
  document.dispatchEvent(new CustomEvent(EVENT_FAVORITES_UPDATED));
}

/**
 * その時の状況（気温・天気・湿度）と服装提案をまとめて1件保存する
 * @param {{temperature:number, condition:string, humidity:number, summary:string, baseOutfit:string, tips:string[], periodLabel?:string}} entry
 * @returns {object} 保存したレコード（id・savedAt付き）
 */
export function save(entry) {
  const items = readAll();
  const record = {
    id: generateId(),
    savedAt: new Date().toISOString(),
    ...entry,
  };
  items.unshift(record); // 新しいものを先頭に表示する
  writeAll(items);
  return record;
}

/** 保存済みのお気に入りを新しい順に全件取得する */
export function findAll() {
  return readAll();
}

/** 指定IDのお気に入りを削除する */
export function remove(id) {
  const items = readAll().filter((item) => item.id !== id);
  writeAll(items);
}
