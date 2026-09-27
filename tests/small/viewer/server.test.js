// Task-017: データの取得、Task-018: 画面の返却の Small テスト
// GAS の PropertiesService・SpreadsheetApp・HtmlService は代用品（jest.fn()）に置き換える
const { getViewerData, doGet } = require("../../../src/viewer/server");

// 代用品のシートを作る（values：見出し行を含む全セルの値）
function createSheet(values) {
  return {
    getDataRange: jest.fn(() => ({ getValues: jest.fn(() => values) })),
  };
}

const aggregatedAt = new Date(2026, 8, 26, 21, 5);

// 2025 年・2026 年の結果を持つ閲覧用スプレッドシートの代用品
function createViewerSpreadsheet() {
  const sheets = {
    集計情報: createSheet([
      ["集計日時", "集計済みの年"],
      [aggregatedAt, "2025,2026"],
    ]),
    ランキング: createSheet([
      [
        "年",
        "ランキングの種類",
        "順位",
        "ニックネーム",
        "値",
        "参加日数",
        "強制労働の該当",
      ],
      [2025, "アベレージ", 1, "古株", 1000, 1, ""],
      [2025, "累計", 1, "古株", 1000, 1, ""],
      [2026, "アベレージ", 1, "ナッツ", 22100, 2, ""],
      [2026, "アベレージ", 2, "リバー", -4400, 1, ""],
      [2026, "累計", 1, "ナッツ", 44200, 2, ""],
      [2026, "累計", 2, "リバー", -8800, 1, ""],
      [2026, "強制労働への道のり", 1, "リバー", -8800, 1, false],
    ]),
    個人の戦績: createSheet([
      [
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
      ],
      [2025, "古株", 1, 2, 1000, 1000, 0, 201000, 1, 1, ""],
      [2026, "ナッツ", 2, 3.5, 44200, 22100, 0, 244200, 1, 1, ""],
      [2026, "リバー", 1, 2, -8800, -4400, 1, 191200, 2, 2, 1],
    ]),
    履歴: createSheet([
      [
        "年",
        "ニックネーム",
        "実施日",
        "プレイ時間",
        "最終チップ数",
        "借金回数",
        "収支",
      ],
      [2025, "古株", new Date(2025, 4, 1), 2, 1000, 0, 1000],
      [2026, "ナッツ", new Date(2026, 8, 13), 2, 30000, 0, 30000],
      [2026, "ナッツ", new Date(2026, 7, 30), 1.5, 14200, 0, 14200],
      [2026, "リバー", new Date(2026, 8, 13), 2, 11200, 1, -8800],
    ]),
  };
  return { getSheetByName: jest.fn((name) => sheets[name] || null) };
}

// スクリプトプロパティと SpreadsheetApp の代用品をグローバルに置く
function setUpGas(viewerSpreadsheetId, openById) {
  global.PropertiesService = {
    getScriptProperties: jest.fn(() => ({
      getProperty: jest.fn((key) =>
        key === "VIEWER_SPREADSHEET_ID" ? viewerSpreadsheetId : null,
      ),
    })),
  };
  global.SpreadsheetApp = { openById: jest.fn(openById) };
}

afterEach(() => {
  delete global.PropertiesService;
  delete global.SpreadsheetApp;
});

// Task-017 期待値1
test("年 2026 を指定すると、2026 年のランキング・個人の戦績・履歴のみと、集計日時、年の一覧（2025、2026）が返る", () => {
  setUpGas("viewer-id", () => createViewerSpreadsheet());

  const data = getViewerData(2026);

  expect(data.ok).toBe(true);
  expect(data.year).toBe(2026);
  expect(data.years).toEqual([2025, 2026]);
  expect(data.aggregatedAt).toBe("2026/09/26 21:05");
  expect(data.rankings.average.map((e) => e.nickname)).toEqual([
    "ナッツ",
    "リバー",
  ]);
  expect(data.rankings.total.map((e) => e.nickname)).toEqual([
    "ナッツ",
    "リバー",
  ]);
  expect(data.rankings.forcedLabor).toEqual([
    {
      rank: 1,
      nickname: "リバー",
      value: -8800,
      days: 1,
      isForcedLabor: false,
    },
  ]);
  expect(data.players.map((p) => p.nickname)).toEqual(["ナッツ", "リバー"]);
  expect(data.players[0].ranks).toEqual({
    average: 1,
    total: 1,
    forcedLabor: null,
  });
  expect(data.history["ナッツ"].map((h) => h.playDate)).toEqual([
    "2026/09/13",
    "2026/08/30",
  ]);
  expect(data.history["古株"]).toBeUndefined();
});

// Task-017 期待値2
test("年を指定しない場合、集計済みの年のうち最新の年（2026）の結果が返る", () => {
  setUpGas("viewer-id", () => createViewerSpreadsheet());

  const data = getViewerData();

  expect(data.ok).toBe(true);
  expect(data.year).toBe(2026);
  expect(data.players.map((p) => p.nickname)).toEqual(["ナッツ", "リバー"]);
});

// Task-017 期待値3
test("閲覧用スプレッドシートを開けない場合（共有されていないアカウント）、データを返さず閲覧できない旨を返す", () => {
  setUpGas("viewer-id", () => {
    throw new Error(
      "You do not have permission to access the requested document.",
    );
  });

  const data = getViewerData(2026);

  expect(data.ok).toBe(false);
  expect(typeof data.message).toBe("string");
  expect(data.rankings).toBeUndefined();
  expect(data.players).toBeUndefined();
  expect(data.history).toBeUndefined();
});

// Task-017 期待値4
test("スクリプトプロパティ VIEWER_SPREADSHEET_ID が未設定の場合、データを返さず閲覧できない旨を返す", () => {
  setUpGas(null, () => createViewerSpreadsheet());

  const data = getViewerData(2026);

  expect(data.ok).toBe(false);
  expect(typeof data.message).toBe("string");
  expect(data.rankings).toBeUndefined();
  expect(global.SpreadsheetApp.openById).not.toHaveBeenCalled();
});

// Task-018 期待値1
test("Web アプリを開くと、画面の HTML が返り、タイトルは「POKER RANKING」、スマートフォン向けの表示設定（viewport）が付く", () => {
  const output = { title: null, metaTags: {} };
  output.setTitle = jest.fn((title) => {
    output.title = title;
    return output;
  });
  output.addMetaTag = jest.fn((name, content) => {
    output.metaTags[name] = content;
    return output;
  });
  global.HtmlService = {
    createHtmlOutputFromFile: jest.fn(() => output),
  };

  const result = doGet();

  expect(global.HtmlService.createHtmlOutputFromFile).toHaveBeenCalledWith(
    "index",
  );
  expect(result).toBe(output);
  expect(output.title).toBe("POKER RANKING");
  expect(output.metaTags.viewport).toContain("width=device-width");
  delete global.HtmlService;
});
