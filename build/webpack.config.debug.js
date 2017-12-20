const webpack = require('webpack');

module.exports = (env) => {
    if (env.release) {
        return {};
    }
    const config = {
        plugins: [
            new webpack.SourceMapDevToolPlugin({
                // Remove this line if you prefer inline source maps
                filename: '[file].map',
                // Point sourcemap entries to the original file locations on disk
                moduleFilenameTemplate: '[resourcePath]',
            }),
        ],
    };
    return config;
};
