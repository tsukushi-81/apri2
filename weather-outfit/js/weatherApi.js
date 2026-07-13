// Open-Meteo APIから天気情報を取得するモジュール
// 要件定義書「セキュリティ」要求: 送信するのは緯度経度のみで、それ以外の個人情報は送信しない。
// APIキー不要・無料で利用できるOpen-Meteo（https://open-meteo.com/）を使用する。

const BASE_URL = "https://api.open-meteo.com/v1/forecast";

// 朝・昼・夜それぞれの代表時刻（24時間表記）
export const TIME_OF_DAY_HOURS = { morning: 8, afternoon: 14, evening: 20 };

// 時間帯の日本語ラベル（UI側からも参照する）
export const TIME_OF_DAY_LABELS = { morning: "朝", afternoon: "昼", evening: "夜" };

// Open-MeteoのWMO weather_codeを、本アプリの天気区分（sunny/cloudy/rainy/snowy）にマッピングする
// 参考: https://open-meteo.com/en/docs （WMO Weather interpretation codes）
const WEATHER_CODE_MAP = {
  0: "sunny", // 快晴
  1: "sunny", // 主に晴れ
  2: "cloudy", // 部分的に曇り
  3: "cloudy", // 曇り
  45: "cloudy", // 霧
  48: "cloudy", // 霧氷を伴う霧
  51: "rainy", // 弱い霧雨
  53: "rainy", // 霧雨
  55: "rainy", // 強い霧雨
  56: "rainy", // 弱い着氷性の霧雨
  57: "rainy", // 着氷性の霧雨
  61: "rainy", // 弱い雨
  63: "rainy", // 雨
  65: "rainy", // 強い雨
  66: "rainy", // 弱い着氷性の雨
  67: "rainy", // 着氷性の雨
  71: "snowy", // 弱い雪
  73: "snowy", // 雪
  75: "snowy", // 強い雪
  77: "snowy", // 雪粒
  80: "rainy", // 弱いにわか雨
  81: "rainy", // にわか雨
  82: "rainy", // 激しいにわか雨
  85: "snowy", // 弱いにわか雪
  86: "snowy", // 激しいにわか雪
  95: "rainy", // 雷雨
  96: "rainy", // 雹を伴う雷雨
  99: "rainy", // 激しい雹を伴う雷雨
};

/**
 * Open-MeteoのWMO weather_codeを本アプリの天気区分に変換する
 * 未知のコードの場合は "cloudy" にフォールバックする
 * @param {number} code
 * @returns {"sunny"|"cloudy"|"rainy"|"snowy"}
 */
export function mapWeatherCode(code) {
  return WEATHER_CODE_MAP[code] ?? "cloudy";
}

async function requestForecast(params) {
  const url = new URL(BASE_URL);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  let response;
  try {
    response = await fetch(url);
  } catch (error) {
    throw new Error("天気情報の取得に失敗しました。通信環境をご確認のうえ再試行してください。");
  }

  if (!response.ok) {
    throw new Error(`天気情報の取得に失敗しました（サーバーエラー: ${response.status}）。`);
  }

  try {
    return await response.json();
  } catch (error) {
    throw new Error("天気情報の解析に失敗しました。");
  }
}

/**
 * 指定した緯度経度の現在の気温・湿度・天気をOpen-Meteo APIから取得する
 * @param {{latitude:number, longitude:number}} location
 * @returns {Promise<{temperature:number, humidity:number, condition:string}>}
 */
export async function fetchCurrentWeather({ latitude, longitude }) {
  const data = await requestForecast({
    latitude,
    longitude,
    current: "temperature_2m,relative_humidity_2m,weather_code",
    timezone: "auto",
  });

  const current = data && data.current;
  if (
    !current ||
    typeof current.temperature_2m !== "number" ||
    typeof current.relative_humidity_2m !== "number" ||
    typeof current.weather_code !== "number"
  ) {
    throw new Error("天気情報のレスポンス形式が不正です。");
  }

  return {
    temperature: current.temperature_2m,
    humidity: current.relative_humidity_2m,
    condition: mapWeatherCode(current.weather_code),
  };
}

/**
 * 指定した緯度経度の本日の1時間ごとの気温・湿度・天気をOpen-Meteo APIから取得する
 * @param {{latitude:number, longitude:number}} location
 * @returns {Promise<{time:string[], temperature_2m:number[], relative_humidity_2m:number[], weather_code:number[]}>}
 */
export async function fetchHourlyForecast({ latitude, longitude }) {
  const data = await requestForecast({
    latitude,
    longitude,
    hourly: "temperature_2m,relative_humidity_2m,weather_code",
    forecast_days: "1",
    timezone: "auto",
  });

  const hourly = data && data.hourly;
  if (
    !hourly ||
    !Array.isArray(hourly.time) ||
    !Array.isArray(hourly.temperature_2m) ||
    !Array.isArray(hourly.relative_humidity_2m) ||
    !Array.isArray(hourly.weather_code) ||
    hourly.time.length === 0
  ) {
    throw new Error("時間帯別の天気情報のレスポンス形式が不正です。");
  }

  return hourly;
}

// hourly.time（例: "2026-07-13T14:00"）の中から、指定した時（0〜23）に最も近い時刻のインデックスを返す
function findClosestHourIndex(hourlyTimes, targetHour) {
  let bestIndex = 0;
  let bestDiff = Infinity;
  hourlyTimes.forEach((isoTime, index) => {
    const hour = Number(isoTime.slice(11, 13));
    const diff = Math.abs(hour - targetHour);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIndex = index;
    }
  });
  return bestIndex;
}

function pickHourlyAt(hourly, targetHour) {
  const index = findClosestHourIndex(hourly.time, targetHour);
  return {
    temperature: hourly.temperature_2m[index],
    humidity: hourly.relative_humidity_2m[index],
    condition: mapWeatherCode(hourly.weather_code[index]),
  };
}

/**
 * 指定した緯度経度の「朝・昼・夜」それぞれの代表時刻の気温・湿度・天気を取得する
 * @param {{latitude:number, longitude:number}} location
 * @returns {Promise<{morning:object, afternoon:object, evening:object}>}
 */
export async function fetchTimeOfDayForecast({ latitude, longitude }) {
  const hourly = await fetchHourlyForecast({ latitude, longitude });
  return {
    morning: pickHourlyAt(hourly, TIME_OF_DAY_HOURS.morning),
    afternoon: pickHourlyAt(hourly, TIME_OF_DAY_HOURS.afternoon),
    evening: pickHourlyAt(hourly, TIME_OF_DAY_HOURS.evening),
  };
}
