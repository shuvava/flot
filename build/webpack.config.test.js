const nodeExternals = require('webpack-node-externals');


module.exports = (env) => {
    if (!env.test) {
        return {};
    }
    if (env.babel == null) {
        env.babel = {};
    }
    if (env.babel.plugins == null) {
        env.babel.plugins = [];
    }
    env.babel.plugins.push('add-module-exports');
    const config = {
        target: 'node', // webpack should compile node compatible code
        externals: [nodeExternals()], // in order to ignore all modules in node_modules folder
    };
    return config;
};
