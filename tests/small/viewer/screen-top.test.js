// Task-021: Screen-001 トップ画面の Small テスト（DOM から分けた、表示内容を作る関数を確認する）
// ブラウザでは全ファイルが同じ場所で動くため、screen-top.js が使う関数をグローバルに置いてから読み込む
Object.assign(global, require("../../../src/viewer/client/format"));
const { buildTopContent } = require("../../../src/viewer/client/screen-top");

// ランキングの行を作る
function entry(rank, nickname, value, extra = {}) {
  return { rank, nickname, value, days: 1, ...extra };
}

const rankings = {
  average: [
    entry(1, "A", 500),
    entry(2, "B", 400),
    entry(3, "C", 300),
    entry(4, "D", 200),
    entry(5, "E", 100),
    entry(5, "F", 100),
    entry(7, "G", 50),
  ],
  total: [entry(1, "A", 1000), entry(2, "B", -500)],
  forcedLabor: [
    entry(1, "ジョーカー", -210000, { isForcedLabor: true }),
    entry(2, "B", -500, { isForcedLabor: false }),
  ],
};

// Test-081（Task-021 期待値1）
test("アベレージ、累計、強制労働への道のりの順に、それぞれ 5 位以内のプレイヤー（同順位で 6 人以上もありうる）が並ぶ", () => {
  const cards = buildTopContent(rankings);
  expect(cards.map((c) => c.kind)).toEqual(["average", "total", "forcedLabor"]);
  expect(cards[0].rows.map((r) => [r.rankText, r.nickname])).toEqual([
    ["1位", "A"],
    ["2位", "B"],
    ["3位", "C"],
    ["4位", "D"],
    ["5位", "E"],
    ["5位", "F"],
  ]);
  expect(cards[1].rows.map((r) => r.nickname)).toEqual(["A", "B"]);
  expect(cards[1].rows.map((r) => r.valueText)).toEqual(["+1,000", "−500"]);
});

// Test-082（Task-021 期待値2）
test("強制労働への道のりで「強制労働」に該当するプレイヤーは、ニックネームの右側に「強制労働」のラベルを付ける内容になる", () => {
  const rows = buildTopContent(rankings)[2].rows;
  expect(rows[0]).toMatchObject({ nickname: "ジョーカー", tag: "強制労働" });
  expect(rows[1].tag).toBeNull();
});

// Test-083（Task-021 期待値3）
test("強制労働への道のりの対象者がいない場合、「ランキングなし」を表示する内容になる", () => {
  const card = buildTopContent({ ...rankings, forcedLabor: [] })[2];
  expect(card.rows).toEqual([]);
  expect(card.emptyText).toBe("ランキングなし");
});

// Test-084（Task-021 期待値4）
test("ランキング名・「すべて見る」は、同じランキング画面への移動先を持つ", () => {
  for (const card of buildTopContent(rankings)) {
    const expected = { screen: "ranking", rankingKind: card.kind };
    expect(card.titleLink).toEqual(expected);
    expect(card.moreLink).toEqual(expected);
  }
});
