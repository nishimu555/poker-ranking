// Task-011: 閲覧用スプレッドシートへの書き出しの Small テスト
// GAS の PropertiesService・SpreadsheetApp は代用品（jest.fn()）に置き換える
const {
  writeViewerSpreadsheet,
} = require("../../../src/aggregate/viewer-writer");

// 代用品のシートを作る。clearContents・setValues の呼び出しを events に順に記録する
// 表示形式の設定（setNumberFormat）は formats に記録する（c2/ai-review-001 の対応で追加した呼び出しの代用品）
function createSheet(name, events) {
  const sheet = {
    name,
    values: [["前回の内容"]],
    formats: [],
    clearContents: jest.fn(() => {
      events.push(["clear", name]);
      sheet.values = [];
    }),
    getRange: jest.fn((row, column, numRows, numColumns) => ({
      setNumberFormat: jest.fn((format) => {
        sheet.formats.push({ row, column, numRows, numColumns, format });
      }),
      setValues: jest.fn((values) => {
        events.push(["write", name]);
        expect(values).toHaveLength(numRows);
        for (const r of values) {
          expect(r).toHaveLength(numColumns);
        }
        sheet.values = values;
      }),
    })),
  };
  return sheet;
}

// 代用品の閲覧用スプレッドシートを作る（4 シートがある状態）
function createViewerSpreadsheet() {
  const events = [];
  const sheets = {};
  for (const name of ["集計情報", "ランキング", "個人の戦績", "履歴"]) {
    sheets[name] = createSheet(name, events);
  }
  return {
    events,
    sheets,
    spreadsheet: {
      getSheetByName: jest.fn((name) => sheets[name] || null),
      insertSheet: jest.fn((name) => {
        sheets[name] = createSheet(name, events);
        return sheets[name];
      }),
    },
  };
}

// スクリプトプロパティと SpreadsheetApp の代用品をグローバルに置く
function setUpGas(viewerSpreadsheetId, viewer) {
  global.PropertiesService = {
    getScriptProperties: jest.fn(() => ({
      getProperty: jest.fn((key) =>
        key === "VIEWER_SPREADSHEET_ID" ? viewerSpreadsheetId : null,
      ),
    })),
  };
  global.SpreadsheetApp = {
    openById: jest.fn(() => viewer.spreadsheet),
  };
}

afterEach(() => {
  delete global.PropertiesService;
  delete global.SpreadsheetApp;
});

const aggregatedAt = new Date(2026, 8, 27, 11, 0);
const playDate1 = new Date(2026, 8, 13);
const playDate2 = new Date(2026, 7, 30);

// 集計結果（Task-007 aggregateAllYears、Task-008 aggregatePlayerStats の戻り値の形）
// A：基準値 44200（強制労働への道のりの対象外）、B：基準値 -8800
const aggregation = {
  years: [2026],
  rankingsByYear: {
    2026: {
      average: [
        { nickname: "A", value: 22100, rank: 1 },
        { nickname: "B", value: -4400, rank: 2 },
      ],
      total: [
        { nickname: "A", value: 44200, rank: 1 },
        { nickname: "B", value: -8800, rank: 2 },
      ],
      forcedLabor: [
        { nickname: "B", value: -8800, rank: 1, isForcedLabor: false },
      ],
    },
  },
  playersByYear: {
    2026: [
      {
        nickname: "A",
        days: 2,
        totalPlayTime: 3.5,
        totalBalance: 44200,
        averageChips: 22100,
        totalDebtCount: 0,
        remainingChips: 244200,
        ranks: { average: 1, total: 1, forcedLabor: null },
        history: [
          {
            playDate: playDate1,
            playTime: 2,
            finalChips: 30000,
            debtCount: 0,
            balance: 30000,
          },
          {
            playDate: playDate2,
            playTime: 1.5,
            finalChips: 14200,
            debtCount: 0,
            balance: 14200,
          },
        ],
      },
      {
        nickname: "B",
        days: 1,
        totalPlayTime: 2,
        totalBalance: -8800,
        averageChips: -4400,
        totalDebtCount: 1,
        remainingChips: 191200,
        ranks: { average: 2, total: 2, forcedLabor: 1 },
        history: [
          {
            playDate: playDate1,
            playTime: 2,
            finalChips: 11200,
            debtCount: 1,
            balance: -8800,
          },
        ],
      },
    ],
  },
};

// Task-011 期待値1
test("4 シートの前回の内容が消され、集計情報・ランキング・個人の戦績・履歴の各行が書き込まれる", () => {
  const viewer = createViewerSpreadsheet();
  setUpGas("viewer-id", viewer);

  const result = writeViewerSpreadsheet(aggregation, aggregatedAt);

  expect(result.ok).toBe(true);
  expect(global.SpreadsheetApp.openById).toHaveBeenCalledWith("viewer-id");
  // 各シートは前回の内容を消してから書き込む
  for (const name of ["集計情報", "ランキング", "個人の戦績", "履歴"]) {
    const sheetEvents = viewer.events.filter((e) => e[1] === name);
    expect(sheetEvents).toEqual([
      ["clear", name],
      ["write", name],
    ]);
  }
  // 集計情報：集計日時、集計済みの年
  expect(viewer.sheets["集計情報"].values.slice(1)).toEqual([
    [aggregatedAt, "2026"],
  ]);
  // ランキング：年、種類、順位、ニックネーム、値、参加日数、強制労働の該当
  expect(viewer.sheets["ランキング"].values.slice(1)).toEqual([
    [2026, "アベレージ", 1, "A", 22100, 2, ""],
    [2026, "アベレージ", 2, "B", -4400, 1, ""],
    [2026, "累計", 1, "A", 44200, 2, ""],
    [2026, "累計", 2, "B", -8800, 1, ""],
    [2026, "強制労働への道のり", 1, "B", -8800, 1, false],
  ]);
  // 個人の戦績
  expect(viewer.sheets["個人の戦績"].values.slice(1)).toEqual([
    [2026, "A", 2, 3.5, 44200, 22100, 0, 244200, 1, 1, ""],
    [2026, "B", 1, 2, -8800, -4400, 1, 191200, 2, 2, 1],
  ]);
  // 履歴
  expect(viewer.sheets["履歴"].values.slice(1)).toEqual([
    [2026, "A", playDate1, 2, 30000, 0, 30000],
    [2026, "A", playDate2, 1.5, 14200, 0, 14200],
    [2026, "B", playDate1, 2, 11200, 1, -8800],
  ]);
});

// Task-011 期待値2
test("強制労働への道のりの対象外のプレイヤーは、個人の戦績のその順位の欄が空欄", () => {
  const viewer = createViewerSpreadsheet();
  setUpGas("viewer-id", viewer);

  writeViewerSpreadsheet(aggregation, aggregatedAt);

  const header = viewer.sheets["個人の戦績"].values[0];
  const column = header.indexOf("強制労働への道のりの順位");
  const rowA = viewer.sheets["個人の戦績"].values.find((r) => r[1] === "A");
  expect(column).toBeGreaterThanOrEqual(0);
  expect(rowA[column]).toBe("");
});

// Task-011 期待値3
test("スクリプトプロパティ VIEWER_SPREADSHEET_ID が未設定の場合、書き出しを行わず失敗を返す", () => {
  const viewer = createViewerSpreadsheet();
  setUpGas(null, viewer);

  const result = writeViewerSpreadsheet(aggregation, aggregatedAt);

  expect(result.ok).toBe(false);
  expect(typeof result.message).toBe("string");
  expect(global.SpreadsheetApp.openById).not.toHaveBeenCalled();
  expect(viewer.events).toEqual([]);
});

// Task-011 期待値4
test("書き出す列は component-design.md 5. のシート構成のみ", () => {
  const viewer = createViewerSpreadsheet();
  setUpGas("viewer-id", viewer);

  writeViewerSpreadsheet(aggregation, aggregatedAt);

  expect(viewer.sheets["集計情報"].values[0]).toEqual([
    "集計日時",
    "集計済みの年",
  ]);
  expect(viewer.sheets["ランキング"].values[0]).toEqual([
    "年",
    "ランキングの種類",
    "順位",
    "ニックネーム",
    "値",
    "参加日数",
    "強制労働の該当",
  ]);
  expect(viewer.sheets["個人の戦績"].values[0]).toEqual([
    "年",
    "ニックネーム",
    "参加日数",
    "合計プレイ時間",
    "収支の累計",
    "平均値チップ数",
    "借金回数の累計",
    "強制労働までの残りチップ数",
    "アベレージランキングの順位",
    "累計ランキングの順位",
    "強制労働への道のりの順位",
  ]);
  expect(viewer.sheets["履歴"].values[0]).toEqual([
    "年",
    "ニックネーム",
    "実施日",
    "プレイ時間",
    "最終チップ数",
    "借金回数",
    "収支",
  ]);
});
