// Task-001: Jest の設定（Small テストをローカルの Node.js で実行する）
module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.js"],
};
