// Task-023: Screen-005 個人の戦績画面（Component-007 Web アプリ：画面）
// 数値のタイル、各ランキングでの順位、強制労働までの道のり（借金回数の累計、残りチップ数、ゲージ）、実施日ごとの履歴を表示する。
// 表示内容を作る処理（buildPlayerContent）は DOM から分ける（Small テストの対象）。
// 他のファイルの関数（ビルドで 1 つの HTML に埋め込まれ、同じ場所で動く）
/* global RANKING_DEFINITIONS, formatRank, formatNumber, formatSignedNumber, formatRemainingChips, calcGaugePercent */
// app.js から呼ばれる関数
/* exported renderPlayerScreen */

// Task-023: 時間を表す（小数第 1 位まで表示する。例：2 → 「2.0」、21.5 → 「21.5」：採用したモック）
// 合計の誤差（0.1 + 0.2 等）を避けるため、小数第 2 位で丸めてから表す
function formatHours(value) {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded * 10) ? rounded.toFixed(1) : String(rounded);
}

// Task-023: 個人の戦績画面の内容を作る（Feature-010 条件1・条件2・条件2-2、c1/Question-021、c1/Question-022）
// data：getViewerData の戻り値、nickname：表示するプレイヤー
function buildPlayerContent(data, nickname) {
  const player = data.players.find((p) => p.nickname === nickname);
  if (!player) {
    // 表示中のプレイヤーが参加していない年（c1/Question-021）
    return {
      hasRecord: false,
      nickname,
      emptyText: "この年の戦績はありません",
    };
  }
  // 閲覧用スプレッドシートに配布チップ数・N を置かないため、残りチップ数 − 基準値（＝ 配布チップ数 × N）でゲージの割合を求める
  const threshold = player.remainingChips - player.totalBalance;
  return {
    hasRecord: true,
    nickname,
    tiles: [
      { label: "参加日数", valueText: `${player.days} 日`, isMinus: false },
      {
        label: "合計プレイ時間",
        valueText: `${formatHours(player.totalPlayTime)} 時間`,
        isMinus: false,
      },
      {
        label: "収支の累計",
        valueText: formatSignedNumber(player.totalBalance),
        isMinus: player.totalBalance < 0,
      },
      {
        label: "平均値チップ数",
        valueText: formatSignedNumber(player.averageChips),
        isMinus: player.averageChips < 0,
      },
    ],
    ranks: RANKING_DEFINITIONS.map((d) => ({
      label: `${d.icon} ${d.shortTitle}`,
      rankText: formatRank(player.ranks[d.kind]),
    })),
    debtText: `${player.totalDebtCount} 回`,
    remainingText: formatRemainingChips(player.remainingChips),
    reachedForcedLabor: player.remainingChips <= 0,
    basisText: formatSignedNumber(player.totalBalance),
    gaugePercent: calcGaugePercent(player.totalBalance, threshold, 1),
    history: (data.history[nickname] || []).map((h) => ({
      playDate: h.playDate,
      playTimeText: formatHours(h.playTime),
      finalChipsText: formatNumber(h.finalChips),
      debtText: String(h.debtCount),
      balanceText: formatSignedNumber(h.balance),
      isMinus: h.balance < 0,
    })),
  };
}

// Task-023: 個人の戦績画面を描く（採用したモック：Screen-005）
function renderPlayerScreen(data, state, helpers) {
  const { el, navigate, buildYearSelect, buildPeriodText } = helpers;
  const content = buildPlayerContent(data, state.nickname);
  const nodes = [
    el("div", { className: "top-bar" }, [
      el(
        "a",
        { className: "link", href: "#", onClick: () => navigate("ranking") },
        "‹ ランキングへ",
      ),
      buildYearSelect(),
    ]),
    el("div", { className: "profile" }, [
      el("div", { className: "avatar" }, "♥"),
      el("h1", {}, content.nickname),
    ]),
    el("div", { className: "player-period" }, buildPeriodText(data.year)),
  ];
  if (!content.hasRecord) {
    nodes.push(el("p", { className: "empty" }, content.emptyText));
    return nodes;
  }
  nodes.push(
    el(
      "div",
      { className: "stats" },
      content.tiles.map((tile) =>
        el("div", { className: "stat" }, [
          el("div", { className: "lb" }, tile.label),
          el(
            "div",
            { className: tile.isMinus ? "vl minus" : "vl" },
            tile.valueText,
          ),
        ]),
      ),
    ),
    el("h2", { className: "section-title" }, "各ランキングでの順位"),
    el(
      "div",
      { className: "ranks" },
      content.ranks.map((r) =>
        el("div", {}, [r.label, el("b", {}, r.rankText)]),
      ),
    ),
    el("h2", { className: "section-title" }, "⛏ 強制労働までの道のり"),
    el("div", { className: "gauge" }, [
      el("p", {}, ["借金回数の累計：", el("b", {}, content.debtText)]),
      el("div", { className: "meter", "aria-hidden": "true" }, [
        el("span", { style: `width:${content.gaugePercent}%` }),
      ]),
      content.reachedForcedLabor
        ? el("p", {}, [
            el("span", { className: "tag" }, content.remainingText),
            `（基準値 ${content.basisText}）`,
          ])
        : el("p", {}, [
            "強制労働まで あと ",
            el("b", {}, content.remainingText),
            ` チップ（基準値 ${content.basisText}）`,
          ]),
    ]),
    el("h2", { className: "section-title" }, "実施日ごとの履歴"),
    el("table", { className: "history-table" }, [
      el("tr", {}, [
        el("th", {}, "日付"),
        el("th", { className: "num" }, "時間"),
        el("th", { className: "num" }, "最終チップ"),
        el("th", { className: "num" }, "借金"),
        el("th", { className: "num" }, "収支"),
      ]),
      ...content.history.map((h) =>
        el("tr", {}, [
          el("td", {}, h.playDate),
          el("td", { className: "num" }, h.playTimeText),
          el("td", { className: "num" }, h.finalChipsText),
          el("td", { className: "num" }, h.debtText),
          el(
            "td",
            { className: h.isMinus ? "num minus" : "num" },
            h.balanceText,
          ),
        ]),
      ),
    ]),
  );
  return nodes;
}

// ローカルのテスト用の公開（ブラウザでは module がないため何もしない）
if (typeof module !== "undefined") {
  module.exports = { buildPlayerContent };
}
