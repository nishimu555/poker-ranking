// Task-009: 入力用スプレッドシートの読み込みの Small テスト
// GAS の SpreadsheetApp のスプレッドシート・シートは代用品（jest.fn()）に置き換える
const {
  readPlayRows,
  readSettings,
} = require("../../../src/aggregate/input-access");

// 代用品のシートを作る（values：シートの全セルの値。1 行目が見出し）
function createSheet(values) {
  return {
    getLastRow: jest.fn(() => values.length),
    getDataRange: jest.fn(() => ({ getValues: jest.fn(() => values) })),
    getRange: jest.fn((row, column, numRows, numColumns) => ({
      getValues: jest.fn(() =>
        values
          .slice(row - 1, row - 1 + numRows)
          .map((r) => r.slice(column - 1, column - 1 + numColumns)),
      ),
    })),
  };
}

// 代用品のスプレッドシートを作る（sheets：シート名 → 代用品のシート）
function createSpreadsheet(sheets) {
  return {
    getSheetByName: jest.fn((name) => sheets[name] || null),
  };
}

const header = [
  "プレイヤー名",
  "プレイ日付",
  "プレイ時間",
  "最終チップ数",
  "借金回数",
];

// Task-009 期待値1
test("シート「プレイ結果」の見出し行とデータ 2 行から、2 件の行が行番号（2、3）付きで返る", () => {
  const date1 = new Date(2026, 8, 13);
  const date2 = new Date(2026, 8, 13);
  const spreadsheet = createSpreadsheet({
    プレイ結果: createSheet([
      header,
      ["ナッツ", date1, 1.5, 25000, 1],
      ["リバー", date2, 2, 18000, 0],
    ]),
  });
  expect(readPlayRows(spreadsheet)).toEqual([
    {
      rowNumber: 2,
      playerName: "ナッツ",
      playDate: date1,
      playTime: 1.5,
      finalChips: 25000,
      debtCount: 1,
    },
    {
      rowNumber: 3,
      playerName: "リバー",
      playDate: date2,
      playTime: 2,
      finalChips: 18000,
      debtCount: 0,
    },
  ]);
});

// Task-009 期待値2
test("シート「設定」の配布チップ数 20000、N 10 が返る", () => {
  const spreadsheet = createSpreadsheet({
    設定: createSheet([
      ["配布チップ数", 20000],
      ["強制労働の基準の回数 N", 10],
    ]),
  });
  expect(readSettings(spreadsheet)).toEqual({
    distributedChips: 20000,
    forcedLaborCount: 10,
  });
});

// Task-009 期待値3
test("シート「設定」の配布チップ数が空欄の場合、空欄のまま返る", () => {
  const spreadsheet = createSpreadsheet({
    設定: createSheet([
      ["配布チップ数", ""],
      ["強制労働の基準の回数 N", 10],
    ]),
  });
  expect(readSettings(spreadsheet)).toEqual({
    distributedChips: "",
    forcedLaborCount: 10,
  });
});
