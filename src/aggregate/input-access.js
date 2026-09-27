// Task-009: 入力用スプレッドシートの読み込み（Component-004 データアクセス（集計用））
// GAS の SpreadsheetApp を使う処理をここに集める。スプレッドシートは呼び出し元から受け取る。

// Task-009: シート名（Component-001）
const PLAY_SHEET_NAME = "プレイ結果";
const SETTINGS_SHEET_NAME = "設定";

// Task-009: シート「プレイ結果」の列数（プレイヤー名、プレイ日付、プレイ時間、最終チップ数、借金回数：Feature-001）
const PLAY_COLUMN_COUNT = 5;

// Task-009: シート「設定」の項目名（A 列に項目名、B 列に値：Feature-002）
const SETTING_LABEL_DISTRIBUTED_CHIPS = "配布チップ数";
const SETTING_LABEL_FORCED_LABOR_COUNT = "強制労働の基準の回数 N";

// Task-009: 名前でシートを取り出す。ない場合は、初期設定を案内するエラーにする
function getRequiredSheet(spreadsheet, sheetName) {
  const sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error(
      `シート「${sheetName}」がありません。メニューの「初期設定」を実行してください。`,
    );
  }
  return sheet;
}

// Task-009: シート「プレイ結果」の見出し行を除く全行を、シート上の行番号付きで読み込む
// 戻り値：[{ rowNumber, playerName, playDate, playTime, finalChips, debtCount }]（値はセルの値のまま。確認は Task-004）
function readPlayRows(spreadsheet) {
  const sheet = getRequiredSheet(spreadsheet, PLAY_SHEET_NAME);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return [];
  }
  const values = sheet
    .getRange(2, 1, lastRow - 1, PLAY_COLUMN_COUNT)
    .getValues();
  return values.map((cells, index) => ({
    rowNumber: index + 2,
    playerName: cells[0],
    playDate: cells[1],
    playTime: cells[2],
    finalChips: cells[3],
    debtCount: cells[4],
  }));
}

// Task-009: シート「設定」の配布チップ数・N を読み込む
// 戻り値：{ distributedChips, forcedLaborCount }。空欄はセルの値（空文字）のまま、項目名がない場合は null を返す（判断は Task-014：b1/Question-019）
function readSettings(spreadsheet) {
  const values = getRequiredSheet(spreadsheet, SETTINGS_SHEET_NAME)
    .getDataRange()
    .getValues();
  const findValue = (label) => {
    const found = values.find((cells) => cells[0] === label);
    return found ? found[1] : null;
  };
  return {
    distributedChips: findValue(SETTING_LABEL_DISTRIBUTED_CHIPS),
    forcedLaborCount: findValue(SETTING_LABEL_FORCED_LABOR_COUNT),
  };
}

// ローカルのテスト用の公開（GAS 上では module がないため何もしない）
if (typeof module !== "undefined") {
  module.exports = {
    PLAY_SHEET_NAME,
    SETTINGS_SHEET_NAME,
    SETTING_LABEL_DISTRIBUTED_CHIPS,
    SETTING_LABEL_FORCED_LABOR_COUNT,
    readPlayRows,
    readSettings,
  };
}
