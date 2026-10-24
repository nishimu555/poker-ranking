// Task-005: 収支・ウェイト・端数の計算（Component-003 集計ロジック）

// Task-005: 収支 ＝ 最終チップ数 − 配布チップ数 × 借金回数（マイナスになる場合がある：Feature-003 条件1）
function calcBalance(finalChips, distributedChips, debtCount) {
  return finalChips - distributedChips * debtCount;
}

// Task-005: ウェイト ＝ √（プレイ時間 ÷ 2）、上限 1（100%）（Feature-004 条件2）。プレイ時間 0 はウェイト 0（c1/Question-017-1）
function calcWeight(playTime) {
  return Math.min(Math.sqrt(playTime / 2), 1);
}

// Task-005: 整数への四捨五入。マイナスは絶対値で四捨五入する（例：-2.5 → -3）（c1/Question-013、c1/Question-019）
function roundToInteger(value) {
  const rounded = Math.sign(value) * Math.round(Math.abs(value));
  // -0.4 等を丸めた結果の -0 は 0 とする
  return rounded === 0 ? 0 : rounded;
}

// ローカルのテスト用の公開（GAS 上では module がないため何もしない）
if (typeof module !== "undefined") {
  module.exports = { calcBalance, calcWeight, roundToInteger };
}
