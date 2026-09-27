// Task-012: 入力用スプレッドシートの初期設定（Component-001 入力用スプレッドシート）
// シート「プレイ結果」「設定」がない場合のみ作る。既存のシートとデータは変更・削除しない（Quality-007）。
// 他のファイルの定数（GAS では同じ場所で動く）
/* global PLAY_SHEET_NAME, SETTINGS_SHEET_NAME, SETTING_LABEL_DISTRIBUTED_CHIPS, SETTING_LABEL_FORCED_LABOR_COUNT */

// Task-012: シート「プレイ結果」の見出し（Feature-001 条件1）
const PLAY_SHEET_HEADERS = [
  "プレイヤー名",
  "プレイ日付",
  "プレイ時間",
  "最終チップ数",
  "借金回数",
];

// Task-012: 強制労働の基準の回数 N の初期値（b1/Question-019）
const DEFAULT_FORCED_LABOR_COUNT = 10;

// Task-012: シート「プレイ結果」を見出しと入力規則付きで作る
// 入力規則：プレイ日付は日付、プレイ時間・最終チップ数・借金回数は 0 以上の数値（b1/Question-007 (a)、b1/Question-020）
function createPlaySheet(spreadsheet) {
  const sheet = spreadsheet.insertSheet(PLAY_SHEET_NAME);
  sheet
    .getRange(1, 1, 1, PLAY_SHEET_HEADERS.length)
    .setValues([PLAY_SHEET_HEADERS]);
  const dateRule = SpreadsheetApp.newDataValidation()
    .requireDate()
    .setAllowInvalid(false)
    .build();
  sheet.getRange("B2:B").setDataValidation(dateRule);
  for (const column of ["C", "D", "E"]) {
    const numberRule = SpreadsheetApp.newDataValidation()
      .requireNumberGreaterThanOrEqualTo(0)
      .setAllowInvalid(false)
      .build();
    sheet.getRange(`${column}2:${column}`).setDataValidation(numberRule);
  }
}

// Task-012: シート「設定」を初期値付きで作る（A 列に項目名、B 列に値。配布チップ数は空欄、N は 10：Feature-002、b1/Question-019）
function createSettingsSheet(spreadsheet) {
  const sheet = spreadsheet.insertSheet(SETTINGS_SHEET_NAME);
  sheet.getRange(1, 1, 2, 2).setValues([
    [SETTING_LABEL_DISTRIBUTED_CHIPS, ""],
    [SETTING_LABEL_FORCED_LABOR_COUNT, DEFAULT_FORCED_LABOR_COUNT],
  ]);
}

// Task-012: 入力用スプレッドシートの初期設定（メニュー「初期設定」から呼ばれる：Task-015）
// spreadsheet：入力用スプレッドシート（呼び出し元が SpreadsheetApp.getActiveSpreadsheet() を渡す）
function setupInputSpreadsheet(spreadsheet) {
  if (!spreadsheet.getSheetByName(PLAY_SHEET_NAME)) {
    createPlaySheet(spreadsheet);
  }
  if (!spreadsheet.getSheetByName(SETTINGS_SHEET_NAME)) {
    createSettingsSheet(spreadsheet);
  }
}

// ローカルのテスト用の公開（GAS 上では module がないため何もしない）
if (typeof module !== "undefined") {
  module.exports = { setupInputSpreadsheet };
}
