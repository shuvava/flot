const nodeExternals = require('webpack-node-externals');
const path = require('path');

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
        module: {
            rules: [
                {
                    test: path.resolve(env.rootPath, '/bak/jquery.js'),
                    use: [
                        {
                            loader: 'expose-loader',
                            options: '$',
                        },
                        {
                            loader: 'expose-loader',
                            options: 'jQuery',
                        },
                    ],
                },
            ],
        },
    };
    return config;
};
