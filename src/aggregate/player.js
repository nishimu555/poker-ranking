// Task-008: 個人の戦績の集計（Component-003 集計ロジック）
// 入力は有効な行（行の確認：Task-004 を通ったもの）と設定値、出力は年ごと・プレイヤーごとの戦績のデータ。
// 他のファイルの関数（GAS では同じ場所で動く）
/* global calcBalance, roundToInteger, toDateKey, groupRowsByYear, aggregateAllYears */

// Task-008: ランキングからプレイヤーの順位を探す。含まれない場合は null（Feature-010 条件2-2：画面で「−」）
function findRank(rankedEntries, nickname) {
  const entry = rankedEntries.find((e) => e.nickname === nickname);
  return entry ? entry.rank : null;
}

// Task-008: 1 年分・1 人分の戦績を作る
// playerRows：そのプレイヤーのその年の行、rankings：その年の 3 つのランキング（Task-007）
function buildPlayerStats(nickname, playerRows, settings, rankings) {
  const dateKeys = new Set();
  let totalPlayTime = 0;
  let totalDebtCount = 0;
  const history = [];
  for (const row of playerRows) {
    dateKeys.add(toDateKey(row.playDate));
    totalPlayTime += row.playTime;
    totalDebtCount += row.debtCount;
    history.push({
      playDate: row.playDate,
      playTime: row.playTime,
      finalChips: row.finalChips,
      debtCount: row.debtCount,
      // 実施日ごとの収支は整数に四捨五入する（c1/Question-019）
      balance: roundToInteger(
        calcBalance(row.finalChips, settings.distributedChips, row.debtCount),
      ),
    });
  }
  // 履歴は新しい日付から並べる（Screen-005）。同じ日付の行は入力の順のまま
  history.sort((a, b) => b.playDate.getTime() - a.playDate.getTime());

  // 収支の累計（基準値）と平均値チップ数は、Task-007 で丸めたランキングの値を使う（c1/Question-019）
  const totalBalance = rankings.total.find(
    (e) => e.nickname === nickname,
  ).value;
  const averageChips = rankings.average.find(
    (e) => e.nickname === nickname,
  ).value;

  return {
    nickname,
    days: dateKeys.size,
    totalPlayTime,
    totalBalance,
    averageChips,
    totalDebtCount,
    // 強制労働までの残りチップ数 ＝ 基準値 −（−配布チップ数 × N）（Feature-010 条件1）
    remainingChips:
      totalBalance + settings.distributedChips * settings.forcedLaborCount,
    ranks: {
      average: findRank(rankings.average, nickname),
      total: findRank(rankings.total, nickname),
      forcedLabor: findRank(rankings.forcedLabor, nickname),
    },
    history,
  };
}

// Task-008: 全年分の個人の戦績を暦年ごとに集計する（Feature-010）
// rows：[{ nickname, playDate, playTime, finalChips, debtCount }]（有効な行）
// settings：{ distributedChips（配布チップ数）, forcedLaborCount（N） }
// 戻り値：{ 年: [個人の戦績] }。各年のプレイヤーは累計ランキングの順に並ぶ
function aggregatePlayerStats(rows, settings) {
  const { rankingsByYear } = aggregateAllYears(rows, settings);
  const playersByYear = {};
  for (const [year, yearRows] of groupRowsByYear(rows)) {
    const rankings = rankingsByYear[year];
    playersByYear[year] = rankings.total.map((entry) =>
      buildPlayerStats(
        entry.nickname,
        yearRows.filter((row) => row.nickname === entry.nickname),
        settings,
        rankings,
      ),
    );
  }
  return playersByYear;
}

// ローカルのテスト用の公開（GAS 上では module がないため何もしない）
if (typeof module !== "undefined") {
  module.exports = { aggregatePlayerStats };
}
