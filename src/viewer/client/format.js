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

// ローカルのテスト用の公開（ブラウザでは module がないため何もしない）
if (typeof module !== "undefined") {
  module.exports = {
    escapeHtml,
    formatNumber,
    formatSignedNumber,
    formatRank,
    formatRemainingChips,
    calcGaugePercent,
  };
}
