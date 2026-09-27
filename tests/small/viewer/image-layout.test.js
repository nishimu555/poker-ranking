// Task-024: 画像に描く内容の計算の Small テスト
// ブラウザでは全ファイルが同じ場所で動くため、image-layout.js が使う関数をグローバルに置いてから読み込む
Object.assign(global, require("../../../src/viewer/client/format"));
const { buildImageLayout } = require("../../../src/viewer/client/image-layout");

// ランキングの行を作る
function entry(rank, nickname, value, extra = {}) {
  return { rank, nickname, value, days: 1, ...extra };
}

// getViewerData の戻り値（2026 年、集計日 2026/09/26）
const data = {
  ok: true,
  year: 2026,
  aggregatedAt: "2026/09/26 21:05",
  rankings: {
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
  },
};

// 描く文字の一覧
function texts(layout) {
  return layout.items
    .filter((item) => item.type === "text")
    .map((item) => item.text);
}

// Test-092（Task-024 期待値1）
test("画像の大きさは 1080 × 1920 ピクセル（9:16）", () => {
  const layout = buildImageLayout(data);
  expect(layout.width).toBe(1080);
  expect(layout.height).toBe(1920);
});

// Test-093（Task-024 期待値2）
test("2026 年、集計日 2026/09/26 では、名称「POKER RANKING」と「2026 年（2026/01/01〜2026/09/26 時点）」を含む", () => {
  const all = texts(buildImageLayout(data));
  expect(all.some((t) => t.includes("POKER RANKING"))).toBe(true);
  expect(all).toContain("2026 年（2026/01/01〜2026/09/26 時点）");
});

// Test-094（Task-024 期待値3）
test("アベレージ、累計、強制労働への道のりの順に、それぞれ 5 位以内のプレイヤー（同順位で 6 人以上もありうる）を含む", () => {
  const layout = buildImageLayout(data);
  expect(layout.blocks.map((b) => b.kind)).toEqual([
    "average",
    "total",
    "forcedLabor",
  ]);
  expect(layout.blocks[0].rows.map((r) => r.nicknameText)).toEqual([
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
  ]);
  expect(layout.blocks[1].rows.map((r) => r.nicknameText)).toEqual(["A", "B"]);
  // 描く順も同じ（見出し → その行）
  const all = texts(layout);
  const headings = [
    "🏆 アベレージランキング",
    "🎖 累計ランキング",
    "⛏ 強制労働への道のり",
  ].map((h) => all.indexOf(h));
  expect(headings.every((i) => i >= 0)).toBe(true);
  expect([...headings].sort((a, b) => a - b)).toEqual(headings);
  expect(all.indexOf("F")).toBeGreaterThan(headings[0]);
  expect(all.indexOf("F")).toBeLessThan(headings[1]);
  expect(all).not.toContain("G");
});

// Test-095（Task-024 期待値4）
test("「強制労働」に該当するプレイヤーは、ニックネームに「（強制労働）」を付ける", () => {
  const rows = buildImageLayout(data).blocks[2].rows;
  expect(rows[0].nicknameText).toBe("ジョーカー（強制労働）");
  expect(rows[1].nicknameText).toBe("B");
});

// Test-096（Task-024 期待値5）
test("免責表示の文言を含む", () => {
  const all = texts(buildImageLayout(data));
  expect(
    all.some((t) =>
      t.includes("有志が作成したものであり、開催店舗とは関係ありません。"),
    ),
  ).toBe(true);
});
