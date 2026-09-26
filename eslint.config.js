// Task-001: ESLint の設定（推奨ルール ＋ GAS の組み込みオブジェクトを既知として登録）
// 推奨ルールは、ESLint 本体の組み込みルールのうち recommended の印が付いたものを有効にする。
// （@eslint/js の recommended と同じ内容。計画にない依存ライブラリを追加しないため、ESLint 本体から作る）
const { builtinRules } = require("eslint/use-at-your-own-risk");

const recommendedRules = Object.fromEntries(
  [...builtinRules]
    .filter(
      ([, rule]) => rule.meta && rule.meta.docs && rule.meta.docs.recommended,
    )
    .map(([name]) => [name, "error"]),
);

// GAS の組み込みオブジェクト（書き換えない）
const gasGlobals = {
  SpreadsheetApp: "readonly",
  HtmlService: "readonly",
  PropertiesService: "readonly",
  LockService: "readonly",
  ScriptApp: "readonly",
  Session: "readonly",
  Utilities: "readonly",
  Logger: "readonly",
  console: "readonly",
  // ローカルのテストから読み込むための公開部分（module がある場合のみ公開する）
  module: "readonly",
};

// ブラウザで動く画面の JavaScript が使う組み込みオブジェクト
const browserGlobals = {
  window: "readonly",
  document: "readonly",
  console: "readonly",
  google: "readonly",
  module: "readonly",
};

// Node.js で動くスクリプト・設定ファイル
const nodeGlobals = {
  require: "readonly",
  module: "writable",
  __dirname: "readonly",
  __filename: "readonly",
  process: "readonly",
  console: "readonly",
};

// Jest のテスト
const jestGlobals = {
  describe: "readonly",
  test: "readonly",
  it: "readonly",
  expect: "readonly",
  beforeAll: "readonly",
  beforeEach: "readonly",
  afterAll: "readonly",
  afterEach: "readonly",
  jest: "readonly",
};

module.exports = [
  {
    ignores: ["dist/", "node_modules/"],
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
    },
    rules: recommendedRules,
  },
  {
    // GAS 上で動くコード（全ファイルが同じ場所で動くため script として扱う）
    files: ["src/aggregate/**/*.js", "src/viewer/*.js"],
    languageOptions: { sourceType: "script", globals: gasGlobals },
  },
  {
    files: ["src/viewer/client/**/*.js"],
    languageOptions: { sourceType: "script", globals: browserGlobals },
  },
  {
    files: ["scripts/**/*.js", "*.config.js"],
    languageOptions: { globals: nodeGlobals },
  },
  {
    files: ["tests/**/*.js"],
    languageOptions: { globals: { ...nodeGlobals, ...jestGlobals } },
  },
];
