// Task-015: メニュー（Component-002 集計の実行）
// 入力用スプレッドシートを開いたときに、メニュー「集計を反映」「初期設定」を追加する（Decision-0002、c1/Question-009）。
// 集計のメニューは入力用スプレッドシート（閲覧者に共有しない）にのみ置く（component-design.md 7.（権限昇格））。
// 他のファイルの関数（GAS では同じ場所で動く）
/* global runAggregation, setupInputSpreadsheet */

// Task-015: メニューの名前（アプリの名称：b1/Question-015-1）
const MENU_TITLE = "POKER RANKING";

// Task-015: 入力用スプレッドシートを開いたときに GAS が呼ぶ（シンプルトリガー）
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu(MENU_TITLE)
    .addItem("集計を反映", "menuRunAggregation")
    .addItem("初期設定", "menuSetupInputSpreadsheet")
    .addToUi();
}

// Task-015: メニュー「集計を反映」（Task-014 の処理を、メッセージの表示にダイアログを使って呼ぶ）
function menuRunAggregation() {
  const ui = SpreadsheetApp.getUi();
  runAggregation(SpreadsheetApp.getActiveSpreadsheet(), (message) =>
    ui.alert(message),
  );
}

// Task-015: メニュー「初期設定」（Task-012 の処理を呼び、結果をダイアログで知らせる）
function menuSetupInputSpreadsheet() {
  const ui = SpreadsheetApp.getUi();
  try {
    setupInputSpreadsheet(SpreadsheetApp.getActiveSpreadsheet());
    ui.alert(
      "初期設定が完了しました。シート「設定」に配布チップ数を入力してから、「集計を反映」を実行してください。",
    );
  } catch (error) {
    // 詳細は GAS の標準の実行ログで確認する（component-design.md 7.（ログ・監視））
    console.error(error);
    ui.alert(`初期設定を完了できませんでした。${error.message}`);
  }
}

// ローカルのテスト用の公開（GAS 上では module がないため何もしない）
if (typeof module !== "undefined") {
  module.exports = { onOpen, menuRunAggregation, menuSetupInputSpreadsheet };
}
