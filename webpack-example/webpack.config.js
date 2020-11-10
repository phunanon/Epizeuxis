const path = require("path");

module.exports = (env, args) => {
  return {
    entry: {
      index: "./src/index.epi",
    },
    module: {
      rules: [
        {
          test: /\.epi$/,
          use: [
            {
              loader: path.resolve("epizeuxis-loader.js")
            },
          ],
        },
      ],
    },
  };
};
