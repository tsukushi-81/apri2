// 画面制御（DOM操作・イベント処理）を担当するコントローラ
// ロジックは outfitRules.js / validation.js / geolocation.js に分離してあるため、
// このファイルは「つなぎ役」に徹する。

import { getCurrentLocation } from "./geolocation.js";
import { validateInputs } from "./validation.js";
import { generateRecommendation } from "./outfitRules.js";

// --- DOM要素の取得 ---
const locateBtn = document.getElementById("locate-btn");
const locationStatus = document.getElementById("location-status");
const locationResult = document.getElementById("location-result");

const form = document.getElementById("outfit-form");
const temperatureInput = document.getElementById("temperature");
const conditionSelect = document.getElementById("condition");
const humidityInput = document.getElementById("humidity");
const formError = document.getElementById("form-error");

const recommendationSection = document.getElementById("recommendation-section");
const recommendationOutput = document.getElementById("recommendation-output");

const fieldErrorEls = {
  temperature: document.getElementById("error-temperature"),
  condition: document.getElementById("error-condition"),
  humidity: document.getElementById("error-humidity"),
};

// --- 位置情報取得 ---
locateBtn.addEventListener("click", async () => {
  locateBtn.disabled = true;
  locationResult.hidden = true;
  locationStatus.textContent = "現在地を取得しています…";
  locationStatus.classList.remove("status--error", "status--success");

  try {
    const { latitude, longitude, accuracy } = await getCurrentLocation();
    locationStatus.textContent = "";
    locationResult.hidden = false;
    locationResult.innerHTML = `
      <strong>取得結果</strong><br />
      緯度: ${latitude.toFixed(6)}<br />
      経度: ${longitude.toFixed(6)}<br />
      精度: 約${Math.round(accuracy)}m
    `;
    locationStatus.classList.add("status--success");
  } catch (error) {
    locationResult.hidden = true;
    locationStatus.textContent = error.message;
    locationStatus.classList.add("status--error");
  } finally {
    locateBtn.disabled = false;
  }
});

// --- フィールドエラー表示のクリア/セット ---
function clearFieldErrors() {
  Object.values(fieldErrorEls).forEach((el) => {
    el.textContent = "";
  });
  [temperatureInput, conditionSelect, humidityInput].forEach((el) => {
    el.closest(".field").classList.remove("field--invalid");
  });
  formError.textContent = "";
}

function showFieldErrors(errors) {
  Object.entries(errors).forEach(([field, message]) => {
    if (fieldErrorEls[field]) {
      fieldErrorEls[field].textContent = message;
      fieldErrorEls[field].closest(".field").classList.add("field--invalid");
    }
  });
}

// --- 服装提案の表示 ---
function renderRecommendation({ baseOutfit, tips, summary }) {
  recommendationSection.hidden = false;
  recommendationOutput.innerHTML = `
    <h3>${summary}</h3>
    <p>${baseOutfit}</p>
    ${
      tips.length
        ? `<ul>${tips.map((tip) => `<li>${tip}</li>`).join("")}</ul>`
        : ""
    }
  `;
  recommendationSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// --- フォーム送信 ---
form.addEventListener("submit", (event) => {
  event.preventDefault();
  clearFieldErrors();
  recommendationSection.hidden = true;

  const raw = {
    temperature: temperatureInput.value.trim(),
    condition: conditionSelect.value,
    humidity: humidityInput.value.trim(),
  };

  const { valid, errors, values } = validateInputs(raw);

  if (!valid) {
    showFieldErrors(errors);
    formError.textContent = "入力内容をご確認ください。";
    return;
  }

  const recommendation = generateRecommendation(values);
  renderRecommendation(recommendation);
});
