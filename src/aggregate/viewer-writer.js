// Task-011: 閲覧用スプレッドシートへの書き出し（Component-004 データアクセス（集計用）、Component-005 閲覧用スプレッドシート）
// 集計結果で閲覧用スプレッドシートの 4 シートの内容を置き換える（Decision-0006）。
// 書き出す列は component-design.md 5. のシート構成のみとし、ニックネーム以外の個人を特定できる情報を含めない（Quality-008）。

// Task-011: 閲覧用スプレッドシートの ID を置くスクリプトプロパティの名前（c1/Question-008）
const VIEWER_SPREADSHEET_ID_KEY = "VIEWER_SPREADSHEET_ID";

// Task-011: ランキングの種類の表示名（component-design.md 5.、8.）
const RANKING_KIND_LABELS = {
  average: "アベレージ",
  total: "累計",
  forcedLabor: "強制労働への道のり",
};

// Task-011: シートごとの見出し（component-design.md 5. 閲覧用スプレッドシートのシート構成）
const VIEWER_SHEET_HEADERS = {
  集計情報: ["集計日時", "集計済みの年"],
  ランキング: [
    "年",
    "ランキングの種類",
    "順位",
    "ニックネーム",
    "値",
    "参加日数",
    "強制労働の該当",
  ],
  個人の戦績: [
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
  履歴: [
    "年",
    "ニックネーム",
    "実施日",
    "プレイ時間",
    "最終チップ数",
    "借金回数",
    "収支",
  ],
};

// Task-011: 値がない欄は空欄にする（強制労働への道のりの対象外の順位等：Feature-010 条件2-2）
function toCellValue(value) {
  return value === null || value === undefined ? "" : value;
}

// Task-011: シート「集計情報」の行（集計済みの年は「,」区切りの文字列）
function buildSummaryRows(aggregation, aggregatedAt) {
  return [[aggregatedAt, aggregation.years.join(",")]];
}

// Task-011: シート「ランキング」の行（年ごとに、アベレージ・累計・強制労働への道のりの順）
function buildRankingRows(aggregation) {
  const rows = [];
  for (const year of aggregation.years) {
    const rankings = aggregation.rankingsByYear[year];
    const daysByNickname = new Map(
      aggregation.playersByYear[year].map((p) => [p.nickname, p.days]),
    );
    for (const kind of Object.keys(RANKING_KIND_LABELS)) {
      for (const entry of rankings[kind]) {
        rows.push([
          year,
          RANKING_KIND_LABELS[kind],
          entry.rank,
          entry.nickname,
          entry.value,
          daysByNickname.get(entry.nickname),
          kind === "forcedLabor" ? entry.isForcedLabor : "",
        ]);
      }
    }
  }
  return rows;
}

// Task-011: シート「個人の戦績」の行
function buildPlayerRows(aggregation) {
  const rows = [];
  for (const year of aggregation.years) {
    for (const p of aggregation.playersByYear[year]) {
      rows.push([
        year,
        p.nickname,
        p.days,
        p.totalPlayTime,
        p.totalBalance,
        p.averageChips,
        p.totalDebtCount,
        p.remainingChips,
        toCellValue(p.ranks.average),
        toCellValue(p.ranks.total),
        toCellValue(p.ranks.forcedLabor),
      ]);
    }
  }
  return rows;
}

// Task-011: シート「履歴」の行（プレイヤーごとに、新しい日付から）
function buildHistoryRows(aggregation) {
  const rows = [];
  for (const year of aggregation.years) {
    for (const p of aggregation.playersByYear[year]) {
      for (const h of p.history) {
        rows.push([
          year,
          p.nickname,
          h.playDate,
          h.playTime,
          h.finalChips,
          h.debtCount,
          h.balance,
        ]);
      }
    }
  }
  return rows;
}

// Task-011（c2/ai-review-001）: 文字列を書き込む列（1 から数えた列番号）
// 書式なしテキストにしてから書き込み、「=」で始まる文字列が数式に、数字の文字列が数値に解釈されないようにする
const VIEWER_TEXT_COLUMNS = {
  集計情報: [2],
  ランキング: [2, 4],
  個人の戦績: [2],
  履歴: [2],
};

// Task-011: シートの前回の内容を消し、見出しと行を書き込む。シートがない場合は作る
function replaceSheetValues(spreadsheet, sheetName, rows) {
  const sheet =
    spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
  const values = [VIEWER_SHEET_HEADERS[sheetName], ...rows];
  sheet.clearContents();
  // c2/ai-review-001: 文字列の列を書式なしテキストにする（component-design.md 7.（改ざん：意図しない表示・動作の防止））
  for (const column of VIEWER_TEXT_COLUMNS[sheetName]) {
    sheet.getRange(1, column, values.length, 1).setNumberFormat("@");
  }
  sheet.getRange(1, 1, values.length, values[0].length).setValues(values);
}

// Task-011: 集計結果で閲覧用スプレッドシートの 4 シートの内容を置き換える
// aggregation：{ years, rankingsByYear（Task-007）, playersByYear（Task-008） }、aggregatedAt：集計日時
// 戻り値：{ ok: true } または { ok: false, message }（失敗は呼び出し元（Task-014）で管理者に知らせる）
function writeViewerSpreadsheet(aggregation, aggregatedAt) {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty(
    VIEWER_SPREADSHEET_ID_KEY,
  );
  if (!spreadsheetId) {
    return {
      ok: false,
      message: `スクリプトプロパティ ${VIEWER_SPREADSHEET_ID_KEY} が設定されていないため、閲覧用スプレッドシートを更新できませんでした。`,
    };
  }
  try {
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    replaceSheetValues(
      spreadsheet,
      "集計情報",
      buildSummaryRows(aggregation, aggregatedAt),
    );
    replaceSheetValues(
      spreadsheet,
      "ランキング",
      buildRankingRows(aggregation),
    );
    replaceSheetValues(spreadsheet, "個人の戦績", buildPlayerRows(aggregation));
    replaceSheetValues(spreadsheet, "履歴", buildHistoryRows(aggregation));
    return { ok: true };
  } catch (error) {
    // 詳細は GAS の標準の実行ログで確認する（component-design.md 7.（ログ・監視、エラー処理））
    console.error(error);
    return {
      ok: false,
      message:
        "閲覧用スプレッドシートへの書き出しに失敗しました。詳細は実行ログを確認してください。",
    };
  }
}

// ローカルのテスト用の公開（GAS 上では module がないため何もしない）
if (typeof module !== "undefined") {
  module.exports = { writeViewerSpreadsheet };
}
