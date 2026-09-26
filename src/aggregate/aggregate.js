// Task-007: 年ごとの集計と 3 つのランキング（Component-003 集計ロジック）
// 入力は有効な行（行の確認：Task-004 を通ったもの）と設定値、出力は集計結果のデータ。
// 他のファイルの関数（GAS では同じ場所で動く）
/* global calcBalance, calcWeight, roundToInteger, rankEntries */

// Task-007: 日付を「年-月-日」の文字列にする（同じ日付の判定に使う：c1/Question-016）
function toDateKey(date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

// Task-007: 1 年分の行を、プレイヤーごとの集計値にまとめる
// 戻り値：[{ nickname, days, weightedSum, balanceSum }]（丸める前の値）
function summarizePlayers(rows, settings) {
  const players = new Map();
  for (const row of rows) {
    if (!players.has(row.nickname)) {
      players.set(row.nickname, {
        nickname: row.nickname,
        dateKeys: new Set(),
        weightedSum: 0,
        balanceSum: 0,
      });
    }
    const player = players.get(row.nickname);
    const balance = calcBalance(
      row.finalChips,
      settings.distributedChips,
      row.debtCount,
    );
    player.dateKeys.add(toDateKey(row.playDate));
    player.weightedSum += balance * calcWeight(row.playTime);
    player.balanceSum += balance;
  }
  return [...players.values()].map((player) => ({
    nickname: player.nickname,
    days: player.dateKeys.size,
    weightedSum: player.weightedSum,
    balanceSum: player.balanceSum,
  }));
}

// Task-007: 1 年分の 3 つのランキングを作る
// 値は合計・平均を計算してから最後に 1 回だけ丸め、丸めた値で順位・強制労働の判定を行う（c1/Question-013、c1/Question-019）
function aggregateYear(rows, settings) {
  const players = summarizePlayers(rows, settings);

  // アベレージランキング：（収支 × ウェイト）の合計 ÷ 参加日数、大きい順（Feature-004、c1/Question-016）
  const average = rankEntries(
    players.map((p) => ({
      nickname: p.nickname,
      value: roundToInteger(p.weightedSum / p.days),
    })),
    "desc",
  );

  // 累計ランキング：収支の合計（基準値）、大きい順、全員が対象（Feature-005）
  const totals = players.map((p) => ({
    nickname: p.nickname,
    value: roundToInteger(p.balanceSum),
  }));
  const total = rankEntries(totals, "desc");

  // 強制労働への道のり：基準値がマイナスのプレイヤーのみ、小さい順（Feature-006 条件1）
  // 基準値 ≦ −（配布チップ数 × N）で「強制労働」（Feature-006 条件2）
  const threshold = -(settings.distributedChips * settings.forcedLaborCount);
  const forcedLabor = rankEntries(
    totals.filter((t) => t.value < 0),
    "asc",
  ).map((entry) => ({ ...entry, isForcedLabor: entry.value <= threshold }));

  return { average, total, forcedLabor };
}

// Task-007: 全年分を暦年ごとに集計する（Feature-007 条件1・条件2）
// rows：[{ nickname, playDate, playTime, finalChips, debtCount }]（有効な行。nickname は前後の空白を取り除いたもの）
// settings：{ distributedChips（配布チップ数）, forcedLaborCount（N） }
// 戻り値：{ years: [集計済みの年（昇順）], rankingsByYear: { 年: { average, total, forcedLabor } } }
function aggregateAllYears(rows, settings) {
  const rowsByYear = new Map();
  for (const row of rows) {
    const year = row.playDate.getFullYear();
    if (!rowsByYear.has(year)) {
      rowsByYear.set(year, []);
    }
    rowsByYear.get(year).push(row);
  }
  const years = [...rowsByYear.keys()].sort((a, b) => a - b);
  const rankingsByYear = {};
  for (const year of years) {
    rankingsByYear[year] = aggregateYear(rowsByYear.get(year), settings);
  }
  return { years, rankingsByYear };
}

// ローカルのテスト用の公開（GAS 上では module がないため何もしない）
if (typeof module !== "undefined") {
  module.exports = { toDateKey, summarizePlayers, aggregateAllYears };
}
