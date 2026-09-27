// Task-007: 年ごとの集計と 3 つのランキングの Small テスト
// GAS では全ファイルが同じ場所で動くため、aggregate.js が使う関数をグローバルに置いてから読み込む
Object.assign(
  global,
  require("../../../src/aggregate/calc"),
  require("../../../src/aggregate/rank"),
);
const { aggregateAllYears } = require("../../../src/aggregate/aggregate");

const settings = { distributedChips: 20000, forcedLaborCount: 10 };

// 有効な行を作る（借金回数 0 の場合、収支 ＝ 最終チップ数）
function row(nickname, date, playTime, finalChips, debtCount = 0) {
  const [y, m, d] = date.split("/").map(Number);
  return {
    nickname,
    playDate: new Date(y, m - 1, d),
    playTime,
    finalChips,
    debtCount,
  };
}

// ランキングを [ニックネーム, 値, 順位] の一覧にする
function summary(entries) {
  return entries.map((e) => [e.nickname, e.value, e.rank]);
}

// Test-023（Task-007 期待値1）
test("2026 年の集計には 2026/01/01 の行のみが含まれる", () => {
  const result = aggregateAllYears(
    [row("A", "2025/12/31", 2, 1000), row("B", "2026/01/01", 2, 3000)],
    settings,
  );
  const rankings = result.rankingsByYear[2026];
  expect(summary(rankings.total)).toEqual([["B", 3000, 1]]);
  expect(summary(rankings.average)).toEqual([["B", 3000, 1]]);
});

// Test-024（Task-007 期待値2）
test("集計済みの年の一覧は 2025、2026", () => {
  const result = aggregateAllYears(
    [
      row("A", "2026/03/01", 2, 1000),
      row("A", "2025/05/01", 2, 1000),
      row("B", "2026/04/01", 2, 1000),
    ],
    settings,
  );
  expect(result.years).toEqual([2025, 2026]);
});

// Test-025（Task-007 期待値3）
test("アベレージランキングの値は（10000 × 1 ＋ -5000 × 0.5）÷ 2 ＝ 3750", () => {
  const result = aggregateAllYears(
    [row("A", "2026/01/10", 2, 10000), row("A", "2026/01/17", 0.5, -5000)],
    settings,
  );
  expect(summary(result.rankingsByYear[2026].average)).toEqual([
    ["A", 3750, 1],
  ]);
});

// Test-026（Task-007 期待値4）
test("参加日数が 1 日のプレイヤーもアベレージランキングに含まれる", () => {
  const result = aggregateAllYears(
    [
      row("A", "2026/01/10", 2, 1000),
      row("A", "2026/01/17", 2, 1000),
      row("B", "2026/01/10", 2, 500),
    ],
    settings,
  );
  const nicknames = result.rankingsByYear[2026].average.map((e) => e.nickname);
  expect(nicknames).toContain("B");
});

// Test-027（Task-007 期待値5）
test("同じプレイヤー・同じ日付の 2 行は参加日数 1 日として集計する", () => {
  const result = aggregateAllYears(
    [row("A", "2026/02/01", 2, 4000), row("A", "2026/02/01", 2, 2000)],
    settings,
  );
  const rankings = result.rankingsByYear[2026];
  expect(summary(rankings.average)).toEqual([["A", 6000, 1]]);
  expect(summary(rankings.total)).toEqual([["A", 6000, 1]]);
});

// Test-028（Task-007 期待値6）
test("アベレージランキングの値が 1234.5 と 1234.6 の 2 人は、どちらも 1235 で同じ順位", () => {
  const result = aggregateAllYears(
    [row("A", "2026/02/01", 2, 1234.5), row("B", "2026/02/01", 2, 1234.6)],
    settings,
  );
  expect(summary(result.rankingsByYear[2026].average)).toEqual([
    ["A", 1235, 1],
    ["B", 1235, 1],
  ]);
});

// 収支の合計が 44200、-8800、9500 の 3 人
const threePlayers = [
  row("A", "2026/03/01", 2, 44200),
  row("B", "2026/03/01", 2, -8800),
  row("C", "2026/03/01", 2, 9500),
];

// Test-029（Task-007 期待値7）
test("累計ランキングは 44200、9500、-8800 の順（全員が対象）", () => {
  const result = aggregateAllYears(threePlayers, settings);
  expect(summary(result.rankingsByYear[2026].total)).toEqual([
    ["A", 44200, 1],
    ["C", 9500, 2],
    ["B", -8800, 3],
  ]);
});

// Test-030（Task-007 期待値8）
test("強制労働への道のりは -8800 の 1 人のみ", () => {
  const result = aggregateAllYears(threePlayers, settings);
  expect(summary(result.rankingsByYear[2026].forcedLabor)).toEqual([
    ["B", -8800, 1],
  ]);
});

// Test-031（Task-007 期待値9）
test("基準値がマイナスのプレイヤーがいない場合、強制労働への道のりは空", () => {
  const result = aggregateAllYears(
    [row("A", "2026/03/01", 2, 1000), row("B", "2026/03/01", 2, 0)],
    settings,
  );
  expect(result.rankingsByYear[2026].forcedLabor).toEqual([]);
});

// Test-032（Task-007 期待値10）
test("配布チップ数 20000・N 10 では、基準値 -200000 は強制労働に該当し、-199999 は該当しない", () => {
  const result = aggregateAllYears(
    [row("A", "2026/03/01", 2, -200000), row("B", "2026/03/01", 2, -199999)],
    settings,
  );
  const forcedLabor = result.rankingsByYear[2026].forcedLabor;
  expect(forcedLabor.find((e) => e.nickname === "A").isForcedLabor).toBe(true);
  expect(forcedLabor.find((e) => e.nickname === "B").isForcedLabor).toBe(false);
});

// Test-033（Task-007 期待値11）
test("基準値は年ごとに数え直す（2025 年 -150000、2026 年 -60000）", () => {
  const result = aggregateAllYears(
    [row("A", "2025/06/01", 2, -150000), row("A", "2026/06/01", 2, -60000)],
    settings,
  );
  expect(summary(result.rankingsByYear[2025].forcedLabor)).toEqual([
    ["A", -150000, 1],
  ]);
  expect(summary(result.rankingsByYear[2026].forcedLabor)).toEqual([
    ["A", -60000, 1],
  ]);
});

// Test-034（Task-007 期待値12）
test("収支の合計 1000.5 の累計チップ数・基準値は 1001（合計してから丸める）", () => {
  const result = aggregateAllYears(
    [row("A", "2026/03/01", 2, 500.25), row("A", "2026/03/08", 2, 500.25)],
    settings,
  );
  expect(summary(result.rankingsByYear[2026].total)).toEqual([["A", 1001, 1]]);
});

// Test-035（Task-007 期待値13）
test("配布チップ数を 20000 から 30000 に変えると、すべての年の収支・ランキングが 30000 で計算される", () => {
  const rows = [
    row("A", "2025/03/01", 2, 50000, 1),
    row("A", "2026/03/01", 2, 50000, 1),
  ];
  const before = aggregateAllYears(rows, settings);
  const after = aggregateAllYears(rows, {
    distributedChips: 30000,
    forcedLaborCount: 10,
  });
  for (const year of [2025, 2026]) {
    expect(summary(before.rankingsByYear[year].total)).toEqual([
      ["A", 30000, 1],
    ]);
    expect(summary(after.rankingsByYear[year].total)).toEqual([
      ["A", 20000, 1],
    ]);
    expect(summary(after.rankingsByYear[year].average)).toEqual([
      ["A", 20000, 1],
    ]);
  }
});
