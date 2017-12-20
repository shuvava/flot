const WebpackCleanupPlugin = require('webpack-cleanup-plugin');

module.exports = (env) => {
    if (!env.clean) {
        return {};
    }
    const config = {
        plugins: [
            new WebpackCleanupPlugin({}),
        ],
    };
    return config;
};
