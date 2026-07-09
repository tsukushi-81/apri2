// 服装レコメンドロジック（要件定義書「保守性」要求に従い、UIから独立させたファイル）
// このファイルだけを見て服装ルールを変更できるようにする。

// 天気コードの日本語ラベル（他ファイルからも参照する）
export const CONDITION_LABELS = {
  sunny: "晴れ",
  cloudy: "曇り",
  rainy: "雨",
  snowy: "雪",
};

// 気温帯ごとの基本の服装ルール（閾値は上から順に判定し、最初に一致したものを採用する）
const TEMPERATURE_RULES = [
  { tempMin: 30, tempMax: Infinity, suggestion: "半袖Tシャツ + 短パン・軽装。通気性の良い素材がおすすめです。" },
  { tempMin: 25, tempMax: 30, suggestion: "半袖シャツ、または薄手の長袖。涼しい素材の服がおすすめです。" },
  { tempMin: 20, tempMax: 25, suggestion: "長袖シャツ + 薄手の羽織り（カーディガンなど）。" },
  { tempMin: 15, tempMax: 20, suggestion: "長袖 + 薄手のジャケットやパーカー。" },
  { tempMin: 10, tempMax: 15, suggestion: "セーターやニット + ジャケット。しっかりめの上着があると安心です。" },
  { tempMin: 5, tempMax: 10, suggestion: "厚手のコート + マフラー・手袋などの防寒小物。" },
  { tempMin: -Infinity, tempMax: 5, suggestion: "ダウンジャケットなど本格的な防寒着一式。" },
];

// 天気（雨・雪・日差しなど）に応じた追加アドバイス
function getConditionAdvice(condition, temperature) {
  const advice = [];
  switch (condition) {
    case "rainy":
      advice.push("傘またはレインコートを持参してください。");
      advice.push("靴は防水性のあるものがおすすめです。");
      break;
    case "snowy":
      advice.push("防水・防滑仕様のブーツを選んでください。");
      advice.push("手袋やニット帽など防寒小物を追加してください。");
      break;
    case "cloudy":
      advice.push("天気が変わりやすいので、念のため折りたたみ傘があると安心です。");
      break;
    case "sunny":
      if (temperature >= 20) {
        advice.push("日差し対策として帽子・日焼け止めがあるとよいでしょう。");
      }
      break;
    default:
      break;
  }
  return advice;
}

// 湿度に応じた追加アドバイス
function getHumidityAdvice(humidity) {
  const advice = [];
  if (humidity >= 80) {
    advice.push("湿度が高いため、通気性の良い素材や速乾性のある服がおすすめです。");
  } else if (humidity <= 30) {
    advice.push("空気が乾燥しています。肌の乾燥対策（保湿など）も意識しましょう。");
  }
  return advice;
}

// 気温から基本ルールを1件選ぶ
export function selectTemperatureRule(temperature) {
  return (
    TEMPERATURE_RULES.find((rule) => temperature >= rule.tempMin && temperature < rule.tempMax) ??
    TEMPERATURE_RULES[TEMPERATURE_RULES.length - 1]
  );
}

/**
 * 気温・天気・湿度から服装提案を生成する
 * @param {{temperature:number, condition:string, humidity:number}} input
 * @returns {{baseOutfit:string, tips:string[], summary:string}}
 */
export function generateRecommendation({ temperature, condition, humidity }) {
  const baseRule = selectTemperatureRule(temperature);
  const tips = [...getConditionAdvice(condition, temperature), ...getHumidityAdvice(humidity)];

  const conditionLabel = CONDITION_LABELS[condition] ?? condition;
  const summary = `気温${temperature}℃・${conditionLabel}・湿度${humidity}% のおすすめコーディネート`;

  return {
    baseOutfit: baseRule.suggestion,
    tips,
    summary,
  };
}
