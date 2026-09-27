// Task-023: Screen-005 個人の戦績画面の Small テスト（DOM から分けた、表示内容を作る関数を確認する）
// ブラウザでは全ファイルが同じ場所で動くため、screen-player.js が使う関数をグローバルに置いてから読み込む
Object.assign(global, require("../../../src/viewer/client/format"));
const {
  buildPlayerContent,
} = require("../../../src/viewer/client/screen-player");

// getViewerData の戻り値（2026 年。配布チップ数 20000、N 10）
const data = {
  ok: true,
  year: 2026,
  players: [
    {
      nickname: "リバー",
      days: 12,
      totalPlayTime: 21.5,
      totalBalance: 44200,
      averageChips: 8150,
      totalDebtCount: 3,
      remainingChips: 244200,
      ranks: { average: 2, total: 2, forcedLabor: null },
    },
    {
      nickname: "ジョーカー",
      days: 8,
      totalPlayTime: 12,
      totalBalance: -50000,
      averageChips: -6000,
      totalDebtCount: 9,
      remainingChips: 150000,
      ranks: { average: 9, total: 10, forcedLabor: 1 },
    },
  ],
  history: {
    リバー: [
      {
        playDate: "2026/09/13",
        playTime: 2,
        finalChips: 48000,
        debtCount: 0,
        balance: 48000,
      },
      {
        playDate: "2026/08/30",
        playTime: 1.5,
        finalChips: 12000,
        debtCount: 1,
        balance: -8000,
      },
    ],
    ジョーカー: [
      {
        playDate: "2026/09/13",
        playTime: 3,
        finalChips: 0,
        debtCount: 2,
        balance: -40000,
      },
    ],
  },
};

// Task-023 期待値1
test("表示中のプレイヤーの戦績がある年では、参加日数、合計プレイ時間、収支の累計、平均値チップ数、各ランキングでの順位、借金回数の累計、残りチップ数、ゲージの割合、履歴を表示する内容になる", () => {
  const content = buildPlayerContent(data, "リバー");
  expect(content.hasRecord).toBe(true);
  expect(content.tiles.map((t) => [t.label, t.valueText])).toEqual([
    ["参加日数", "12 日"],
    ["合計プレイ時間", "21.5 時間"],
    ["収支の累計", "+44,200"],
    ["平均値チップ数", "+8,150"],
  ]);
  expect(content.ranks.map((r) => r.rankText)).toEqual(["2位", "2位", "−"]);
  expect(content.debtText).toBe("3 回");
  expect(content.remainingText).toBe("244,200");
  expect(content.gaugePercent).toBe(0);
  expect(
    content.history.map((h) => [
      h.playDate,
      h.playTimeText,
      h.finalChipsText,
      h.debtText,
      h.balanceText,
    ]),
  ).toEqual([
    ["2026/09/13", "2.0", "48,000", "0", "+48,000"],
    ["2026/08/30", "1.5", "12,000", "1", "−8,000"],
  ]);
});

// Task-023 期待値2
test("自分以外のプレイヤーでも、同じ内容を表示する", () => {
  const content = buildPlayerContent(data, "ジョーカー");
  expect(content.hasRecord).toBe(true);
  expect(content.nickname).toBe("ジョーカー");
  expect(content.tiles.map((t) => t.valueText)).toEqual([
    "8 日",
    "12.0 時間",
    "−50,000",
    "−6,000",
  ]);
  expect(content.ranks.map((r) => r.rankText)).toEqual(["9位", "10位", "1位"]);
  expect(content.debtText).toBe("9 回");
  expect(content.remainingText).toBe("150,000");
  // 基準値 -50000 ÷（配布チップ数 20000 × N 10）＝ 25%
  expect(content.gaugePercent).toBe(25);
  expect(content.history.map((h) => h.balanceText)).toEqual(["−40,000"]);
});

// Task-023 期待値3
test("表示中のプレイヤーが参加していない年を選ぶと、「この年の戦績はありません」を表示する内容になる", () => {
  const content = buildPlayerContent(data, "古株");
  expect(content.hasRecord).toBe(false);
  expect(content.nickname).toBe("古株");
  expect(content.emptyText).toBe("この年の戦績はありません");
});
