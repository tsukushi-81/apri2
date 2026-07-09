// 入力値バリデーション（要件定義書「機能要求」「ユーザビリティ」に対応）
// UIから切り離しておくことで、ルール変更・単体テストがしやすいようにする。

export const LIMITS = {
  temperature: { min: -30, max: 45 },
  humidity: { min: 0, max: 100 },
};

export const VALID_CONDITIONS = ["sunny", "cloudy", "rainy", "snowy"];

/**
 * フォーム入力値を検証する
 * @param {{temperature:string, condition:string, humidity:string}} raw
 * @returns {{valid:boolean, errors:Object, values:Object}}
 */
export function validateInputs(raw) {
  const errors = {};
  const values = {};

  // 気温
  if (raw.temperature === "" || raw.temperature === null || raw.temperature === undefined) {
    errors.temperature = "気温を入力してください。";
  } else {
    const temp = Number(raw.temperature);
    if (Number.isNaN(temp)) {
      errors.temperature = "気温は数値で入力してください。";
    } else if (temp < LIMITS.temperature.min || temp > LIMITS.temperature.max) {
      errors.temperature = `気温は${LIMITS.temperature.min}〜${LIMITS.temperature.max}℃の範囲で入力してください。`;
    } else {
      values.temperature = temp;
    }
  }

  // 天気
  if (!raw.condition) {
    errors.condition = "天気を選択してください。";
  } else if (!VALID_CONDITIONS.includes(raw.condition)) {
    errors.condition = "天気の選択が不正です。";
  } else {
    values.condition = raw.condition;
  }

  // 湿度
  if (raw.humidity === "" || raw.humidity === null || raw.humidity === undefined) {
    errors.humidity = "湿度を入力してください。";
  } else {
    const humidity = Number(raw.humidity);
    if (Number.isNaN(humidity)) {
      errors.humidity = "湿度は数値で入力してください。";
    } else if (humidity < LIMITS.humidity.min || humidity > LIMITS.humidity.max) {
      errors.humidity = `湿度は${LIMITS.humidity.min}〜${LIMITS.humidity.max}%の範囲で入力してください。`;
    } else {
      values.humidity = humidity;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    values,
  };
}
