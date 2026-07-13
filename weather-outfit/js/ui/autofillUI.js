// 「現在地の天気を自動取得してフォームに反映する」機能のUI制御
// 位置情報取得は geolocation.js、天気取得は weatherApi.js に委譲し、
// このファイルはDOM操作（フォーム項目への値の反映）のみを担当する。

import { getCurrentLocation } from "../geolocation.js";
import { fetchCurrentWeather } from "../weatherApi.js";
import { CONDITION_LABELS } from "../outfitRules.js";

export function initAutoFillUI() {
  const autoFillBtn = document.getElementById("auto-fill-btn");
  const autoFillStatus = document.getElementById("auto-fill-status");

  if (!autoFillBtn || !autoFillStatus) return;

  const temperatureInput = document.getElementById("temperature");
  const conditionSelect = document.getElementById("condition");
  const humidityInput = document.getElementById("humidity");

  function setStatus(message, variant) {
    autoFillStatus.textContent = message;
    autoFillStatus.classList.remove("status--error", "status--success");
    if (variant) {
      autoFillStatus.classList.add(`status--${variant}`);
    }
  }

  autoFillBtn.addEventListener("click", async () => {
    autoFillBtn.disabled = true;
    setStatus("現在地を取得しています…");

    try {
      const location = await getCurrentLocation();

      setStatus("天気情報を取得しています…");
      const weather = await fetchCurrentWeather(location);

      // 入力欄のstep（気温:0.1 / 湿度:1）に合わせて丸める
      const roundedTemperature = Math.round(weather.temperature * 10) / 10;
      const roundedHumidity = Math.round(weather.humidity);

      temperatureInput.value = roundedTemperature;
      conditionSelect.value = weather.condition;
      humidityInput.value = roundedHumidity;

      const conditionLabel = CONDITION_LABELS[weather.condition] ?? weather.condition;
      setStatus(
        `現在地の天気を反映しました（気温${roundedTemperature}℃・${conditionLabel}・湿度${roundedHumidity}%）。内容を確認して「服装を確認する」を押してください。`,
        "success"
      );
    } catch (error) {
      setStatus(error.message, "error");
    } finally {
      autoFillBtn.disabled = false;
    }
  });
}
