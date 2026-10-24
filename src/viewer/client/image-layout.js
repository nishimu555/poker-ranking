// Task-024: 画像に描く内容の計算（Component-008 画像生成）
// 表示中の年の集計結果から、画像の大きさ、アプリの名称、年と集計時点、3 つのランキングの 5 位以内のプレイヤー、免責表示を、
// 描く順に並べた内容（座標・文字の大きさ・色を含む）として作る。canvas に依存しない（Small テストの対象）。
// 配置は採用したモック（Screen-006：360 × 640 相当）を 3 倍にしたもの。
// 他のファイルの関数（ビルドで 1 つの HTML に埋め込まれ、同じ場所で動く）
/* global RANKING_DEFINITIONS, pickTopRanked, formatRank, formatSignedNumber */

// Task-024: 画像の大きさ（9:16：Feature-012 条件1）
const IMAGE_WIDTH = 1080;
const IMAGE_HEIGHT = 1920;

// Task-024: 画像の色（採用したモックの色）
const IMAGE_COLORS = {
  backgroundInner: "#1a6b4e",
  backgroundOuter: "#0b3d2e",
  gold: "#f2c14e",
  text: "#ffffff",
  sub: "#d6e9df",
  minus: "#ff9e97",
  headingLine: "rgba(242, 193, 78, 0.5)",
};

// Task-024: 画像の免責表示（採用したモック：Screen-006 の画像内の文言。Feature-013）
const IMAGE_DISCLAIMER =
  "有志が作成したものであり、開催店舗とは関係ありません。";

// Task-024: 配置の寸法（モックの値 × 3）
const IMAGE_METRICS = {
  frameWidth: 9,
  frameRadius: 42,
  paddingX: 48,
  paddingTop: 54,
  paddingBottom: 54,
  titleSize: 54,
  subSize: 33,
  subMarginBottom: 30,
  blockMargin: 18,
  headingSize: 39,
  headingGap: 12,
  rowSize: 36,
  rowHeight: 55,
  rankWidth: 84,
  footSize: 27,
};

// Task-024: 集計時点の日付（表示中の年より後に集計した場合は、その年の 12/31 までとする）
function buildPointDate(year, aggregatedAt) {
  const date = String(aggregatedAt || "").slice(0, 10);
  const yearEnd = `${year}/12/31`;
  return date === "" || date > yearEnd ? yearEnd : date;
}

// Task-024: 画像に描く内容を作る（Feature-012 条件1・条件3、c1/Question-015）
// data：getViewerData の戻り値
// 戻り値：{ width, height, blocks, items }。items は描く順の図形・文字（type："background"・"frame"・"text"・"line"）
function buildImageLayout(data) {
  const m = IMAGE_METRICS;
  const blocks = RANKING_DEFINITIONS.map((definition) => ({
    kind: definition.kind,
    heading: `${definition.icon} ${definition.title}`,
    rows: pickTopRanked(data.rankings[definition.kind]).map((entry) => ({
      rankText: formatRank(entry.rank),
      nicknameText:
        entry.isForcedLabor === true
          ? `${entry.nickname}（強制労働）`
          : entry.nickname,
      valueText: formatSignedNumber(entry.value),
      isMinus: entry.value < 0,
    })),
  }));

  // 同順位で表示の人数が増えた場合は、行の高さと文字を縮めて、免責表示の上に収める（c1/Question-015）
  const fixedHeight =
    m.paddingTop +
    m.titleSize * 1.3 +
    m.subSize * 1.3 +
    m.subMarginBottom +
    blocks.length * (m.headingSize * 1.3 + m.headingGap + m.blockMargin * 2) +
    m.footSize * 1.3 +
    m.paddingBottom;
  const rowCount = blocks.reduce(
    (sum, b) => sum + Math.max(b.rows.length, 1),
    0,
  );
  const rowHeight = Math.min(
    m.rowHeight,
    (IMAGE_HEIGHT - fixedHeight) / rowCount,
  );
  const rowSize = Math.min(m.rowSize, Math.floor(rowHeight * 0.65));

  const left = m.paddingX;
  const right = IMAGE_WIDTH - m.paddingX;
  const items = [
    { type: "background", colors: IMAGE_COLORS },
    {
      type: "frame",
      lineWidth: m.frameWidth,
      radius: m.frameRadius,
      color: IMAGE_COLORS.gold,
    },
  ];
  const text = (value, x, y, size, color, options) =>
    items.push({
      type: "text",
      text: value,
      x,
      y,
      size,
      color,
      align: "left",
      bold: false,
      ...options,
    });

  let y = m.paddingTop;
  text(
    "♠ POKER RANKING ♥",
    IMAGE_WIDTH / 2,
    y,
    m.titleSize,
    IMAGE_COLORS.gold,
    {
      align: "center",
      bold: true,
    },
  );
  y += m.titleSize * 1.3;
  text(
    `${data.year} 年（${data.year}/01/01〜${buildPointDate(data.year, data.aggregatedAt)} 時点）`,
    IMAGE_WIDTH / 2,
    y,
    m.subSize,
    IMAGE_COLORS.sub,
    { align: "center" },
  );
  y += m.subSize * 1.3 + m.subMarginBottom;

  for (const block of blocks) {
    y += m.blockMargin;
    text(block.heading, left, y, m.headingSize, IMAGE_COLORS.gold, {
      bold: true,
    });
    y += m.headingSize * 1.3;
    items.push({
      type: "line",
      x1: left,
      x2: right,
      y,
      lineWidth: 3,
      color: IMAGE_COLORS.headingLine,
    });
    y += m.headingGap;
    if (block.rows.length === 0) {
      text("ランキングなし", left, y, rowSize, IMAGE_COLORS.sub);
      y += rowHeight;
    }
    for (const row of block.rows) {
      text(row.rankText, left, y, rowSize, IMAGE_COLORS.gold);
      text(
        row.nicknameText,
        left + m.rankWidth,
        y,
        rowSize,
        IMAGE_COLORS.text,
        {
          maxWidth: right - left - m.rankWidth - 300,
        },
      );
      text(
        row.valueText,
        right,
        y,
        rowSize,
        row.isMinus ? IMAGE_COLORS.minus : IMAGE_COLORS.text,
        { align: "right" },
      );
      y += rowHeight;
    }
    y += m.blockMargin;
  }

  text(
    IMAGE_DISCLAIMER,
    IMAGE_WIDTH / 2,
    IMAGE_HEIGHT - m.paddingBottom - m.footSize * 1.3,
    m.footSize,
    IMAGE_COLORS.sub,
    { align: "center" },
  );

  return { width: IMAGE_WIDTH, height: IMAGE_HEIGHT, blocks, items };
}

// ローカルのテスト用の公開（ブラウザでは module がないため何もしない）
if (typeof module !== "undefined") {
  module.exports = { buildImageLayout, buildPointDate };
}
