// 「お気に入り登録・一覧・削除」機能のUI制御
// 保存処理は favorites.js（localStorageラッパー）に分離済み。
// 直近の提案内容は outfitFormUI.js から EVENT_OUTFIT_GENERATED イベントで受け取る。

import { CONDITION_LABELS } from "../outfitRules.js";
import { save as saveFavorite, findAll as findAllFavorites, remove as removeFavorite } from "../favorites.js";
import { EVENT_OUTFIT_GENERATED } from "../events.js";

export function initFavoritesUI() {
  const saveFavoriteBtn = document.getElementById("save-favorite-btn");
  const favoriteSaveStatus = document.getElementById("favorite-save-status");
  const favoritesEmpty = document.getElementById("favorites-empty");
  const favoritesList = document.getElementById("favorites-list");

  // 直近に生成された提案（お気に入り保存用に一時保持する）
  let currentEntry = null;

  function renderFavorites() {
    const items = findAllFavorites();

    if (items.length === 0) {
      favoritesEmpty.hidden = false;
      favoritesList.hidden = true;
      favoritesList.innerHTML = "";
      return;
    }

    favoritesEmpty.hidden = true;
    favoritesList.hidden = false;
    favoritesList.innerHTML = items
      .map((item) => {
        const conditionLabel = CONDITION_LABELS[item.condition] ?? item.condition;
        const savedAtLabel = new Date(item.savedAt).toLocaleString("ja-JP");
        return `
          <li class="favorite-item" data-id="${item.id}">
            <div class="favorite-item__body">
              <strong>${item.summary}</strong>
              <p>${item.baseOutfit}</p>
              ${
                item.tips && item.tips.length
                  ? `<ul>${item.tips.map((tip) => `<li>${tip}</li>`).join("")}</ul>`
                  : ""
              }
              <div class="favorite-item__meta">
                保存日時: ${savedAtLabel}（気温${item.temperature}℃・${conditionLabel}・湿度${item.humidity}%）
              </div>
            </div>
            <button type="button" class="favorite-item__delete" data-id="${item.id}">削除</button>
          </li>
        `;
      })
      .join("");
  }

  // 服装提案が新しく生成されたら、保存対象として保持する
  document.addEventListener(EVENT_OUTFIT_GENERATED, (event) => {
    currentEntry = event.detail;
    favoriteSaveStatus.textContent = "";
    favoriteSaveStatus.classList.remove("status--error", "status--success");
  });

  saveFavoriteBtn.addEventListener("click", () => {
    if (!currentEntry) return;
    saveFavorite(currentEntry);
    favoriteSaveStatus.textContent = "お気に入りに保存しました。";
    favoriteSaveStatus.classList.remove("status--error");
    favoriteSaveStatus.classList.add("status--success");
    renderFavorites();
  });

  favoritesList.addEventListener("click", (event) => {
    const target = event.target.closest(".favorite-item__delete");
    if (!target) return;
    removeFavorite(target.dataset.id);
    renderFavorites();
  });

  // 初期表示時に保存済みのお気に入りを読み込む
  renderFavorites();
}
