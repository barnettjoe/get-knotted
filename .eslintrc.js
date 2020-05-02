module.exports = {
  root: true,
  env: {
    node: true,
  },
  parserOptions: {
    ecmaVersion: 2017,
  },
  plugins: ["prettier"],
  extends: ["eslint:recommended", "prettier"],
};
