// Task-022: Screen-002〜004 ランキング画面の Small テスト（DOM から分けた、表示内容を作る関数を確認する）
// ブラウザでは全ファイルが同じ場所で動くため、screen-ranking.js が使う関数をグローバルに置いてから読み込む
Object.assign(global, require("../../../src/viewer/client/format"));
const {
  buildRankingContent,
} = require("../../../src/viewer/client/screen-ranking");

const rankings = {
  average: [
    { rank: 1, nickname: "ナッツ", value: 12400, days: 15 },
    { rank: 2, nickname: "リバー", value: 8150, days: 12 },
    { rank: 3, nickname: "スペード", value: 5020, days: 9 },
    { rank: 3, nickname: "ブラフ王", value: 5020, days: 2 },
    { rank: 5, nickname: "ハート", value: 2300, days: 11 },
    { rank: 6, nickname: "クラブ", value: -490, days: 18 },
  ],
  total: [{ rank: 1, nickname: "ナッツ", value: 186000, days: 15 }],
  forcedLabor: [
    {
      rank: 1,
      nickname: "ジョーカー",
      value: -210000,
      days: 8,
      isForcedLabor: true,
    },
  ],
};

// Test-085（Task-022 期待値1）
test("値の見出しは、アベレージ「平均値チップ数」、累計「累計チップ数」、強制労働への道のり「基準値」", () => {
  expect(buildRankingContent(rankings, "average").valueHeader).toBe(
    "平均値チップ数",
  );
  expect(buildRankingContent(rankings, "total").valueHeader).toBe(
    "累計チップ数",
  );
  expect(buildRankingContent(rankings, "forcedLabor").valueHeader).toBe(
    "基準値",
  );
});

// Test-086（Task-022 期待値2）
test("対象者全員が順位の順に、順位・ニックネーム・値・参加日数を持つ行になる", () => {
  const rows = buildRankingContent(rankings, "average").rows;
  expect(
    rows.map((r) => [r.rankText, r.nickname, r.valueText, r.daysText]),
  ).toEqual([
    ["1位", "ナッツ", "+12,400", "15 日"],
    ["2位", "リバー", "+8,150", "12 日"],
    ["3位", "スペード", "+5,020", "9 日"],
    ["3位", "ブラフ王", "+5,020", "2 日"],
    ["5位", "ハート", "+2,300", "11 日"],
    ["6位", "クラブ", "−490", "18 日"],
  ]);
});

// Test-087（Task-022 期待値3）
test("強制労働への道のりの対象者がいない場合、「ランキングなし」を表示する内容になる", () => {
  const content = buildRankingContent(
    { ...rankings, forcedLabor: [] },
    "forcedLabor",
  );
  expect(content.rows).toEqual([]);
  expect(content.emptyText).toBe("ランキングなし");
});

// Test-088（Task-022 期待値4）
test("ニックネームは、そのプレイヤーの個人の戦績画面への移動先を持つ", () => {
  const rows = buildRankingContent(rankings, "forcedLabor").rows;
  expect(rows[0].link).toEqual({ screen: "player", nickname: "ジョーカー" });
});
