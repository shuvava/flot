const webPackConfFn = require('./webpack.config');
// const karmaWebpack = require('karma-webpack');
// const karmaMocha = require('karma-mocha');
// const karmaChromeLauncher = require('karma-chrome-launcher');

module.exports = (config) => {
    const webPackConf = webPackConfFn({
        test: true,
    });
    config.set({
        basePath: '',
        files: [
            './test/**/*.js',
        ],
        // frameworks to use
        frameworks: ['mocha'],
        preprocessors: {
            './test/**/*.js': ['webpack'],
        },
        reporters: ['progress', 'spec'],
        // reporters: ['spec', 'coverage'],
        // coverageReporter: {
        //     dir: 'build/coverage/',
        //     reporters: [
        //         { type: 'html' },
        //         { type: 'text' },
        //         { type: 'text-summary' },
        //     ],
        // },
        // client: {
        //     mocha: {
        //         reporter: 'html',
        //     },
        // },
        webpack: webPackConf,
        webpackMiddleware: {
            // webpack-dev-middleware configuration
            noInfo: true,
        },
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: true,
        browsers: ['ChromeWithoutSecurity'],
        customLaunchers: {
            ChromeWithoutSecurity: {
                base: 'Chrome',
                flags: ['--disable-web-security'],
            },
        },
        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: false,
        concurrency: Infinity,
        // plugins: [
        //     karmaWebpack,
        //     karmaMocha,
        //     karmaChromeLauncher,
        // ],
    });
};
