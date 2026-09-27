// Task-019: 表示用の整形の Small テスト
const {
  escapeHtml,
  formatSignedNumber,
  formatRank,
  formatRemainingChips,
  calcGaugePercent,
} = require("../../../src/viewer/client/format");

// Task-019 期待値1
test("文字列 <b>ナッツ&</b> は HTML として解釈されない形になる", () => {
  expect(escapeHtml("<b>ナッツ&</b>")).toBe("&lt;b&gt;ナッツ&amp;&lt;/b&gt;");
});

// Task-019 期待値2
test("値 44200、-8800 は「+44,200」「−8,800」", () => {
  expect(formatSignedNumber(44200)).toBe("+44,200");
  expect(formatSignedNumber(-8800)).toBe("−8,800");
});

// Task-019 期待値3
test("順位 2 は「2位」", () => {
  expect(formatRank(2)).toBe("2位");
});

// Task-019 期待値4
test("強制労働への道のりの順位なしは「−」", () => {
  expect(formatRank(null)).toBe("−");
});

// Task-019 期待値5
test("残りチップ数 244200 は「244,200」", () => {
  expect(formatRemainingChips(244200)).toBe("244,200");
});

// Task-019 期待値6
test("残りチップ数 0、-10000 は「強制労働」（数値は表示しない）", () => {
  expect(formatRemainingChips(0)).toBe("強制労働");
  expect(formatRemainingChips(-10000)).toBe("強制労働");
});

// Task-019 期待値7
test("基準値 44200、配布チップ数 20000、N 10 のゲージの割合は 0%", () => {
  expect(calcGaugePercent(44200, 20000, 10)).toBe(0);
});

// Task-019 期待値8
test("基準値 -50000、配布チップ数 20000、N 10 のゲージの割合は 25%", () => {
  expect(calcGaugePercent(-50000, 20000, 10)).toBe(25);
});

// Task-019 期待値9
test("基準値 -250000、配布チップ数 20000、N 10 のゲージの割合は 100%（上限）", () => {
  expect(calcGaugePercent(-250000, 20000, 10)).toBe(100);
});
