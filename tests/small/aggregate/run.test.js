// Task-014: 集計の実行の処理の流れの Small テスト
// 集計ロジック（Component-003）は実物を使い、スプレッドシートの読み書き（Component-004）と
// ニックネームの候補の更新（Component-001）は代用品（jest.fn()）に置き換える
Object.assign(
  global,
  require("../../../src/aggregate/validate"),
  require("../../../src/aggregate/calc"),
  require("../../../src/aggregate/rank"),
  require("../../../src/aggregate/aggregate"),
  require("../../../src/aggregate/player"),
);
const { runAggregation } = require("../../../src/aggregate/run");

const spreadsheet = { name: "入力用スプレッドシート" };

// 読み込まれる行を作る（シート上の行番号付き）
function playRow(rowNumber, playerName, date, playTime, finalChips, debtCount) {
  const [y, m, d] = date.split("/").map(Number);
  return {
    rowNumber,
    playerName,
    playDate: new Date(y, m - 1, d),
    playTime,
    finalChips,
    debtCount,
  };
}

// Component-004・Component-001 の代用品をグローバルに置く
function setUpAccess({ settings, rows, writeResult = { ok: true } }) {
  global.readSettings = jest.fn(() => settings);
  global.readPlayRows = jest.fn(() => rows);
  global.markExcludedRows = jest.fn();
  global.writeViewerSpreadsheet = jest.fn(() => writeResult);
  global.updateNicknameOptions = jest.fn();
}

afterEach(() => {
  for (const name of [
    "readSettings",
    "readPlayRows",
    "markExcludedRows",
    "writeViewerSpreadsheet",
    "updateNicknameOptions",
  ]) {
    delete global[name];
  }
});

const validSettings = { distributedChips: 20000, forcedLaborCount: 10 };
const threeValidRows = [
  playRow(2, "ナッツ", "2026/09/13", 2, 30000, 0),
  playRow(3, "リバー", "2026/09/13", 2, 10000, 0),
  playRow(5, "ナッツ", "2026/09/20", 1, 20000, 1),
];

// Test-057（Task-014 期待値1）
test.each([
  ["空欄", ""],
  ["数値でない", "abc"],
])(
  "配布チップ数が%sの場合、集計を中止してメッセージを表示し、書き出し・印付けは行わない",
  (_label, distributedChips) => {
    setUpAccess({
      settings: { distributedChips, forcedLaborCount: 10 },
      rows: threeValidRows,
    });
    const notify = jest.fn();

    runAggregation(spreadsheet, notify);

    expect(notify).toHaveBeenCalledTimes(1);
    expect(global.writeViewerSpreadsheet).not.toHaveBeenCalled();
    expect(global.markExcludedRows).not.toHaveBeenCalled();
  },
);

// Test-058（Task-014 期待値2）
test.each([
  ["空欄", ""],
  ["数値でない", "abc"],
])(
  "N が%sの場合、集計を中止してメッセージを表示し、書き出し・印付けは行わない",
  (_label, forcedLaborCount) => {
    setUpAccess({
      settings: { distributedChips: 20000, forcedLaborCount },
      rows: threeValidRows,
    });
    const notify = jest.fn();

    runAggregation(spreadsheet, notify);

    expect(notify).toHaveBeenCalledTimes(1);
    expect(global.writeViewerSpreadsheet).not.toHaveBeenCalled();
    expect(global.markExcludedRows).not.toHaveBeenCalled();
  },
);

// Test-059（Task-014 期待値3）
test("有効な行 3 件と無効な行 1 件（4 行目）では、4 行目に印が付き、3 件で集計・書き出しが行われ、完了のメッセージに除外した行の数 1 が含まれる", () => {
  setUpAccess({
    settings: validSettings,
    rows: [
      threeValidRows[0],
      threeValidRows[1],
      playRow(4, "", "2026/09/13", 2, 10000, 0),
      threeValidRows[2],
    ],
  });
  const notify = jest.fn();

  runAggregation(spreadsheet, notify);

  expect(global.markExcludedRows).toHaveBeenCalledWith(spreadsheet, [4]);
  expect(global.writeViewerSpreadsheet).toHaveBeenCalledTimes(1);
  const aggregation = global.writeViewerSpreadsheet.mock.calls[0][0];
  const players = aggregation.playersByYear[2026];
  // 有効な 3 件（ナッツ 2 件、リバー 1 件）で集計される
  expect(players.reduce((sum, p) => sum + p.history.length, 0)).toBe(3);
  expect(notify).toHaveBeenCalledTimes(1);
  expect(notify.mock.calls[0][0]).toMatch(/1\s*件/);
});

// Test-060（Task-014 期待値4）
test("書き出しが失敗した場合、管理者に失敗のメッセージを表示する", () => {
  const failure = {
    ok: false,
    message: "閲覧用スプレッドシートの書き出しに失敗しました。",
  };
  setUpAccess({
    settings: validSettings,
    rows: threeValidRows,
    writeResult: failure,
  });
  const notify = jest.fn();

  runAggregation(spreadsheet, notify);

  expect(notify).toHaveBeenCalledTimes(1);
  expect(notify.mock.calls[0][0]).toContain(failure.message);
});

// Test-061（Task-014 期待値5）
test("集計が成功した場合、ニックネームの候補が更新される", () => {
  setUpAccess({ settings: validSettings, rows: threeValidRows });

  runAggregation(spreadsheet, jest.fn());

  expect(global.updateNicknameOptions).toHaveBeenCalledTimes(1);
  const [target, nicknames] = global.updateNicknameOptions.mock.calls[0];
  expect(target).toBe(spreadsheet);
  expect([...new Set(nicknames)].sort()).toEqual(["ナッツ", "リバー"].sort());
});

// Test-062（Task-014 期待値6）
test("行を修正・削除してから実行すると、修正後の行のみで集計される（前回の結果は置き換えられる）", () => {
  setUpAccess({ settings: validSettings, rows: threeValidRows });
  runAggregation(spreadsheet, jest.fn());

  // リバーの行を削除し、ナッツの 1 行目の最終チップ数を修正する
  global.readPlayRows = jest.fn(() => [
    playRow(2, "ナッツ", "2026/09/13", 2, 25000, 0),
    playRow(3, "ナッツ", "2026/09/20", 1, 20000, 1),
  ]);
  runAggregation(spreadsheet, jest.fn());

  expect(global.writeViewerSpreadsheet).toHaveBeenCalledTimes(2);
  const aggregation = global.writeViewerSpreadsheet.mock.calls[1][0];
  const total = aggregation.rankingsByYear[2026].total;
  // 収支：25000 ＋（20000 − 20000 × 1）＝ 25000。リバーは含まれない
  expect(total.map((e) => [e.nickname, e.value])).toEqual([["ナッツ", 25000]]);
});
