// 「朝・昼・夜の服装提案」機能のUI制御
// 位置情報取得は geolocation.js、時間帯別の天気取得は weatherApi.js、
// 服装提案ロジックは outfitRules.js、保存は favorites.js に委譲する。
// このファイルはDOM描画とイベント配線のみを担当する。

import { getCurrentLocation } from "../geolocation.js";
import { fetchTimeOfDayForecast, TIME_OF_DAY_LABELS } from "../weatherApi.js";
import { generateRecommendation, CONDITION_LABELS } from "../outfitRules.js";
import { save as saveFavorite } from "../favorites.js";

const PERIOD_ORDER = ["morning", "afternoon", "evening"];

export function initTimeOfDayUI() {
  const btn = document.getElementById("time-of-day-btn");
  const status = document.getElementById("time-of-day-status");
  const resultContainer = document.getElementById("time-of-day-result");

  if (!btn || !status || !resultContainer) return;

  // 直近に生成した時間帯別の提案（お気に入り保存用に一時保持する。キーは "morning"|"afternoon"|"evening"）
  let currentByPeriod = {};

  function setStatus(message, variant) {
    status.textContent = message;
    status.classList.remove("status--error", "status--success");
    if (variant) {
      status.classList.add(`status--${variant}`);
    }
  }

  function renderCards(byPeriod) {
    currentByPeriod = {};
    resultContainer.hidden = false;
    resultContainer.innerHTML = PERIOD_ORDER.map((period) => {
      const weather = byPeriod[period];
      const recommendation = generateRecommendation(weather);
      currentByPeriod[period] = { ...weather, ...recommendation };

      const conditionLabel = CONDITION_LABELS[weather.condition] ?? weather.condition;
      const periodLabel = TIME_OF_DAY_LABELS[period];

      return `
        <div class="time-of-day-card" data-period="${period}">
          <h3>${periodLabel}</h3>
          <p class="time-of-day-card__meta">気温${weather.temperature}℃・${conditionLabel}・湿度${weather.humidity}%</p>
          <p>${recommendation.baseOutfit}</p>
          ${
            recommendation.tips.length
              ? `<ul>${recommendation.tips.map((tip) => `<li>${tip}</li>`).join("")}</ul>`
              : ""
          }
          <button type="button" class="btn time-of-day-card__save" data-period="${period}">お気に入りに追加</button>
        </div>
      `;
    }).join("");
  }

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    resultContainer.hidden = true;
    setStatus("現在地を取得しています…");

    try {
      const location = await getCurrentLocation();

      setStatus("朝・昼・夜の天気を取得しています…");
      const byPeriod = await fetchTimeOfDayForecast(location);

      renderCards(byPeriod);
      setStatus("朝・昼・夜の服装提案を表示しました。", "success");
    } catch (error) {
      setStatus(error.message, "error");
    } finally {
      btn.disabled = false;
    }
  });

  resultContainer.addEventListener("click", (event) => {
    const target = event.target.closest(".time-of-day-card__save");
    if (!target) return;

    const period = target.dataset.period;
    const entry = currentByPeriod[period];
    if (!entry) return;

    saveFavorite({ ...entry, periodLabel: TIME_OF_DAY_LABELS[period] });
    target.textContent = "追加しました";
    target.disabled = true;
  });
}
