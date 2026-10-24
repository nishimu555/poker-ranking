// Task-003: ビルド用のスクリプト
// src/aggregate/ → dist/aggregate/、src/viewer/ → dist/viewer/ を生成する。
// GAS に送るファイルを限定するため（c1/Question-007-1）、各プロジェクトの直下の .js と appsscript.json のみを出力する。
// 閲覧用の画面（src/viewer/client/）は、index.html が参照する CSS・JavaScript を埋め込んだ 1 つの HTML にする（c1/Question-001）。
// ローカルのテスト用の公開部分（module がある場合のみ公開する記述）は、GAS 上では module がないため動作に影響せず、そのまま残す。
const fs = require("fs");
const path = require("path");

const PROJECTS = ["aggregate", "viewer"];
const CLIENT_DIR = "client";
const CLIENT_HTML = "index.html";

// Task-003: GAS に送る対象のファイルか（.js と appsscript.json のみ）
function isGasFile(fileName) {
  return fileName.endsWith(".js") || fileName === "appsscript.json";
}

// Task-003: 埋め込む内容が、埋め込み先のタグを途中で閉じてしまわないことを確かめる
function assertEmbeddable(content, closingTag, fileName) {
  if (content.toLowerCase().includes(closingTag)) {
    throw new Error(
      `${fileName} に ${closingTag} が含まれるため、HTML に埋め込めません`,
    );
  }
}

// Task-003: 参照先のファイルを読み込む（client/ の外を参照させない）
function readClientFile(clientDir, ref) {
  const filePath = path.resolve(clientDir, ref);
  if (path.dirname(filePath) !== path.resolve(clientDir)) {
    throw new Error(
      `index.html が client/ の外のファイルを参照しています：${ref}`,
    );
  }
  return fs.readFileSync(filePath, "utf8");
}

// Task-003: index.html の <link rel="stylesheet" href="..."> と <script src="..."></script> を、ファイルの内容に置き換える
function inlineClientHtml(clientDir) {
  const html = fs.readFileSync(path.join(clientDir, CLIENT_HTML), "utf8");
  return html
    .replace(/<link\s+rel="stylesheet"\s+href="([^"]+)"\s*\/?>/g, (_, ref) => {
      const css = readClientFile(clientDir, ref);
      assertEmbeddable(css, "</style", ref);
      return `<style>\n${css}</style>`;
    })
    .replace(/<script\s+src="([^"]+)"\s*><\/script>/g, (_, ref) => {
      const js = readClientFile(clientDir, ref);
      assertEmbeddable(js, "</script", ref);
      return `<script>\n${js}</script>`;
    });
}

// Task-003: 1 つのプロジェクトを出力する
function buildProject(srcDir, distDir, project) {
  const projectSrc = path.join(srcDir, project);
  if (!fs.existsSync(projectSrc)) {
    // 後続のタスクで作成するまでプロジェクトのフォルダがないため、出力しない
    console.log(`src/${project}/ がないため、出力しません`);
    return;
  }
  const projectDist = path.join(distDir, project);
  fs.mkdirSync(projectDist, { recursive: true });

  for (const entry of fs.readdirSync(projectSrc, { withFileTypes: true })) {
    if (entry.isFile() && isGasFile(entry.name)) {
      fs.copyFileSync(
        path.join(projectSrc, entry.name),
        path.join(projectDist, entry.name),
      );
    }
  }

  const clientDir = path.join(projectSrc, CLIENT_DIR);
  if (fs.existsSync(path.join(clientDir, CLIENT_HTML))) {
    fs.writeFileSync(
      path.join(projectDist, CLIENT_HTML),
      inlineClientHtml(clientDir),
    );
  }
}

// Task-003: ビルドの入口。前回の出力（dist/）を消してから、今回の出力を作る
function build(rootDir) {
  const srcDir = path.join(rootDir, "src");
  const distDir = path.join(rootDir, "dist");
  fs.rmSync(distDir, { recursive: true, force: true });
  for (const project of PROJECTS) {
    buildProject(srcDir, distDir, project);
  }
}

if (require.main === module) {
  build(path.resolve(__dirname, ".."));
  console.log("dist/ を生成しました");
}

module.exports = { build };
