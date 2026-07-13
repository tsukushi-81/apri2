// 「お気に入り登録・一覧・削除・編集・再利用」機能のUI制御

import { CONDITION_LABELS } from "../outfitRules.js";
import { save as saveFavorite, findAll as findAllFavorites, remove as removeFavorite, update as updateFavorite } from "../favorites.js";
import { EVENT_OUTFIT_GENERATED, EVENT_FAVORITES_UPDATED } from "../events.js";

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildEditFormHTML(item) {
  const tipsText = (item.tips ?? []).join("\n");
  return `
    <div class="favorite-item-edit">
      <div class="favorite-item-edit__field">
        <label>気温（℃）</label>
        <input type="number" class="edit-temperature" step="0.1" min="-30" max="45" value="${escapeHtml(item.temperature)}" />
      </div>
      <div class="favorite-item-edit__field">
        <label>天気</label>
        <select class="edit-condition">
          <option value="sunny"${item.condition === "sunny" ? " selected" : ""}>晴れ</option>
          <option value="cloudy"${item.condition === "cloudy" ? " selected" : ""}>曇り</option>
          <option value="rainy"${item.condition === "rainy" ? " selected" : ""}>雨</option>
          <option value="snowy"${item.condition === "snowy" ? " selected" : ""}>雪</option>
        </select>
      </div>
      <div class="favorite-item-edit__field">
        <label>湿度（%）</label>
        <input type="number" class="edit-humidity" step="1" min="0" max="100" value="${escapeHtml(item.humidity)}" />
      </div>
      <div class="favorite-item-edit__field">
        <label>まとめ</label>
        <input type="text" class="edit-summary" value="${escapeHtml(item.summary)}" />
      </div>
      <div class="favorite-item-edit__field">
        <label>服装</label>
        <textarea class="edit-base-outfit" rows="2">${escapeHtml(item.baseOutfit)}</textarea>
      </div>
      <div class="favorite-item-edit__field">
        <label>ポイント（1行に1項目）</label>
        <textarea class="edit-tips" rows="3">${escapeHtml(tipsText)}</textarea>
      </div>
      <div class="favorite-item-edit__actions">
        <button type="button" class="btn btn--primary favorite-item__save" data-id="${item.id}">保存</button>
        <button type="button" class="btn favorite-item__cancel">キャンセル</button>
      </div>
    </div>
  `;
}

export function initFavoritesUI() {
  const saveFavoriteBtn = document.getElementById("save-favorite-btn");
  const favoriteSaveStatus = document.getElementById("favorite-save-status");
  const favoritesEmpty = document.getElementById("favorites-empty");
  const favoritesList = document.getElementById("favorites-list");
  const favoritesReuseStatus = document.getElementById("favorites-reuse-status");

  const temperatureInput = document.getElementById("temperature");
  const conditionSelect = document.getElementById("condition");
  const humidityInput = document.getElementById("humidity");
  const outfitFormSection = document.getElementById("form-heading");

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
              <button type="button" class="favorite-item__edit" data-id="${item.id}">編集</button>
              <button type="button" class="favorite-item__delete" data-id="${item.id}">削除</button>
            </div>
          </li>
        `;
      })
      .join("");
  }

  document.addEventListener(EVENT_OUTFIT_GENERATED, (event) => {
    currentEntry = event.detail;
    saveFavoriteBtn.disabled = false;
    favoriteSaveStatus.textContent = "";
    favoriteSaveStatus.classList.remove("status--error", "status--success");
  });

  document.addEventListener(EVENT_FAVORITES_UPDATED, renderFavorites);

  saveFavoriteBtn.addEventListener("click", () => {
    if (!currentEntry) return;
    saveFavoriteBtn.disabled = true;
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

    const editTarget = event.target.closest(".favorite-item__edit");
    if (editTarget) {
      const id = editTarget.dataset.id;
      const item = findAllFavorites().find((entry) => entry.id === id);
      if (!item) return;
      const li = editTarget.closest(".favorite-item");
      li.innerHTML = buildEditFormHTML(item);
      return;
    }

    const saveTarget = event.target.closest(".favorite-item__save");
    if (saveTarget) {
      const id = saveTarget.dataset.id;
      const li = saveTarget.closest(".favorite-item");
      const changes = {
        temperature: parseFloat(li.querySelector(".edit-temperature").value),
        condition: li.querySelector(".edit-condition").value,
        humidity: parseFloat(li.querySelector(".edit-humidity").value),
        summary: li.querySelector(".edit-summary").value.trim(),
        baseOutfit: li.querySelector(".edit-base-outfit").value.trim(),
        tips: li.querySelector(".edit-tips").value.split("\n").map((t) => t.trim()).filter(Boolean),
      };
      updateFavorite(id, changes);
      return;
    }

    const cancelTarget = event.target.closest(".favorite-item__cancel");
    if (cancelTarget) {
      renderFavorites();
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

  renderFavorites();
}
