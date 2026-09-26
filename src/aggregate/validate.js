// Task-004: 行の確認（Component-003 集計ロジック）
// プレイ結果の 1 行が集計に使えるかを確かめ、前後の空白を取り除いたニックネームを返す。
// 必須の 5 項目がすべてあり、プレイ日付が日付、プレイ時間・最終チップ数・借金回数が 0 以上の数値であれば有効とする
// （b1/Question-007 (a)、b1/Question-008、b1/Question-020。0・小数も有効：c1/Question-017-1）。

// Task-004: 空欄か（前後の空白のみの文字列も空欄として扱う：b1/Question-007 (c)）
function isBlank(value) {
  if (value === null || value === undefined) {
    return true;
  }
  return typeof value === "string" && value.trim() === "";
}

// Task-004: 日付か（スプレッドシートの日付のセルは Date として読み込まれる）
function isValidDate(value) {
  return (
    Object.prototype.toString.call(value) === "[object Date]" &&
    !isNaN(value.getTime())
  );
}

// Task-004: 0 以上の数値か（数値のセルは number として読み込まれる。文字列は数値として扱わない）
function isNonNegativeNumber(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

// Task-004: 行の確認。row は { playerName, playDate, playTime, finalChips, debtCount }
// 戻り値は { valid: 有効か, nickname: 前後の空白を取り除いたニックネーム（無効の場合は null） }
function validateRow(row) {
  const invalid = { valid: false, nickname: null };
  const values = [
    row.playerName,
    row.playDate,
    row.playTime,
    row.finalChips,
    row.debtCount,
  ];
  if (values.some(isBlank)) {
    return invalid;
  }
  if (!isValidDate(row.playDate)) {
    return invalid;
  }
  if (
    ![row.playTime, row.finalChips, row.debtCount].every(isNonNegativeNumber)
  ) {
    return invalid;
  }
  return { valid: true, nickname: String(row.playerName).trim() };
}

// ローカルのテスト用の公開（GAS 上では module がないため何もしない）
if (typeof module !== "undefined") {
  module.exports = { validateRow };
}
