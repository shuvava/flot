const webpack = require('webpack');

module.exports = (env) => {
    if (!env.release) {
        return {};
    }
    const config = {
        plugins: [
            new webpack.optimize.UglifyJsPlugin({
                compress: { warnings: false },
            }),
        ],
    };
    return config;
};
