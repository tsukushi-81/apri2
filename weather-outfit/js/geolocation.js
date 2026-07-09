// 位置情報取得サービス（Geolocation API のラッパー）
// 要件定義書「セキュリティ」要求: 取得した位置情報は外部送信せず、画面表示のみに使う。

const ERROR_MESSAGES = {
  UNSUPPORTED: "このブラウザは位置情報の取得に対応していません。",
  PERMISSION_DENIED: "位置情報の利用が許可されませんでした。ブラウザの設定から許可してください。",
  POSITION_UNAVAILABLE: "現在地を取得できませんでした。電波状況などをご確認のうえ再試行してください。",
  TIMEOUT: "位置情報の取得がタイムアウトしました。もう一度お試しください。",
  UNKNOWN: "位置情報の取得中に不明なエラーが発生しました。",
};

/**
 * 現在地の緯度・経度を取得する
 * @returns {Promise<{latitude:number, longitude:number, accuracy:number}>}
 */
export function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error(ERROR_MESSAGES.UNSUPPORTED));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error(ERROR_MESSAGES.PERMISSION_DENIED));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error(ERROR_MESSAGES.POSITION_UNAVAILABLE));
            break;
          case error.TIMEOUT:
            reject(new Error(ERROR_MESSAGES.TIMEOUT));
            break;
          default:
            reject(new Error(ERROR_MESSAGES.UNKNOWN));
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}
