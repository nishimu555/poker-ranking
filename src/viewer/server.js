// Task-017: データの取得（Component-006 Web アプリ：サーバー側）
// 閲覧用スプレッドシート（Component-005）から、指定した年の集計結果を読み込んで画面に返す。
// Web アプリはアクセスしたユーザーとして実行するため、共有されていないアカウントでは読み込めない（Decision-0001）。

// Task-017: 閲覧用スプレッドシートの ID を置くスクリプトプロパティの名前（c1/Question-008）
const VIEWER_SPREADSHEET_ID_PROPERTY = "VIEWER_SPREADSHEET_ID";

// Task-017: 閲覧できない場合に画面に返す文言（データは返さない：Quality-001、component-design.md 7.（エラー処理））
const NOT_VIEWABLE_MESSAGE =
  "閲覧できません。このページを閲覧するには、管理者からの招待が必要です。";

// Task-017: ランキングの種類の表示名（閲覧用スプレッドシートの値）と、画面に返す際の名前
const RANKING_KINDS = {
  アベレージ: "average",
  累計: "total",
  強制労働への道のり: "forcedLabor",
};

// Task-017: 数値を 2 桁の文字列にする
function pad2(value) {
  return String(value).padStart(2, "0");
}

// Task-017: 日付を「yyyy/MM/dd」の文字列にする（google.script.run は Date を画面に渡せないため）
function formatDate(date) {
  return `${date.getFullYear()}/${pad2(date.getMonth() + 1)}/${pad2(date.getDate())}`;
}

// Task-017: 日時を「yyyy/MM/dd HH:mm」の文字列にする
function formatDateTime(date) {
  return `${formatDate(date)} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

// Task-017: 空欄の順位は null にする（強制労働への道のりの対象外：Feature-010 条件2-2）
function toRankOrNull(value) {
  return value === "" || value === null || value === undefined
    ? null
    : Number(value);
}

// Task-017: シートの見出し行を除くデータ行を読み込む
function readDataRows(spreadsheet, sheetName) {
  const sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error(`シート「${sheetName}」がありません。`);
  }
  return sheet.getDataRange().getValues().slice(1);
}

// Task-017: 集計情報（集計日時と、集計済みの年の一覧（昇順））を読み込む
function readSummary(spreadsheet) {
  const [row] = readDataRows(spreadsheet, "集計情報");
  if (!row) {
    return { aggregatedAt: null, years: [] };
  }
  const years = String(row[1])
    .split(",")
    .map((y) => y.trim())
    .filter((y) => y !== "")
    .map(Number)
    .sort((a, b) => a - b);
  return {
    aggregatedAt: row[0] instanceof Date ? formatDateTime(row[0]) : null,
    years,
  };
}

// Task-017: 指定した年の 3 つのランキングを読み込む
function readRankings(spreadsheet, year) {
  const rankings = { average: [], total: [], forcedLabor: [] };
  for (const row of readDataRows(spreadsheet, "ランキング")) {
    const kind = RANKING_KINDS[row[1]];
    if (Number(row[0]) !== year || !kind) {
      continue;
    }
    const entry = {
      rank: Number(row[2]),
      nickname: String(row[3]),
      value: Number(row[4]),
      days: Number(row[5]),
    };
    if (kind === "forcedLabor") {
      entry.isForcedLabor = row[6] === true;
    }
    rankings[kind].push(entry);
  }
  return rankings;
}

// Task-017: 指定した年の個人の戦績を読み込む
function readPlayers(spreadsheet, year) {
  return readDataRows(spreadsheet, "個人の戦績")
    .filter((row) => Number(row[0]) === year)
    .map((row) => ({
      nickname: String(row[1]),
      days: Number(row[2]),
      totalPlayTime: Number(row[3]),
      totalBalance: Number(row[4]),
      averageChips: Number(row[5]),
      totalDebtCount: Number(row[6]),
      remainingChips: Number(row[7]),
      ranks: {
        average: toRankOrNull(row[8]),
        total: toRankOrNull(row[9]),
        forcedLabor: toRankOrNull(row[10]),
      },
    }));
}

// Task-017: 指定した年の履歴を、ニックネームごとに読み込む（閲覧用スプレッドシートの並び（新しい日付から）のまま）
function readHistory(spreadsheet, year) {
  const history = {};
  for (const row of readDataRows(spreadsheet, "履歴")) {
    if (Number(row[0]) !== year) {
      continue;
    }
    const nickname = String(row[1]);
    if (!history[nickname]) {
      history[nickname] = [];
    }
    history[nickname].push({
      playDate: row[2] instanceof Date ? formatDate(row[2]) : String(row[2]),
      playTime: Number(row[3]),
      finalChips: Number(row[4]),
      debtCount: Number(row[5]),
      balance: Number(row[6]),
    });
  }
  return history;
}

// Task-017: 画面から google.script.run で呼ばれる。年を指定して集計結果を返す
// year：表示する年。指定しない場合・集計済みの年にない場合は、最新の年（c1/Question-020）
// 戻り値：{ ok: true, year, years, aggregatedAt, rankings, players, history } または { ok: false, message }
function getViewerData(year) {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty(
    VIEWER_SPREADSHEET_ID_PROPERTY,
  );
  if (!spreadsheetId) {
    console.error(
      `スクリプトプロパティ ${VIEWER_SPREADSHEET_ID_PROPERTY} が設定されていません。`,
    );
    return { ok: false, message: NOT_VIEWABLE_MESSAGE };
  }
  let spreadsheet;
  try {
    // 共有されていないアカウントでは例外になる（Decision-0001）
    spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  } catch (error) {
    console.warn(error);
    return { ok: false, message: NOT_VIEWABLE_MESSAGE };
  }
  try {
    const summary = readSummary(spreadsheet);
    const requested = Number(year);
    const selectedYear = summary.years.includes(requested)
      ? requested
      : summary.years.length > 0
        ? summary.years[summary.years.length - 1]
        : null;
    return {
      ok: true,
      year: selectedYear,
      years: summary.years,
      aggregatedAt: summary.aggregatedAt,
      rankings: readRankings(spreadsheet, selectedYear),
      players: readPlayers(spreadsheet, selectedYear),
      history: readHistory(spreadsheet, selectedYear),
    };
  } catch (error) {
    // 詳細は GAS の標準の実行ログで確認する（component-design.md 7.（ログ・監視））
    console.error(error);
    return { ok: false, message: NOT_VIEWABLE_MESSAGE };
  }
}

// ローカルのテスト用の公開（GAS 上では module がないため何もしない）
if (typeof module !== "undefined") {
  module.exports = { getViewerData };
}
