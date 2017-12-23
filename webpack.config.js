const merge = require('webpack-merge');
const setEnv = require('./build/configuration');
const base = require('./build/webpack.config.base');
const cleanup = require('./build/webpack.config.cleanup');
const analytics = require('./build/webpack.config.analytics');
const jquery = require('./build/webpack.config.jquery');
const debug = require('./build/webpack.config.debug');
const release = require('./build/webpack.config.release');
const web = require('./build/webpack.config.web');
const umd = require('./build/webpack.config.umd');

module.exports = (env) => {
    const _env = setEnv(env);

    const configs = [
        base(_env),
        umd(_env),
        cleanup(_env),
        analytics(_env),
        jquery(_env),
        debug(_env),
        release(_env),
        web(_env),
    ];
    const _config = merge.strategy({})(configs);
    return _config;
};
