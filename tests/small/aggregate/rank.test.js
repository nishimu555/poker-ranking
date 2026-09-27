// Task-006: 順位付けの Small テスト
const { rankEntries, pickTopRanked } = require("../../../src/aggregate/rank");

// Test-018（Task-006 期待値1）
test("値 300、100、100、50（大きい順）の順位は 1、2、2、4 位", () => {
  const ranked = rankEntries(
    [
      { nickname: "A", value: 100 },
      { nickname: "B", value: 50 },
      { nickname: "C", value: 300 },
      { nickname: "D", value: 100 },
    ],
    "desc",
  );
  expect(ranked.map((e) => [e.value, e.rank])).toEqual([
    [300, 1],
    [100, 2],
    [100, 2],
    [50, 4],
  ]);
});

// Test-019（Task-006 期待値2）
test("値 -300、-100、-50（小さい順）の順位は -300 が 1 位、-100 が 2 位、-50 が 3 位", () => {
  const ranked = rankEntries(
    [
      { nickname: "A", value: -50 },
      { nickname: "B", value: -300 },
      { nickname: "C", value: -100 },
    ],
    "asc",
  );
  expect(ranked.map((e) => [e.value, e.rank])).toEqual([
    [-300, 1],
    [-100, 2],
    [-50, 3],
  ]);
});

// Test-020（Task-006 期待値3）
test("同じ値のプレイヤーは同じ順位で、ニックネームの文字コード順に並ぶ", () => {
  const ranked = rankEntries(
    [
      { nickname: "ナッツ", value: 100 },
      { nickname: "Joker", value: 100 },
      { nickname: "ぶらふ", value: 100 },
    ],
    "desc",
  );
  expect(ranked).toEqual([
    { nickname: "Joker", value: 100, rank: 1 },
    { nickname: "ぶらふ", value: 100, rank: 1 },
    { nickname: "ナッツ", value: 100, rank: 1 },
  ]);
});

// Test-021（Task-006 期待値4）
test("順位が 1、2、3、4、5、5、7 位の 7 人から、5 位以内の 6 人が取り出される", () => {
  const ranked = [1, 2, 3, 4, 5, 5, 7].map((rank, i) => ({
    nickname: `P${i}`,
    value: 100 - i,
    rank,
  }));
  const top = pickTopRanked(ranked);
  expect(top).toHaveLength(6);
  expect(top.map((e) => e.rank)).toEqual([1, 2, 3, 4, 5, 5]);
});

// Test-022（Task-006 期待値5）
test("一覧が空の場合は空の一覧を返す", () => {
  expect(rankEntries([], "desc")).toEqual([]);
  expect(rankEntries([], "asc")).toEqual([]);
  expect(pickTopRanked([])).toEqual([]);
});
