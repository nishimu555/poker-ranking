// Task-004: 行の確認の Small テスト
const { validateRow } = require("../../../src/aggregate/validate");

// 期待値1 の有効な行をもとに、一部の項目を差し替えた行を作る
function makeRow(overrides) {
  return {
    playerName: "ナッツ",
    playDate: new Date(2026, 8, 13),
    playTime: 1.5,
    finalChips: 25000,
    debtCount: 1,
    ...overrides,
  };
}

const numberFields = ["playTime", "finalChips", "debtCount"];

// Task-004 期待値1
test("すべての項目が正しい行は有効", () => {
  expect(validateRow(makeRow({}))).toEqual({ valid: true, nickname: "ナッツ" });
});

// Task-004 期待値2
test.each(["playerName", "playDate", ...numberFields])(
  "%s が空欄の行は無効",
  (field) => {
    expect(validateRow(makeRow({ [field]: "" })).valid).toBe(false);
    expect(validateRow(makeRow({ [field]: null })).valid).toBe(false);
  },
);

// Task-004 期待値3
test("プレイ日付が日付でない（文字列「abc」）行は無効", () => {
  expect(validateRow(makeRow({ playDate: "abc" })).valid).toBe(false);
});

// Task-004 期待値4
test.each(numberFields)("%s が数値でない（文字列「abc」）行は無効", (field) => {
  expect(validateRow(makeRow({ [field]: "abc" })).valid).toBe(false);
});

// Task-004 期待値5
test.each(numberFields)("%s がマイナス（-1）の行は無効", (field) => {
  expect(validateRow(makeRow({ [field]: -1 })).valid).toBe(false);
});

// Task-004 期待値6
test("プレイ時間 0、借金回数 0.5、最終チップ数 100.5 の行は有効", () => {
  expect(
    validateRow(makeRow({ playTime: 0, debtCount: 0.5, finalChips: 100.5 }))
      .valid,
  ).toBe(true);
});

// Task-004 期待値7
test("プレイヤー名の前後の空白を取り除いたニックネームを返す", () => {
  expect(validateRow(makeRow({ playerName: " ナッツ " }))).toEqual({
    valid: true,
    nickname: "ナッツ",
  });
});

// Task-004 期待値8
test("プレイヤー名が空白のみの行は無効（空欄として扱う）", () => {
  expect(validateRow(makeRow({ playerName: "   " })).valid).toBe(false);
});
