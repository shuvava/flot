const webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env) => {
    if (env.release) {
        return {};
    }
    const config = {
        mode: 'development',
        plugins: [
            new webpack.SourceMapDevToolPlugin({
                // Remove this line if you prefer inline source maps
                filename: '[file].map',
                // Point sourcemap entries to the original file locations on disk
                moduleFilenameTemplate: '[resourcePath]',
            }),
            new HtmlWebpackPlugin({
                title: 'Flot Examples: Real-time updates',
                filename: 'example_realtime.html',
                template: 'examples/realtime/index_tmp.html'
            }),
        ],
        devServer: {
            contentBase: './dist',
        },
    };
    return config;
};
