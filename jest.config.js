module.exports = {
  testEnvironment: "node",

  collectCoverage: true,

  coverageDirectory: "coverage",

  collectCoverageFrom: [
    "server.js",
    "js/**/*.js"
  ],

  testMatch: [
    "**/tests/**/*.test.js"
  ]
};