// Task-005: 収支・ウェイト・端数の計算の Small テスト
const {
  calcBalance,
  calcWeight,
  roundToInteger,
} = require("../../../src/aggregate/calc");

// Test-012（Task-005 期待値1）
test("最終チップ数 25000、配布チップ数 20000、借金回数 1 の収支は 5000", () => {
  expect(calcBalance(25000, 20000, 1)).toBe(5000);
});

// Test-013（Task-005 期待値2）
test("最終チップ数 10000、配布チップ数 20000、借金回数 2 の収支は -30000", () => {
  expect(calcBalance(10000, 20000, 2)).toBe(-30000);
});

// Test-014（Task-005 期待値3）
test.each([
  [0.5, 0.5],
  [1, 0.7071],
  [1.5, 0.866],
  [2, 1],
  [3, 1],
])("プレイ時間 %p のウェイトは約 %p（上限 100%）", (playTime, expected) => {
  expect(calcWeight(playTime)).toBeCloseTo(expected, 4);
});

// Test-014（Task-005 期待値3：上限）
test("プレイ時間 3 のウェイトは 1 を超えない", () => {
  expect(calcWeight(3)).toBe(1);
});

// Test-015（Task-005 期待値4）
test("プレイ時間 0 のウェイトは 0", () => {
  expect(calcWeight(0)).toBe(0);
});

// Test-016（Task-005 期待値5）
test.each([
  [1234.4, 1234],
  [1234.5, 1235],
  [2.5, 3],
])("%p を四捨五入すると %p", (value, expected) => {
  expect(roundToInteger(value)).toBe(expected);
});

// Test-017（Task-005 期待値6）
test.each([
  [-2.5, -3],
  [-2.4, -2],
])("マイナスの値 %p は絶対値で四捨五入して %p", (value, expected) => {
  expect(roundToInteger(value)).toBe(expected);
});
