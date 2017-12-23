const path = require('path');
const webpack = require('webpack');

module.exports = (env) => {
    if (!env.karma) {
        return {};
    }
    const config = {
        context: env.rootPath,
        module: {
            rules: [
                {
                    test: /\.js$/,
                    use: { loader: 'istanbul-instrumenter-loader' },
                    include: path.resolve(env.rootPath, './src'),
                    enforce: 'post',
                },
                {
                    test: path.resolve(env.rootPath, '/bak/jquery.js'),
                    use: [
                        {
                            loader: 'expose-loader',
                            options: '$',
                        },
                        {
                            loader: 'expose-loader',
                            options: 'jQuery',
                        },
                    ],
                },
            ],
        },
        plugins: [
            new webpack.optimize.LimitChunkCountPlugin({
                maxChunks: 1,
            }),
            new webpack.SourceMapDevToolPlugin({
                // Point sourcemap entries to the original file locations on disk
                moduleFilenameTemplate: '[resourcePath]',
            }),
        ],
    };
    return config;
};
