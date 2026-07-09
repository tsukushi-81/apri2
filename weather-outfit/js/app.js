// エントリーポイント。各機能のUI初期化を呼び出すだけの「つなぎ役」に徹する。
// 機能ごとの実装は js/ui/ 以下に分離してある。
//   - locationUI.js    : 位置情報の観測
//   - outfitFormUI.js  : 気温・天気・湿度の入力 → 服装提案の表示
//   - favoritesUI.js   : お気に入りの登録・一覧・削除

import { initLocationUI } from "./ui/locationUI.js";
import { initOutfitFormUI } from "./ui/outfitFormUI.js";
import { initFavoritesUI } from "./ui/favoritesUI.js";

initLocationUI();
initOutfitFormUI();
initFavoritesUI();
