// 「気温・天気・湿度の入力 → 服装提案の表示」機能のUI制御
// バリデーションは validation.js、提案ロジックは outfitRules.js に分離済み。
// 生成した提案は EVENT_OUTFIT_GENERATED イベントで他の機能（お気に入り）に伝える。

import { validateInputs } from "../validation.js";
import { generateRecommendation } from "../outfitRules.js";
import { EVENT_OUTFIT_GENERATED } from "../events.js";

export function initOutfitFormUI() {
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

    // お気に入り機能など、他のUIモジュールに「提案ができた」ことを知らせる
    document.dispatchEvent(
      new CustomEvent(EVENT_OUTFIT_GENERATED, {
        detail: { ...values, ...recommendation },
      })
    );
  });
}
