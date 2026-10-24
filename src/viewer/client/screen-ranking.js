// Task-022: Screen-002〜004 ランキング画面（Component-007 Web アプリ：画面）
// 3 つのランキングの切り替えと、全員の一覧（順位、ニックネーム、値、参加日数）、個人の戦績画面へのリンクを表示する。
// 表示内容を作る処理（buildRankingContent）は DOM から分ける（Small テストの対象）。
// 他のファイルの関数（ビルドで 1 つの HTML に埋め込まれ、同じ場所で動く）
/* global RANKING_DEFINITIONS, forcedLaborTag, formatRank, formatSignedNumber */
// app.js から呼ばれる関数
/* exported renderRankingScreen */

// Task-022: ランキング画面の内容を作る（Feature-004〜Feature-006、Feature-009 条件1・条件2）
// rankings：{ average, total, forcedLabor }（getViewerData の戻り値）、kind：表示するランキングの種類
function buildRankingContent(rankings, kind) {
  const definition =
    RANKING_DEFINITIONS.find((d) => d.kind === kind) || RANKING_DEFINITIONS[0];
  return {
    kind: definition.kind,
    icon: definition.icon,
    title: definition.title,
    description: definition.description,
    valueHeader: definition.valueHeader,
    switchItems: RANKING_DEFINITIONS.map((d) => ({
      kind: d.kind,
      label: `${d.icon} ${d.shortTitle}`,
      active: d.kind === definition.kind,
    })),
    rows: rankings[definition.kind].map((entry) => ({
      rankText: formatRank(entry.rank),
      nickname: entry.nickname,
      tag: forcedLaborTag(entry),
      valueText: formatSignedNumber(entry.value),
      isMinus: entry.value < 0,
      daysText: `${entry.days} 日`,
      link: { screen: "player", nickname: entry.nickname },
    })),
    emptyText: "ランキングなし",
    notes:
      definition.kind === "forcedLabor"
        ? ["※「強制労働」はあくまで遊びの表現です。次の一勝で逆転を！"]
        : [],
  };
}

// Task-022: ランキング画面を描く（採用したモック：Screen-002）
function renderRankingScreen(data, state, helpers) {
  const { el, navigate, buildYearSelect, buildPeriodText } = helpers;
  const content = buildRankingContent(data.rankings, state.rankingKind);
  const table =
    content.rows.length === 0
      ? el("p", { className: "empty" }, content.emptyText)
      : el("table", { className: "ranking-table" }, [
          el("tr", {}, [
            el("th", {}, "順位"),
            el("th", {}, "ニックネーム"),
            el("th", { className: "num" }, content.valueHeader),
            el("th", { className: "num" }, "参加日数"),
          ]),
          ...content.rows.map((row) =>
            el("tr", {}, [
              el("td", { className: "rk" }, row.rankText),
              el("td", {}, [
                el(
                  "a",
                  {
                    className: "player-link",
                    href: "#",
                    onClick: () => navigate("player", row.link),
                  },
                  row.nickname,
                ),
                row.tag ? el("span", { className: "tag" }, row.tag) : null,
              ]),
              el(
                "td",
                { className: row.isMinus ? "num minus" : "num" },
                row.valueText,
              ),
              el("td", { className: "num" }, row.daysText),
            ]),
          ),
        ]);
  return [
    el("div", { className: "top-bar" }, [
      el(
        "a",
        { className: "link", href: "#", onClick: () => navigate("top") },
        "‹ トップへ",
      ),
      buildYearSelect(),
    ]),
    el(
      "nav",
      { className: "switch" },
      content.switchItems.map((item) =>
        el(
          "a",
          {
            className: item.active ? "active" : "",
            href: "#",
            onClick: () => navigate("ranking", { rankingKind: item.kind }),
          },
          item.label,
        ),
      ),
    ),
    el("h1", { className: "screen-title" }, `${content.icon} ${content.title}`),
    el("p", { className: "desc" }, content.description),
    el("p", { className: "period-text" }, buildPeriodText(data.year)),
    table,
    ...content.notes.map((note) => el("p", { className: "note" }, note)),
  ];
}

// ローカルのテスト用の公開（ブラウザでは module がないため何もしない）
if (typeof module !== "undefined") {
  module.exports = { buildRankingContent };
}
