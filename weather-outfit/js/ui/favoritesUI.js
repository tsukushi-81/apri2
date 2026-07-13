// 「お気に入り登録・一覧・削除・再利用」機能のUI制御
// 保存処理は favorites.js（localStorageラッパー）に分離済み。
// 直近の提案内容は outfitFormUI.js から EVENT_OUTFIT_GENERATED イベントで受け取る。
// 一覧の再描画は favorites.js が発火する EVENT_FAVORITES_UPDATED を購読して行うため、
// timeOfDayUI.js など他のモジュールから保存された場合も自動で反映される。

import { CONDITION_LABELS } from "../outfitRules.js";
import { save as saveFavorite, findAll as findAllFavorites, remove as removeFavorite } from "../favorites.js";
import { EVENT_OUTFIT_GENERATED, EVENT_FAVORITES_UPDATED } from "../events.js";

export function initFavoritesUI() {
  const saveFavoriteBtn = document.getElementById("save-favorite-btn");
  const favoriteSaveStatus = document.getElementById("favorite-save-status");
  const favoritesEmpty = document.getElementById("favorites-empty");
  const favoritesList = document.getElementById("favorites-list");
  const favoritesReuseStatus = document.getElementById("favorites-reuse-status");

  // フォームへの再入力（再利用）で使う入力欄
  const temperatureInput = document.getElementById("temperature");
  const conditionSelect = document.getElementById("condition");
  const humidityInput = document.getElementById("humidity");
  const outfitFormSection = document.getElementById("form-heading");

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
        const periodBadge = item.periodLabel ? `<span class="favorite-item__badge">${item.periodLabel}</span> ` : "";
        return `
          <li class="favorite-item" data-id="${item.id}">
            <div class="favorite-item__body">
              <strong>${periodBadge}${item.summary}</strong>
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
            <div class="favorite-item__actions">
              <button type="button" class="favorite-item__reuse" data-id="${item.id}">この内容で再入力</button>
              <button type="button" class="favorite-item__delete" data-id="${item.id}">削除</button>
            </div>
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

  // お気に入りの保存・削除（自分自身の操作、または他のUIモジュールからの保存）を検知して再描画する
  document.addEventListener(EVENT_FAVORITES_UPDATED, renderFavorites);

  saveFavoriteBtn.addEventListener("click", () => {
    if (!currentEntry) return;
    saveFavorite(currentEntry);
    favoriteSaveStatus.textContent = "お気に入りに保存しました。";
    favoriteSaveStatus.classList.remove("status--error");
    favoriteSaveStatus.classList.add("status--success");
  });

  favoritesList.addEventListener("click", (event) => {
    const deleteTarget = event.target.closest(".favorite-item__delete");
    if (deleteTarget) {
      removeFavorite(deleteTarget.dataset.id);
      return;
    }

    const reuseTarget = event.target.closest(".favorite-item__reuse");
    if (reuseTarget) {
      const item = findAllFavorites().find((entry) => entry.id === reuseTarget.dataset.id);
      if (!item) return;

      temperatureInput.value = item.temperature;
      conditionSelect.value = item.condition;
      humidityInput.value = item.humidity;

      if (favoritesReuseStatus) {
        favoritesReuseStatus.textContent = "お気に入りの内容をフォームに反映しました。「服装を確認する」を押してください。";
        favoritesReuseStatus.classList.remove("status--error");
        favoritesReuseStatus.classList.add("status--success");
      }

      if (outfitFormSection) {
        outfitFormSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  });

  // 初期表示時に保存済みのお気に入りを読み込む
  renderFavorites();
}
