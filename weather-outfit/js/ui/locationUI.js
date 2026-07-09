// 「位置情報の観測」機能のUI制御
// ロジック本体は geolocation.js にあり、ここはDOM操作だけを担当する。

import { getCurrentLocation } from "../geolocation.js";

export function initLocationUI() {
  const locateBtn = document.getElementById("locate-btn");
  const locationStatus = document.getElementById("location-status");
  const locationResult = document.getElementById("location-result");

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
}
