// Task-003: ビルド用のスクリプトの Small テスト
// 一時フォルダに src/ の見本を作り、ビルドの出力（dist/）を確認する
const fs = require("fs");
const os = require("os");
const path = require("path");
const { build } = require("../../../scripts/build");

// 一時フォルダにファイルを作る（相対パス → 内容）
function writeFiles(rootDir, files) {
  for (const [relPath, content] of Object.entries(files)) {
    const filePath = path.join(rootDir, relPath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
  }
}

// フォルダ内のファイルを相対パスの一覧で返す（並べ替え済み）
function listFiles(dir) {
  const result = [];
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else {
        result.push(path.relative(dir, fullPath).split(path.sep).join("/"));
      }
    }
  };
  walk(dir);
  return result.sort();
}

const aggregateFiles = {
  "src/aggregate/appsscript.json": '{ "timeZone": "Asia/Tokyo" }\n',
  "src/aggregate/calc.js": "function calc() { return 1; }\n",
  "src/aggregate/menu.js": "function onOpen() {}\n",
  "src/aggregate/notes.md": "メモ\n",
  "tests/small/aggregate/calc.test.js": "test('x', () => {});\n",
  "package.json": "{}\n",
  "eslint.config.js": "module.exports = [];\n",
};

const viewerFiles = {
  "src/viewer/appsscript.json": '{ "timeZone": "Asia/Tokyo" }\n',
  "src/viewer/server.js": "function doGet() {}\n",
  "src/viewer/client/index.html": [
    "<!DOCTYPE html>",
    "<html>",
    "<head>",
    '<link rel="stylesheet" href="style.css">',
    "</head>",
    "<body>",
    '<script src="format.js"></script>',
    '<script src="app.js"></script>',
    "</body>",
    "</html>",
    "",
  ].join("\n"),
  "src/viewer/client/style.css": "body { color: #123456; }\n",
  "src/viewer/client/format.js":
    "function formatValue() { return 'FORMAT'; }\n",
  "src/viewer/client/app.js": "function startApp() { return 'APP'; }\n",
};

let rootDir;

beforeEach(() => {
  rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "build-test-"));
});

afterEach(() => {
  fs.rmSync(rootDir, { recursive: true, force: true });
});

// Task-003 期待値1
test("集計用：dist/aggregate/ に .js と appsscript.json のみが出力される", () => {
  writeFiles(rootDir, { ...aggregateFiles, ...viewerFiles });

  build(rootDir);

  expect(listFiles(path.join(rootDir, "dist/aggregate"))).toEqual([
    "appsscript.json",
    "calc.js",
    "menu.js",
  ]);
  expect(
    fs.readFileSync(path.join(rootDir, "dist/aggregate/calc.js"), "utf8"),
  ).toBe(aggregateFiles["src/aggregate/calc.js"]);
  // tests/・設定ファイルは dist/ のどこにも含まれない
  const allDist = listFiles(path.join(rootDir, "dist"));
  expect(allDist.some((f) => f.endsWith(".test.js"))).toBe(false);
  expect(allDist.some((f) => f.endsWith("package.json"))).toBe(false);
  expect(allDist.some((f) => f.endsWith("eslint.config.js"))).toBe(false);
});

// Task-003 期待値2
test("閲覧用：dist/viewer/ に server.js、appsscript.json、CSS・JavaScript を埋め込んだ HTML が出力される", () => {
  writeFiles(rootDir, { ...aggregateFiles, ...viewerFiles });

  build(rootDir);

  expect(listFiles(path.join(rootDir, "dist/viewer"))).toEqual([
    "appsscript.json",
    "index.html",
    "server.js",
  ]);
  const html = fs.readFileSync(
    path.join(rootDir, "dist/viewer/index.html"),
    "utf8",
  );
  // CSS・JavaScript の内容が埋め込まれている
  expect(html).toContain("body { color: #123456; }");
  expect(html).toContain("function formatValue() { return 'FORMAT'; }");
  expect(html).toContain("function startApp() { return 'APP'; }");
  // 外部ファイルの参照が残っていない
  expect(html).not.toMatch(/<link[^>]*href="style\.css"/);
  expect(html).not.toMatch(/<script[^>]*src=/);
  // JavaScript は index.html に書いた順に埋め込まれる
  expect(html.indexOf("FORMAT")).toBeLessThan(html.indexOf("APP"));
});

// Task-003 期待値3
test("前回のビルドの出力は消され、今回の出力のみになる", () => {
  writeFiles(rootDir, {
    ...aggregateFiles,
    ...viewerFiles,
    "dist/aggregate/old.js": "function old() {}\n",
    "dist/viewer/old.html": "<p>old</p>\n",
    "dist/other/left.txt": "残り\n",
  });

  build(rootDir);

  expect(listFiles(path.join(rootDir, "dist"))).toEqual([
    "aggregate/appsscript.json",
    "aggregate/calc.js",
    "aggregate/menu.js",
    "viewer/appsscript.json",
    "viewer/index.html",
    "viewer/server.js",
  ]);
});
