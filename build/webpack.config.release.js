const webpack = require('webpack');

module.exports = (env) => {
    if (!env.release) {
        return {};
    }
    const config = {
        mode: 'production',
        plugins: [
            new webpack.optimize.UglifyJsPlugin({
                compress: { warnings: false },
            }),
        ],
    };
    return config;
};
