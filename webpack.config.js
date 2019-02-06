const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const FixStyleOnlyEntriesPlugin = require("webpack-fix-style-only-entries");

const path = require('path');
const webpack = require('webpack');
const package = require('./package.json');

function name(prefix) {
    prefix = prefix ? '-' + prefix : '';

    return `${package.name}${prefix}-v${package.version}`;
}

module.exports = (env, argv) => {
    const prod = (argv.mode === 'production');

    const config = {
        entry: {
            [name('core')]: './src/scss/core.scss',
            [name('theme')]: './src/scss/theme.scss',
            [name()]: './src/main.js'
        },
        output: {
            filename: `[name].js`,
            library: 'TimeProgressBar',
            path: path.resolve(__dirname, 'dist')
        },
        module: {
            rules: [{
                    test: /\.(sa|sc|c)ss$/,
                    exclude: /node_modules/,
                    use: [
                        prod ? MiniCssExtractPlugin.loader : "style-loader", // creates style nodes from JS strings
                        "css-loader", // translates CSS into CommonJS
                        "sass-loader" // compiles Sass to CSS, using Node Sass by default
                    ]
                },
                {
                    test: /\.m?js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader'
                    }
                }
            ]
        },
        plugins: [
            new FixStyleOnlyEntriesPlugin(),
            new webpack.BannerPlugin({
                banner: require('./banner.js')
            }),
            new MiniCssExtractPlugin({
                filename: `[name].css`,
            }),
            new HtmlWebpackPlugin({
                template: './src/index.html',
                inject: false
            })
        ],
    }

    return config;
};
