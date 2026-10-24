// Task-009: 入力用スプレッドシートの読み込み、Task-010: 除外した行の印付けの Small テスト
// GAS の SpreadsheetApp のスプレッドシート・シートは代用品（jest.fn()）に置き換える
const {
  readPlayRows,
  readSettings,
  markExcludedRows,
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

// Test-043（Task-009 期待値1）
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

// Test-044（Task-009 期待値2）
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

// Test-045（Task-009 期待値3）
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

// 背景色の設定を記録する代用品のシートを作る（lastRow：最終行。1 行目が見出し）
// 戻り値の calls に、背景色を設定した範囲と色を呼ばれた順に記録する
function createMarkableSheet(lastRow) {
  const calls = [];
  const sheet = {
    getLastRow: jest.fn(() => lastRow),
    getRange: jest.fn((row, column, numRows, numColumns) => ({
      setBackground: jest.fn((color) => {
        calls.push({ row, column, numRows, numColumns, color });
      }),
    })),
  };
  return { sheet, calls };
}

// Test-046（Task-010 期待値1）
test("除外する行番号 3、5 では、データ行の背景色が消されたうえで 3 行目と 5 行目に背景色が付く", () => {
  const { sheet, calls } = createMarkableSheet(6);
  markExcludedRows(createSpreadsheet({ プレイ結果: sheet }), [3, 5]);

  expect(calls).toHaveLength(3);
  // 最初にデータ行（2〜6 行目、5 列）の背景色を消す
  expect(calls[0]).toEqual({
    row: 2,
    column: 1,
    numRows: 5,
    numColumns: 5,
    color: null,
  });
  // その後に 3 行目・5 行目に背景色を付ける
  expect(calls.slice(1).map((c) => [c.row, c.numRows, c.numColumns])).toEqual([
    [3, 1, 5],
    [5, 1, 5],
  ]);
  for (const call of calls.slice(1)) {
    expect(typeof call.color).toBe("string");
    expect(call.color).not.toBe("");
  }
});

// Test-047（Task-010 期待値2）
test("除外する行がない場合、データ行の背景色が消され、新たな印は付かない", () => {
  const { sheet, calls } = createMarkableSheet(6);
  markExcludedRows(createSpreadsheet({ プレイ結果: sheet }), []);

  expect(calls).toEqual([
    { row: 2, column: 1, numRows: 5, numColumns: 5, color: null },
  ]);
});
