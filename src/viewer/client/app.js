// Task-020: 画面の共通部分（Component-007 Web アプリ：画面）
// 年の選択、画面の切り替え、データの取得の呼び出し、閲覧できない旨の表示、免責表示を行う。
// 表示内容を作る処理（年の選択肢と最初の年、閲覧できない旨）は DOM から分けた関数にする（Small テストの対象）。
// 画面に表示する文字列は、すべて文字（テキストノード）として表示し、HTML として解釈させない（b1/Question-018）。
// 他のファイルの関数（ビルドで 1 つの HTML に埋め込まれ、同じ場所で動く）
/* global renderTopScreen, renderRankingScreen, renderPlayerScreen, renderImageScreen */

// Task-020: 免責表示の文言（Feature-013、b1/Question-015）
const DISCLAIMER =
  "本ページは有志が作成したものであり、開催店舗とは関係ありません。";

// Task-020: データを取得できなかった場合の文言（サーバーから文言が返らない場合に使う）
const NOT_VIEWABLE_FALLBACK_MESSAGE =
  "閲覧できません。このページを閲覧するには、管理者からの招待が必要です。";

// Task-020: 年の選択肢（新しい年から）と、最初に選ぶ年（最新の年：c1/Question-020）
function buildYearOptions(years) {
  const options = [...years].sort((a, b) => b - a);
  return { options, selected: options.length > 0 ? options[0] : null };
}

// Task-020: 取得の結果が「閲覧できない」場合は、データの代わりに閲覧できない旨を表示する内容にする（Quality-001）
function buildNotViewableContent(result) {
  if (result && result.ok) {
    return { viewable: true };
  }
  return {
    viewable: false,
    message: (result && result.message) || NOT_VIEWABLE_FALLBACK_MESSAGE,
  };
}

// Task-020: 集計期間の表示（暦年：Feature-007 条件1）
function buildPeriodText(year) {
  return `集計期間：${year}/01/01〜${year}/12/31`;
}

// Task-020: 画面の状態（表示中のデータ、画面、ランキングの種類、プレイヤー）
const appState = {
  data: null,
  loading: true,
  screen: "top",
  rankingKind: "average",
  nickname: null,
};

// Task-020: 取得済みの年のデータ（年を切り替えるたびにサーバーに問い合わせないため）
const yearDataCache = {};

// Task-020: 要素を作る。文字列の子はテキストノードとして追加する（HTML として解釈させない）
function el(tag, props, children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props || {})) {
    if (key === "className") {
      node.className = value;
    } else if (key === "onClick") {
      node.addEventListener("click", (event) => {
        event.preventDefault();
        value(event);
      });
    } else if (key === "onChange") {
      node.addEventListener("change", value);
    } else {
      node.setAttribute(key, String(value));
    }
  }
  for (const child of [].concat(children === undefined ? [] : children)) {
    if (child === null || child === undefined || child === false) {
      continue;
    }
    node.appendChild(
      typeof child === "string" || typeof child === "number"
        ? document.createTextNode(String(child))
        : child,
    );
  }
  return node;
}

// Task-020: 画面を切り替える（screen："top"・"ranking"・"player"・"image"）
function navigate(screen, params) {
  Object.assign(appState, { screen }, params || {});
  render();
  window.scrollTo(0, 0);
}

// Task-020: 年の選択（集計済みの年のすべて：Feature-007 条件2、c1/Question-021）
function buildYearSelect() {
  const { options } = buildYearOptions(appState.data.years);
  const select = el(
    "select",
    {
      "aria-label": "年を選ぶ",
      onChange: (event) => loadYear(Number(event.target.value)),
    },
    options.map((year) => el("option", { value: year }, `${year}年`)),
  );
  select.value = String(appState.data.year);
  return select;
}

// Task-020: 各画面に渡す共通の部品
const screenHelpers = {
  el,
  navigate,
  buildYearSelect,
  buildPeriodText,
};

// Task-020: 画面の描画関数（各画面のファイルで定義する。未定義の画面は準備中と表示する）
function findRenderer(screen) {
  const renderers = {
    top: typeof renderTopScreen === "function" ? renderTopScreen : null,
    ranking:
      typeof renderRankingScreen === "function" ? renderRankingScreen : null,
    player:
      typeof renderPlayerScreen === "function" ? renderPlayerScreen : null,
    image: typeof renderImageScreen === "function" ? renderImageScreen : null,
  };
  return renderers[screen] || null;
}

// Task-020: 表示中の状態に従って画面を描く。すべての画面の末尾に免責表示を置く（Feature-013）
function render() {
  const container = document.getElementById("app");
  const nodes = [];
  if (appState.loading) {
    nodes.push(el("p", { className: "loading" }, "読み込み中…"));
  } else {
    const content = buildNotViewableContent(appState.data);
    if (!content.viewable) {
      nodes.push(
        el("header", { className: "app-header" }, [
          el("div", { className: "suits" }, "♠ ♥ ♦ ♣"),
          el("h1", {}, "POKER RANKING"),
        ]),
        el("p", { className: "not-viewable" }, content.message),
      );
    } else if (appState.data.year === null) {
      nodes.push(el("p", { className: "note" }, "集計結果がまだありません。"));
    } else {
      const renderer = findRenderer(appState.screen);
      nodes.push(
        ...(renderer
          ? renderer(appState.data, appState, screenHelpers)
          : [el("p", { className: "note" }, "準備中です。")]),
      );
    }
  }
  nodes.push(el("footer", {}, DISCLAIMER));
  container.replaceChildren(...nodes);
}

// Task-020: 年を指定してデータを取得し、画面を描き直す（Component-006 の getViewerData を呼ぶ）
function loadYear(year) {
  if (year !== undefined && yearDataCache[year]) {
    appState.data = yearDataCache[year];
    render();
    return;
  }
  appState.loading = true;
  render();
  google.script.run
    .withSuccessHandler((result) => {
      if (result && result.ok && result.year !== null) {
        yearDataCache[result.year] = result;
      }
      appState.data = result;
      appState.loading = false;
      render();
    })
    .withFailureHandler((error) => {
      console.error(error);
      appState.data = { ok: false, message: NOT_VIEWABLE_FALLBACK_MESSAGE };
      appState.loading = false;
      render();
    })
    .getViewerData(year);
}

// Task-020: 画面を開いたときに、最新の年のデータを取得する（ブラウザでのみ動く）
if (typeof document !== "undefined" && typeof google !== "undefined") {
  loadYear();
}

// ローカルのテスト用の公開（ブラウザでは module がないため何もしない）
if (typeof module !== "undefined") {
  module.exports = {
    DISCLAIMER,
    buildYearOptions,
    buildNotViewableContent,
    buildPeriodText,
  };
}
