const webpack = require('webpack');

module.exports = (env) => {
    if (env.babel == null) {
        env.babel = {};
    }
    const config = {
        stats: { modules: false },
        // node: {
        //     fs: 'empty',
        // },
        entry: {
            index: './src/index.js',
            jquery: ['./bak/jquery'],
        },
        resolve: {
            extensions: ['.js'],
            modules: ['node_modules', 'bower_components', 'bak'],
            descriptionFiles: ['package.json', '.bower.json'],
        },
        output: {
            // destination path /wwwroot folder
            path: env.dir,
            // public path
            // publicPath: env.web,
            // file name
            filename: '[name].js',
            chunkFilename: '[id].js',
        },
        module: {
            rules: [
                {
                    enforce: 'pre',
                    test: /\.js$/,
                    exclude: /node_modules/,
                    loader: 'eslint-loader',
                    options: {
                        fix: true,
                        failOnError: true,
                    },
                },
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    loader: 'babel-loader',
                    options: env.babel,
                },
            ],
        },
        plugins: [
            new webpack.DefinePlugin({
                'process.env': {
                    NODE_ENV: env.release ? 'debug' : 'production',
                },
            }),
            new webpack.optimize.CommonsChunkPlugin({
                names: ['jquery'],
                filename: '[name].js',
                minChunks: Infinity,
            }),
        ],
    };

    return config;
};
