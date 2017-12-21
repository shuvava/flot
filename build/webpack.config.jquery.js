const webpack = require('webpack');

module.exports = (env) => {
    if (!env.globals && !env.globals.jquery) {
        return {};
    }
    if (env.globals.jquery === 'external') {
        // it means that jquery library will be linked before and separately from webpack bundle
        return {
            externals: {
                jquery: 'jQuery',
            },
        };
    }
    // env.globals.jquery === true
    //
    // jQuery lib included into bundle
    // whoever for old plugins bundle "global" variable will be exposed
    const config = {
        entry: {
            jquery: ['jquery'],
        },
        plugins: [
            new webpack.ProvidePlugin({
                $: 'jquery',
                jQuery: 'jquery',
                'window.jQuery': 'jquery',
            }),
            new webpack.optimize.CommonsChunkPlugin({
                names: ['jquery'],
                filename: '[name].bundle.js',
                minChunks: Infinity,
            }),
        ],
    };
    return config;
};
