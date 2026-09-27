// Task-025: 画像の描画と Screen-006 画像生成画面（Component-008 画像生成）
// Task-024 の内容（buildImageLayout）を canvas に描き、画像（PNG）として画面に表示する。
// 利用者は画像を長押しして端末に保存・共有する（Decision-0004）。外部のライブラリ・通信は使わない（Decision-0003）。
// 他のファイルの関数（ビルドで 1 つの HTML に埋め込まれ、同じ場所で動く）
/* global buildImageLayout */
// app.js から呼ばれる関数
/* exported renderImageScreen */

// Task-025: 画像の文字の書体（画面と同じ）
const IMAGE_FONT_FAMILY =
  '-apple-system, "Hiragino Sans", "Noto Sans JP", sans-serif';

// Task-025: 角の丸い四角形の経路を作る（roundRect に対応しないブラウザでも動くよう自前で作る）
function traceRoundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.arcTo(x + width, y, x + width, y + radius, radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
  ctx.lineTo(x + radius, y + height);
  ctx.arcTo(x, y + height, x, y + height - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

// Task-025: 描く内容を canvas に描く
function drawImageLayout(ctx, layout) {
  const { width, height } = layout;
  let frame = null;
  for (const item of layout.items) {
    if (item.type === "frame") {
      frame = item;
    }
  }
  const inset = frame ? frame.lineWidth / 2 : 0;
  const radius = frame ? frame.radius : 0;
  for (const item of layout.items) {
    if (item.type === "background") {
      // 背景：上端の中央を中心とした放射状のグラデーション（モック：radial-gradient(circle at top, …, … 70%)）
      const outer = Math.hypot(width / 2, height) * 0.7;
      const gradient = ctx.createRadialGradient(
        width / 2,
        0,
        0,
        width / 2,
        0,
        outer,
      );
      gradient.addColorStop(0, item.colors.backgroundInner);
      gradient.addColorStop(1, item.colors.backgroundOuter);
      ctx.save();
      traceRoundRect(
        ctx,
        inset,
        inset,
        width - inset * 2,
        height - inset * 2,
        radius,
      );
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.restore();
    } else if (item.type === "frame") {
      traceRoundRect(
        ctx,
        inset,
        inset,
        width - inset * 2,
        height - inset * 2,
        radius,
      );
      ctx.lineWidth = item.lineWidth;
      ctx.strokeStyle = item.color;
      ctx.stroke();
    } else if (item.type === "line") {
      ctx.beginPath();
      ctx.moveTo(item.x1, item.y);
      ctx.lineTo(item.x2, item.y);
      ctx.lineWidth = item.lineWidth;
      ctx.strokeStyle = item.color;
      ctx.stroke();
    } else if (item.type === "text") {
      ctx.font = `${item.bold ? "bold " : ""}${item.size}px ${IMAGE_FONT_FAMILY}`;
      ctx.fillStyle = item.color;
      ctx.textAlign = item.align;
      ctx.textBaseline = "top";
      if (item.maxWidth) {
        // 長いニックネームは幅に収まるよう縮めて描く
        ctx.fillText(item.text, item.x, item.y, item.maxWidth);
      } else {
        ctx.fillText(item.text, item.x, item.y);
      }
    }
  }
}

// Task-025: 画像を作り、PNG の data URL を返す（Feature-012 条件1）
function createRankingImage(data) {
  const layout = buildImageLayout(data);
  const canvas = document.createElement("canvas");
  canvas.width = layout.width;
  canvas.height = layout.height;
  drawImageLayout(canvas.getContext("2d"), layout);
  return canvas.toDataURL("image/png");
}

// Task-025: Screen-006 画像生成画面を描く（採用したモック：Screen-006）
function renderImageScreen(data, state, helpers) {
  const { el, navigate } = helpers;
  const image = el("img", {
    className: "ranking-image",
    alt: `${data.year} 年のランキングの画像（9:16）`,
    src: createRankingImage(data),
  });
  return [
    el("div", { className: "top-bar" }, [
      el(
        "a",
        { className: "link", href: "#", onClick: () => navigate("top") },
        "‹ トップへ",
      ),
    ]),
    el(
      "p",
      { className: "guide" },
      "画像を長押しすると、端末に保存・共有できます。",
    ),
    el("div", { className: "image-view" }, [image]),
    el("div", { className: "actions" }, [
      el(
        "a",
        { className: "ghost", href: "#", onClick: () => navigate("top") },
        "戻る",
      ),
      el(
        "a",
        {
          className: "primary",
          href: "#",
          onClick: () => {
            image.src = createRankingImage(data);
          },
        },
        "画像を作り直す",
      ),
    ]),
  ];
}
