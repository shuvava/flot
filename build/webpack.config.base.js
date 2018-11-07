const path = require('path');
// const webpack = require('webpack');

module.exports = (env) => {
    if (env.babel == null) {
        env.babel = {};
    }
    const config = {
        stats: { modules: false },
        resolve: {
            extensions: ['.js'],
            modules: [
                path.resolve(env.rootPath, './node_modules'),
                path.resolve(env.rootPath, './bower_components'),
                path.resolve(env.rootPath, './bak'),
            ],
            descriptionFiles: ['package.json', '.bower.json'],
        },
        output: {
            // destination path /wwwroot folder
            path: env.dir,
            // public path
            // publicPath: env.web,
            // file name
            filename: '[name].bundle.js',
            chunkFilename: '[id].bundle.js',
        },
        module: {
            rules: [
                {
                    enforce: 'pre',
                    test: /\.js$/,
                    exclude: /node_modules/, // /(\/node_modules\/|test\.js$)/,
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
            // new webpack.DefinePlugin({
            //     'process.env': {
            //         NODE_ENV: env.release ? 'debug' : 'production',
            //     },
            //     PRODUCTION: env.release,
            // }),
        ],
    };

    return config;
};
