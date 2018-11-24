const path = require('path');

const config = Object.freeze({
    dir: '/dist',
    web: '/dist',
    release: false,
    analytics: false,
    test: false,
    karma: false,
    clean: true,
    umd: false,
    globals: {
        jquery: 'external',
    },
    babel: {
        presets: ['@babel/env'],
    },
});

module.exports = (env) => {
    if (typeof env === 'string') {
        const _prop = env;
        env = {};
        env[_prop] = true;
    }
    if (!env) {
        env = {};
    }
    if (!env.dir) {
        env.dir = config.dir;
    }
    if (!env.web) {
        env.web = config.web;
    }
    if (env.release == null) {
        env.release = config.release;
    }
    if (env.analytics == null) {
        env.analytics = config.analytics;
    }
    if (env.test == null) {
        env.test = config.test;
    }
    if (env.karma == null) {
        env.karma = config.karma;
    }
    if (env.clean == null) {
        env.clean = config.clean;
    }
    if (env.umd == null) {
        env.umd = config.umd;
    }
    if (!env.globals) {
        env.globals = {};
    }
    if (env.globals.jquery == null) {
        env.globals.jquery = config.globals.jquery;
    }
    env.babel = config.babel;

    env.rootPath = path.join(__dirname, '../');
    env.dir = path.join(env.rootPath, env.dir);

    return env;
};
