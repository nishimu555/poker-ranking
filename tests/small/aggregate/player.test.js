// Task-008: 個人の戦績の集計の Small テスト
// GAS では全ファイルが同じ場所で動くため、player.js が使う関数をグローバルに置いてから読み込む
Object.assign(
  global,
  require("../../../src/aggregate/calc"),
  require("../../../src/aggregate/rank"),
  require("../../../src/aggregate/aggregate"),
);
const { aggregatePlayerStats } = require("../../../src/aggregate/player");

const settings = { distributedChips: 20000, forcedLaborCount: 10 };

// 有効な行を作る
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

// 指定した年・ニックネームの個人の戦績を取り出す
function findPlayer(playersByYear, year, nickname) {
  return playersByYear[year].find((p) => p.nickname === nickname);
}

// 日付を「年/月/日」の文字列にする
function formatDate(date) {
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}

// Test-036（Task-008 期待値1）
test("3 日分（プレイ時間 2.0、1.5、3.0、借金回数 0、1、0）は参加日数 3 日、合計プレイ時間 6.5、借金回数の累計 1", () => {
  const playersByYear = aggregatePlayerStats(
    [
      row("A", "2026/01/10", 2.0, 30000, 0),
      row("A", "2026/01/17", 1.5, 30000, 1),
      row("A", "2026/01/24", 3.0, 30000, 0),
    ],
    settings,
  );
  const player = findPlayer(playersByYear, 2026, "A");
  expect(player.days).toBe(3);
  expect(player.totalPlayTime).toBe(6.5);
  expect(player.totalDebtCount).toBe(1);
});

// Test-037（Task-008 期待値2）
test("基準値 44200、配布チップ数 20000、N 10 の強制労働までの残りチップ数は 244200", () => {
  const playersByYear = aggregatePlayerStats(
    [row("A", "2026/02/01", 2, 44200, 0)],
    settings,
  );
  const player = findPlayer(playersByYear, 2026, "A");
  expect(player.totalBalance).toBe(44200);
  expect(player.remainingChips).toBe(244200);
});

// Test-038（Task-008 期待値3）
test("基準値 -210000、配布チップ数 20000、N 10 の強制労働までの残りチップ数は -10000", () => {
  // 収支 ＝ 10000 − 20000 × 11 ＝ -210000
  const playersByYear = aggregatePlayerStats(
    [row("A", "2026/02/01", 2, 10000, 11)],
    settings,
  );
  const player = findPlayer(playersByYear, 2026, "A");
  expect(player.totalBalance).toBe(-210000);
  expect(player.remainingChips).toBe(-10000);
});

// Test-039（Task-008 期待値4）
test("基準値が 0 以上のプレイヤーは、強制労働への道のりの順位が「なし」", () => {
  const playersByYear = aggregatePlayerStats(
    [row("A", "2026/03/01", 2, 5000), row("B", "2026/03/01", 2, 0)],
    settings,
  );
  expect(findPlayer(playersByYear, 2026, "A").ranks.forcedLabor).toBeNull();
  expect(findPlayer(playersByYear, 2026, "B").ranks.forcedLabor).toBeNull();
});

// Test-040（Task-008 期待値5）
test("基準値がマイナスのプレイヤーは 3 つのランキングすべての順位を持つ", () => {
  const playersByYear = aggregatePlayerStats(
    [
      row("A", "2026/03/01", 2, 44200),
      row("B", "2026/03/01", 2, -8800),
      row("C", "2026/03/01", 2, 9500),
    ],
    settings,
  );
  expect(findPlayer(playersByYear, 2026, "B").ranks).toEqual({
    average: 3,
    total: 3,
    forcedLabor: 1,
  });
});

// Test-041（Task-008 期待値6）
test("履歴は新しい日付から並び、各行に日付・時間・最終チップ・借金・収支を持つ", () => {
  const playersByYear = aggregatePlayerStats(
    [
      row("A", "2026/08/16", 2, 25000, 1),
      row("A", "2026/09/13", 1.5, 18000, 0),
      row("A", "2026/08/30", 3, 12000, 2),
    ],
    settings,
  );
  const history = findPlayer(playersByYear, 2026, "A").history;
  expect(
    history.map((h) => [
      formatDate(h.playDate),
      h.playTime,
      h.finalChips,
      h.debtCount,
      h.balance,
    ]),
  ).toEqual([
    ["2026/9/13", 1.5, 18000, 0, 18000],
    ["2026/8/30", 3, 12000, 2, -28000],
    ["2026/8/16", 2, 25000, 1, 5000],
  ]);
});

// Test-042（Task-008 期待値7）
test("同じ日付の 2 行は、履歴に 2 行とも含まれ、参加日数は 1 日", () => {
  const playersByYear = aggregatePlayerStats(
    [row("A", "2026/02/01", 2, 4000), row("A", "2026/02/01", 2, 2000)],
    settings,
  );
  const player = findPlayer(playersByYear, 2026, "A");
  expect(player.history).toHaveLength(2);
  expect(player.days).toBe(1);
});
