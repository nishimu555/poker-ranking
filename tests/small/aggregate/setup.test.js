// Task-012: 入力用スプレッドシートの初期設定、Task-013: ニックネームの候補の更新の Small テスト
// GAS の SpreadsheetApp（スプレッドシート・シート・入力規則）は代用品（jest.fn()）に置き換える
// GAS では全ファイルが同じ場所で動くため、setup.js が使う定数をグローバルに置いてから読み込む
Object.assign(global, require("../../../src/aggregate/input-access"));
const {
  setupInputSpreadsheet,
  updateNicknameOptions,
} = require("../../../src/aggregate/setup");

// 代用品のシートを作る。値・入力規則の書き込みと、変更の操作を記録する
function createSheet(name, initialValues = []) {
  const sheet = {
    name,
    values: initialValues.map((r) => [...r]),
    validations: {},
    changes: [],
    getRange: jest.fn((a1OrRow, column, numRows, numColumns) => {
      const range = {
        setValues: jest.fn((values) => {
          sheet.changes.push("setValues");
          const row = a1OrRow;
          values.forEach((r, i) => {
            sheet.values[row - 1 + i] = [...r];
          });
          expect(values).toHaveLength(numRows);
          values.forEach((r) => expect(r).toHaveLength(numColumns));
        }),
        setDataValidation: jest.fn((rule) => {
          sheet.changes.push("setDataValidation");
          sheet.validations[a1OrRow] = rule;
        }),
      };
      return range;
    }),
    clear: jest.fn(() => sheet.changes.push("clear")),
    clearContents: jest.fn(() => sheet.changes.push("clearContents")),
    deleteRows: jest.fn(() => sheet.changes.push("deleteRows")),
  };
  return sheet;
}

// 代用品のスプレッドシートを作る（sheets：シート名 → 代用品のシート）
function createSpreadsheet(sheets = {}) {
  return {
    sheets,
    getSheetByName: jest.fn((name) => sheets[name] || null),
    insertSheet: jest.fn((name) => {
      sheets[name] = createSheet(name);
      return sheets[name];
    }),
    deleteSheet: jest.fn(),
  };
}

// 入力規則の代用品（作った規則の種類を記録する）
beforeEach(() => {
  global.SpreadsheetApp = {
    newDataValidation: jest.fn(() => {
      // allowInvalid は、setAllowInvalid を呼んだ場合のみ値が入る
      const rule = { kind: null, allowInvalid: undefined };
      const builder = {
        requireValueInList: jest.fn((values, showDropdown) => {
          rule.kind = "list";
          rule.values = values;
          rule.showDropdown = showDropdown;
          return builder;
        }),
        requireDate: jest.fn(() => {
          rule.kind = "date";
          return builder;
        }),
        requireNumberGreaterThanOrEqualTo: jest.fn((min) => {
          rule.kind = "number";
          rule.min = min;
          return builder;
        }),
        requireNumberBetween: jest.fn(() => {
          rule.kind = "number";
          return builder;
        }),
        setAllowInvalid: jest.fn((allow) => {
          rule.allowInvalid = allow;
          return builder;
        }),
        build: jest.fn(() => rule),
      };
      return builder;
    }),
  };
});

afterEach(() => {
  delete global.SpreadsheetApp;
});

// Test-052（Task-012 期待値1）
test("シートがない場合、シート「プレイ結果」が 5 列の見出しで作られ、日付・数値の入力規則が設定される", () => {
  const spreadsheet = createSpreadsheet();

  setupInputSpreadsheet(spreadsheet);

  const sheet = spreadsheet.sheets["プレイ結果"];
  expect(sheet).toBeDefined();
  expect(sheet.values[0]).toEqual([
    "プレイヤー名",
    "プレイ日付",
    "プレイ時間",
    "最終チップ数",
    "借金回数",
  ]);
  // プレイ日付（B 列）に日付、プレイ時間・最終チップ数・借金回数（C〜E 列）に数値の入力規則
  expect(sheet.validations["B2:B"].kind).toBe("date");
  expect(sheet.validations["C2:C"].kind).toBe("number");
  expect(sheet.validations["D2:D"].kind).toBe("number");
  expect(sheet.validations["E2:E"].kind).toBe("number");
});

// Test-053（Task-012 期待値2）
test("シートがない場合、シート「設定」に配布チップ数（空欄）と N（10）が作られる", () => {
  const spreadsheet = createSpreadsheet();

  setupInputSpreadsheet(spreadsheet);

  const sheet = spreadsheet.sheets["設定"];
  expect(sheet).toBeDefined();
  expect(sheet.values).toEqual([
    ["配布チップ数", ""],
    ["強制労働の基準の回数 N", 10],
  ]);
});

// Test-054（Task-012 期待値3）
test("シート「プレイ結果」「設定」がすでにあり、データが入っている場合、既存のシートとデータは変更・削除されない", () => {
  const playValues = [
    ["プレイヤー名", "プレイ日付", "プレイ時間", "最終チップ数", "借金回数"],
    ["ナッツ", new Date(2026, 8, 13), 1.5, 25000, 1],
  ];
  const settingValues = [
    ["配布チップ数", 20000],
    ["強制労働の基準の回数 N", 8],
  ];
  const play = createSheet("プレイ結果", playValues);
  const settings = createSheet("設定", settingValues);
  const spreadsheet = createSpreadsheet({ プレイ結果: play, 設定: settings });

  setupInputSpreadsheet(spreadsheet);

  expect(spreadsheet.insertSheet).not.toHaveBeenCalled();
  expect(spreadsheet.deleteSheet).not.toHaveBeenCalled();
  expect(play.changes).toEqual([]);
  expect(settings.changes).toEqual([]);
  expect(play.values).toEqual(playValues);
  expect(settings.values).toEqual(settingValues);
});

// Test-055（Task-013 期待値1）
test("ニックネーム「ナッツ」「 ナッツ」「リバー」の候補は「ナッツ」「リバー」の 2 つ", () => {
  const play = createSheet("プレイ結果");
  const spreadsheet = createSpreadsheet({ プレイ結果: play });

  updateNicknameOptions(spreadsheet, ["ナッツ", " ナッツ", "リバー"]);

  const rule = play.validations["A2:A"];
  expect(rule.kind).toBe("list");
  expect(rule.values).toEqual(["ナッツ", "リバー"]);
});

// Test-056（Task-013 期待値2）
test("候補を設定すると、候補にない名前の入力を拒否しない設定になる", () => {
  const play = createSheet("プレイ結果");
  const spreadsheet = createSpreadsheet({ プレイ結果: play });

  updateNicknameOptions(spreadsheet, ["ナッツ", "リバー"]);

  expect(play.validations["A2:A"].allowInvalid).toBe(true);
});
