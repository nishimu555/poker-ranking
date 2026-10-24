// Task-019: 表示用の整形（Component-007 Web アプリ：画面）
// 画面・画像に表示する文字列を作る関数。DOM に依存しない。

// Task-019: マイナスの記号（採用したモックの表記「−」：U+2212）
const MINUS_SIGN = "−";

// Task-019: 文字列を HTML として解釈されない形にする（b1/Question-018）
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Task-019: 数値を 3 桁区切りにする（符号は付けない。ロケールに依存しないよう自前で区切る）
function groupDigits(value) {
  const [integer, fraction] = String(Math.abs(value)).split(".");
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return fraction ? `${grouped}.${fraction}` : grouped;
}

// Task-019: 数値を 3 桁区切りにする（マイナスは「−」を付ける）。例：244200 → 「244,200」
function formatNumber(value) {
  return value < 0 ? `${MINUS_SIGN}${groupDigits(value)}` : groupDigits(value);
}

// Task-019: 収支・チップ数を符号付きで表す。例：44200 → 「+44,200」、-8800 → 「−8,800」、0 → 「0」（採用したモック）
function formatSignedNumber(value) {
  if (value > 0) {
    return `+${groupDigits(value)}`;
  }
  return formatNumber(value);
}

// Task-019: 順位を表す。順位がない（強制労働への道のりの対象外）場合は「−」（Feature-010 条件2-2、b1/review-002）
function formatRank(rank) {
  return rank === null || rank === undefined ? MINUS_SIGN : `${rank}位`;
}

// Task-019: 強制労働までの残りチップ数を表す。0 以下は数値を表示せず「強制労働」（c1/Question-022-1）
function formatRemainingChips(remainingChips) {
  return remainingChips <= 0 ? "強制労働" : formatNumber(remainingChips);
}

// Task-019: 強制労働までの道のりのゲージの割合（%）
// 基準値がマイナスの分 ÷（配布チップ数 × N）。基準値が 0 以上なら 0%、上限 100%（c1/Question-022）
function calcGaugePercent(totalBalance, distributedChips, forcedLaborCount) {
  const threshold = distributedChips * forcedLaborCount;
  if (totalBalance >= 0 || threshold <= 0) {
    return totalBalance < 0 ? 100 : 0;
  }
  return Math.min((-totalBalance / threshold) * 100, 100);
}

// Task-021: 上位として表示する順位の上限（上位 5 名：Feature-008 条件1、Feature-012 条件1）
const TOP_RANK_LIMIT = 5;

// Task-021: 3 つのランキングの表示の定義（表示の順：アベレージ、累計、強制労働への道のり）
// 名称・説明文・値の見出しは採用したモック（Screen-001・002・006）とランキングの呼び名（b1/Question-012-1、b1/Question-016）
const RANKING_DEFINITIONS = [
  {
    kind: "average",
    icon: "🏆",
    title: "アベレージランキング",
    shortTitle: "アベレージ",
    topDescription:
      "回数が少なくても活躍できる（プレイ時間で補正した 1 日あたりの収支）",
    description:
      "回数が少なくても活躍できる（プレイ時間で補正した 1 日あたりの収支の平均）",
    valueHeader: "平均値チップ数",
  },
  {
    kind: "total",
    icon: "🎖",
    title: "累計ランキング",
    shortTitle: "累計",
    topDescription:
      "参加したすべてのゲームの累計（1 年の収支の合計が大きい順）",
    description:
      "参加したすべてのゲームの累計（集計期間内の収支の合計が大きい順）",
    valueHeader: "累計チップ数",
  },
  {
    kind: "forcedLabor",
    icon: "⛏",
    title: "強制労働への道のり",
    shortTitle: "強制労働",
    topDescription:
      "強制労働に誰が近いか！のランキング（1 年の収支の合計がマイナスの人のみ）",
    description:
      "強制労働に誰が近いか！のランキング（集計期間内の収支の合計がマイナスの人のみ。小さい順）。−（配布チップ数 × N）以下で「強制労働」",
    valueHeader: "基準値",
  },
];

// Task-021: 順位が 5 位以内のプレイヤーを取り出す（同順位で 6 人以上になることがある：c1/Question-015）
function pickTopRanked(entries) {
  return entries.filter((entry) => entry.rank <= TOP_RANK_LIMIT);
}

// Task-021: 強制労働に該当するプレイヤーのラベル（Feature-006 条件2、b1/review-007）
function forcedLaborTag(entry) {
  return entry.isForcedLabor === true ? "強制労働" : null;
}

// ローカルのテスト用の公開（ブラウザでは module がないため何もしない）
if (typeof module !== "undefined") {
  module.exports = {
    escapeHtml,
    formatNumber,
    formatSignedNumber,
    formatRank,
    formatRemainingChips,
    calcGaugePercent,
    TOP_RANK_LIMIT,
    RANKING_DEFINITIONS,
    pickTopRanked,
    forcedLaborTag,
  };
}
