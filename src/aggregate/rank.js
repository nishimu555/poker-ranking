// Task-006: 順位付け（Component-003 集計ロジック）

// Task-006: 上位として取り出す順位の上限（上位 5 名：Feature-008 条件1、Feature-012）
const TOP_RANK_LIMIT = 5;

// Task-006: ニックネームを文字コード順に比べる（c1/Question-014、c1/Question-014-1）
// GAS とローカルで同じ結果になるよう、ロケールに依存しない比較を使う
function compareNickname(a, b) {
  if (a < b) {
    return -1;
  }
  return a > b ? 1 : 0;
}

// Task-006: 値とニックネームの組の一覧に順位を付け、表示の順に並べる
// entries：[{ nickname, value }]、order："desc"（大きい順）または "asc"（小さい順）
// 戻り値：[{ nickname, value, rank }]。同じ値は同じ順位とし、次の順位は同順の人数分を飛ばす（Feature-007 条件3）
function rankEntries(entries, order) {
  const direction = order === "asc" ? 1 : -1;
  const sorted = entries
    .map((entry) => ({ nickname: entry.nickname, value: entry.value }))
    .sort(
      (a, b) =>
        (a.value - b.value) * direction ||
        compareNickname(a.nickname, b.nickname),
    );
  const ranked = [];
  sorted.forEach((entry, index) => {
    const previous = ranked[index - 1];
    const rank =
      previous && previous.value === entry.value ? previous.rank : index + 1;
    ranked.push({ ...entry, rank });
  });
  return ranked;
}

// Task-006: 順位が 5 位以内のプレイヤーを取り出す（6 人以上になることがある：c1/Question-015）
function pickTopRanked(rankedEntries) {
  return rankedEntries.filter((entry) => entry.rank <= TOP_RANK_LIMIT);
}

// ローカルのテスト用の公開（GAS 上では module がないため何もしない）
if (typeof module !== "undefined") {
  module.exports = { rankEntries, pickTopRanked };
}
