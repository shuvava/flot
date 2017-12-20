const webpack = require('webpack');

module.exports = (env) => {
    if (!env.globals && !env.globals.jquery) {
        return {};
    }
    const config = {
        plugins: [
            new webpack.ProvidePlugin({
                $: 'jquery',
                jQuery: 'jquery',
                'window.jQuery': 'jquery',
            }),
        ],
    };
    return config;
};
