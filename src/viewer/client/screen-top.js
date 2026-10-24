// Task-021: Screen-001 トップ画面（Component-007 Web アプリ：画面）
// 3 つのランキングのカード（ランキング名、説明文、5 位以内のプレイヤー）と、各ランキング画面・画像生成画面へのリンクを表示する。
// 表示内容を作る処理（buildTopContent）は DOM から分ける（Small テストの対象）。
// 他のファイルの関数（ビルドで 1 つの HTML に埋め込まれ、同じ場所で動く）
/* global RANKING_DEFINITIONS, pickTopRanked, forcedLaborTag, formatRank, formatSignedNumber */
// app.js から呼ばれる関数
/* exported renderTopScreen */

// Task-021: トップ画面のカードの内容を作る（Feature-008 条件1・条件2、Feature-006 条件1-2・条件2）
// rankings：{ average, total, forcedLabor }（getViewerData の戻り値）
// 戻り値：[{ kind, icon, title, description, rows, emptyText, titleLink, moreLink }]
function buildTopContent(rankings) {
  return RANKING_DEFINITIONS.map((definition) => {
    const link = { screen: "ranking", rankingKind: definition.kind };
    return {
      kind: definition.kind,
      icon: definition.icon,
      title: definition.title,
      description: definition.topDescription,
      rows: pickTopRanked(rankings[definition.kind]).map((entry) => ({
        rankText: formatRank(entry.rank),
        nickname: entry.nickname,
        tag: forcedLaborTag(entry),
        valueText: formatSignedNumber(entry.value),
        isMinus: entry.value < 0,
      })),
      emptyText: "ランキングなし",
      titleLink: link,
      moreLink: link,
    };
  });
}

// Task-021: トップ画面を描く（採用したモック：Screen-001）
function renderTopScreen(data, state, helpers) {
  const { el, navigate, buildYearSelect, buildPeriodText } = helpers;
  const cards = buildTopContent(data.rankings).map((card) =>
    el("section", { className: "card" }, [
      el("h2", {}, [
        el(
          "a",
          { href: "#", onClick: () => navigate("ranking", card.titleLink) },
          `${card.icon} ${card.title} ›`,
        ),
      ]),
      el("p", { className: "desc" }, card.description),
      card.rows.length === 0
        ? el("p", { className: "empty" }, card.emptyText)
        : el(
            "ol",
            { className: "top-list" },
            card.rows.map((row) =>
              el("li", {}, [
                el("span", { className: "rank" }, row.rankText),
                el("span", { className: "name" }, [
                  row.nickname,
                  row.tag ? el("span", { className: "tag" }, row.tag) : null,
                ]),
                el(
                  "span",
                  { className: row.isMinus ? "val minus" : "val" },
                  row.valueText,
                ),
              ]),
            ),
          ),
      el(
        "a",
        {
          className: "more",
          href: "#",
          onClick: () => navigate("ranking", card.moreLink),
        },
        "すべて見る ›",
      ),
    ]),
  );
  return [
    el("header", { className: "app-header" }, [
      el("div", { className: "suits" }, "♠ ♥ ♦ ♣"),
      el("h1", {}, "POKER RANKING"),
    ]),
    el("div", { className: "period" }, [
      el("span", {}, buildPeriodText(data.year)),
      buildYearSelect(),
    ]),
    ...cards,
    el(
      "a",
      { className: "btn", href: "#", onClick: () => navigate("image") },
      "📷 ランキングを画像にする",
    ),
  ];
}

// ローカルのテスト用の公開（ブラウザでは module がないため何もしない）
if (typeof module !== "undefined") {
  module.exports = { buildTopContent };
}
