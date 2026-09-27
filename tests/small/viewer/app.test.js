// Task-020: 画面の共通部分の Small テスト（DOM から分けた、表示内容を作る関数を確認する）
const {
  buildYearOptions,
  buildNotViewableContent,
  DISCLAIMER,
} = require("../../../src/viewer/client/app");

// Task-020 期待値1
test("集計済みの年 2025、2026 では、年の選択肢は 2026、2025 で、最初に選ばれる年は 2026", () => {
  expect(buildYearOptions([2025, 2026])).toEqual({
    options: [2026, 2025],
    selected: 2026,
  });
});

// Task-020 期待値2
test("取得の結果が「閲覧できない」の場合、データの代わりに閲覧できない旨を表示する内容になる", () => {
  const content = buildNotViewableContent({
    ok: false,
    message:
      "閲覧できません。このページを閲覧するには、管理者からの招待が必要です。",
  });
  expect(content).toEqual({
    viewable: false,
    message:
      "閲覧できません。このページを閲覧するには、管理者からの招待が必要です。",
  });
  // 閲覧できる場合は、閲覧できない旨の表示にならない
  expect(buildNotViewableContent({ ok: true })).toEqual({ viewable: true });
});

// Task-020 期待値3
test("免責表示の文言は「本ページは有志が作成したものであり、開催店舗とは関係ありません。」", () => {
  expect(DISCLAIMER).toBe(
    "本ページは有志が作成したものであり、開催店舗とは関係ありません。",
  );
});
