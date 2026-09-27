// Task-016: デプロイ用のスクリプト（ビルドしてから clasp push する）
// 使い方：npm run deploy:aggregate（集計用）
// GAS に送るのは dist/<プロジェクト>/ の中のファイルのみとする（c1/Question-007-1）。
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { build } = require("./build");

const ROOT_DIR = path.resolve(__dirname, "..");

// Task-016: プロジェクトごとの clasp の設定ファイル（Git の管理対象外。見本は deploy/<プロジェクト>/.clasp.json.example）
// clasp は設定ファイルのあるフォルダを基点とし、rootDir がその外にあると拒否するため、設定ファイルはリポジトリの直下に置く
const TARGETS = {
  aggregate: { configFile: ".clasp-aggregate.json" },
};

// Task-016: 設定ファイルを読み、rootDir が dist/<プロジェクト>/ を指すことを確かめる（送るファイルの範囲の限定：c1/Question-007-1）
function readClaspConfig(rootDir, target) {
  const configPath = path.join(rootDir, TARGETS[target].configFile);
  if (!fs.existsSync(configPath)) {
    throw new Error(
      `${TARGETS[target].configFile} がありません。deploy/${target}/.clasp.json.example をリポジトリの直下に ${TARGETS[target].configFile} という名前で複製し、scriptId を記入してください。`,
    );
  }
  let config;
  try {
    config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  } catch (error) {
    throw new Error(
      `${TARGETS[target].configFile} を JSON として読めません（${error.message}）。`,
      { cause: error },
    );
  }
  const expected = path.join(rootDir, "dist", target);
  if (
    typeof config.rootDir !== "string" ||
    path.resolve(rootDir, config.rootDir) !== expected
  ) {
    throw new Error(
      `${TARGETS[target].configFile} の rootDir は dist/${target} にしてください（GAS に送るファイルを dist/${target}/ に限定するため）。`,
    );
  }
  if (typeof config.scriptId !== "string" || config.scriptId.trim() === "") {
    throw new Error(
      `${TARGETS[target].configFile} に scriptId を記入してください。`,
    );
  }
  return configPath;
}

// Task-016: clasp を実行する（シェルを介さずに実行し、出力はそのまま表示する）
function runClasp(rootDir, args) {
  const claspBin = path.join(rootDir, "node_modules", ".bin", "clasp");
  const result = spawnSync(claspBin, args, { cwd: rootDir, stdio: "inherit" });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(
      `clasp ${args.join(" ")} が失敗しました（終了コード ${result.status}）。`,
    );
  }
}

// Task-016: 指定したプロジェクトをビルドし、clasp push で GAS に送る
function deploy(target, rootDir = ROOT_DIR) {
  if (!Object.prototype.hasOwnProperty.call(TARGETS, target)) {
    throw new Error(
      `デプロイの対象は ${Object.keys(TARGETS).join("、")} のいずれかを指定してください。`,
    );
  }
  const configPath = readClaspConfig(rootDir, target);
  build(rootDir);
  // --force：GAS 側のマニフェスト（appsscript.json）も、確認なしで dist の内容で置き換える
  runClasp(rootDir, ["--project", configPath, "push", "--force"]);
}

if (require.main === module) {
  try {
    deploy(process.argv[2]);
    console.log(`${process.argv[2]} のデプロイ（clasp push）が完了しました。`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { deploy };
