// Test-124（Quality-006、c3/Question-005、c4/Question-001）: テストデータ B（3 年分のプレイ結果）を CSV で作る
// 使い方：node tests/data/generate-test-data-b.js（tests/data/test-data-b.csv を作り直す）
// 内容：架空のニックネーム「プレイヤー01」〜「プレイヤー30」、2024〜2026 年の各年 24 実施日（毎月の第 2・第 4 日曜日）に全員が参加。
// 値は乱数の種を固定して作るため、何度実行しても同じ内容になる。
const fs = require("fs");
const path = require("path");

const OUTPUT = path.join(__dirname, "test-data-b.csv");
const YEARS = [2024, 2025, 2026];
const PLAYER_COUNT = 30;
const SEED = 20260927;

// 乱数の種を固定した疑似乱数（mulberry32）
function createRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 指定した年・月の第 n 日曜日
function nthSunday(year, month, n) {
  const first = new Date(year, month, 1);
  const offset = (7 - first.getDay()) % 7;
  return new Date(year, month, 1 + offset + (n - 1) * 7);
}

function formatDate(date) {
  const pad = (v) => String(v).padStart(2, "0");
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())}`;
}

function generate() {
  const random = createRandom(SEED);
  const pick = (min, max) => min + Math.floor(random() * (max - min + 1));
  const lines = ["プレイヤー名,プレイ日付,プレイ時間,最終チップ数,借金回数"];
  for (const year of YEARS) {
    for (let month = 0; month < 12; month += 1) {
      for (const n of [2, 4]) {
        const date = formatDate(nthSunday(year, month, n));
        for (let p = 1; p <= PLAYER_COUNT; p += 1) {
          const name = `プレイヤー${String(p).padStart(2, "0")}`;
          const playTime = pick(1, 8) / 2; // 0.5〜4.0（0.5 刻み）
          const finalChips = pick(0, 60000); // 0〜60,000
          const debtCount = pick(0, 3); // 0〜3
          lines.push(`${name},${date},${playTime},${finalChips},${debtCount}`);
        }
      }
    }
  }
  return `${lines.join("\n")}\n`;
}

if (require.main === module) {
  fs.writeFileSync(OUTPUT, generate(), "utf8");
  console.log(`${OUTPUT} を作成しました。`);
}

module.exports = { generate };
