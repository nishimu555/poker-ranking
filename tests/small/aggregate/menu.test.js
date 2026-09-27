// Task-015: メニューの Small テスト
// GAS の SpreadsheetApp.getUi()（メニュー）は代用品（jest.fn()）に置き換える
const { onOpen } = require("../../../src/aggregate/menu");

// 代用品の UI を作る。追加されたメニューを menus に記録する
function createUi() {
  const menus = [];
  const ui = {
    menus,
    createMenu: jest.fn((title) => {
      const menu = { title, items: [], added: false };
      const builder = {
        addItem: jest.fn((caption, functionName) => {
          menu.items.push({ caption, functionName });
          return builder;
        }),
        addSeparator: jest.fn(() => builder),
        addToUi: jest.fn(() => {
          menu.added = true;
          menus.push(menu);
        }),
      };
      return builder;
    }),
  };
  return ui;
}

afterEach(() => {
  delete global.SpreadsheetApp;
});

// Test-063（Task-015 期待値1）
test("入力用スプレッドシートを開くと、「集計を反映」と「初期設定」の 2 つの項目を持つメニューが追加される", () => {
  const ui = createUi();
  global.SpreadsheetApp = { getUi: jest.fn(() => ui) };

  onOpen();

  expect(ui.menus).toHaveLength(1);
  expect(ui.menus[0].items.map((item) => item.caption)).toEqual([
    "集計を反映",
    "初期設定",
  ]);
});
