const fs = require("fs");
const path = require("path");
const ASSETS_PATH = path.resolve(__dirname, "./assets");

module.exports = (options, args) => {
  const config = {
    entry: {},
    output: {
      path: path.resolve(__dirname, ASSETS_PATH),
      filename: args.mode === "production" ? "[name].min.js" : "[name].js",
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: [],
        },
        {
          test: /\.scss$/,
          exclude: /node_modules/,
          type: "asset/resource",
          generator: {
            filename:
              args.mode === "production" ? "[name].min.css" : "[name].css",
          },

          use: ["sass-loader"],
        },
      ],
    }
  };

  const jsfiles = fs.readdirSync(path.resolve(__dirname, "./src/js"));
  const scssfiles = fs.readdirSync(path.resolve(__dirname, "./src/sass/pages"));

  for (const file of jsfiles) {
    if (file.endsWith(".js")) {
      config.entry[`${file.replace(".js", "")}`] = path.resolve(__dirname, `src/js/${file}`);
    }
  }
  config.entry[`wishlist-king`] = path.resolve(__dirname, `src/js/lib/wishlist-king`);

  for (const file of scssfiles) {
    if (file.endsWith(".scss")) {
      config.entry[`${file.replace(".scss", "-style")}`] = path.resolve(__dirname,`src/sass/pages/${file}`);
    }
  }

  return config;
};