// Task-014: 集計の実行の処理の流れ（Component-002 集計の実行）
// 設定値の確認 → 行の確認と印付け → 集計 → 閲覧用への書き出し → ニックネームの候補の更新 → 管理者へのメッセージ
// メッセージの表示は引数 notify で受け取り、処理の流れから分ける（component-design.md 7.（テストのしやすさ））。
// 他のファイルの関数（GAS では同じ場所で動く）
/* global readSettings, readPlayRows, markExcludedRows, writeViewerSpreadsheet, updateNicknameOptions, validateRow, aggregateAllYears, aggregatePlayerStats */

// Task-014: 設定値が数値として使えるかを確かめる（空欄・数値でない値は不可：b1/Question-019）
function isValidSettingValue(value) {
  return typeof value === "number" && Number.isFinite(value);
}

// Task-014: 集計を実行する（メニュー「集計を反映」から呼ばれる：Task-015）
// spreadsheet：入力用スプレッドシート、notify：管理者へのメッセージを表示する関数
function runAggregation(spreadsheet, notify) {
  try {
    // 1. 設定値の確認。どちらかが空欄・誤った形式なら中止し、閲覧用スプレッドシートは更新しない（b1/Question-019）
    const settings = readSettings(spreadsheet);
    const invalidLabels = [];
    if (!isValidSettingValue(settings.distributedChips)) {
      invalidLabels.push("配布チップ数");
    }
    if (!isValidSettingValue(settings.forcedLaborCount)) {
      invalidLabels.push("強制労働の基準の回数 N");
    }
    if (invalidLabels.length > 0) {
      notify(
        `シート「設定」の${invalidLabels.join("・")}が空欄か、数値ではありません。数値を入力してから、もう一度「集計を反映」を実行してください。（集計は行っていません）`,
      );
      return;
    }

    // 2. 行の確認と印付け。無効な行は集計から除外し、印を付ける（前回の印は消してから付け直す：b1/Question-008）
    const validRows = [];
    const excludedRowNumbers = [];
    for (const row of readPlayRows(spreadsheet)) {
      const result = validateRow(row);
      if (result.valid) {
        validRows.push({
          nickname: result.nickname,
          playDate: row.playDate,
          playTime: row.playTime,
          finalChips: row.finalChips,
          debtCount: row.debtCount,
        });
      } else {
        excludedRowNumbers.push(row.rowNumber);
      }
    }
    markExcludedRows(spreadsheet, excludedRowNumbers);

    // 3. 全年分を集計し、閲覧用スプレッドシートの内容を置き換える（Decision-0006）
    const { years, rankingsByYear } = aggregateAllYears(validRows, settings);
    const playersByYear = aggregatePlayerStats(validRows, settings);
    const writeResult = writeViewerSpreadsheet(
      { years, rankingsByYear, playersByYear },
      new Date(),
    );
    if (!writeResult.ok) {
      notify(writeResult.message);
      return;
    }

    // ニックネームの候補を更新する（c1/Question-009）
    updateNicknameOptions(
      spreadsheet,
      validRows.map((row) => row.nickname),
    );

    // 4. 完了と、除外した行の数を知らせる（b1/Question-008）
    notify(
      `集計を反映しました。集計した行：${validRows.length} 件、除外した行：${excludedRowNumbers.length} 件` +
        (excludedRowNumbers.length > 0
          ? "（除外した行はシート「プレイ結果」で背景色が付いています）"
          : ""),
    );
  } catch (error) {
    // 詳細は GAS の標準の実行ログで確認する（component-design.md 7.（ログ・監視））
    console.error(error);
    notify(`集計を実行できませんでした。${error.message}`);
  }
}

// ローカルのテスト用の公開（GAS 上では module がないため何もしない）
if (typeof module !== "undefined") {
  module.exports = { runAggregation };
}
