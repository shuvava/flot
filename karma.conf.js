const path = require('path');
const webPackConfFn = require('./webpack.config-karma');

module.exports = (config) => {
    const webPackConf = webPackConfFn({
        // test: true,
        // globals: {
        //     jquery: true,
        // },
    });
    config.set({
        basePath: path.resolve(__dirname, './'),
        files: [
            './bak/jquery.js',
            { pattern: './src/**/*.js', included: false },
            { pattern: './test/**/*.spec.js', included: true },
            // './test/test.jquery.js',
        ],
        // frameworks to use
        frameworks: ['mocha', 'chai'],
        preprocessors: {
            './test/**/*.spec.js': ['webpack', 'sourcemap'],
        },
        // reporters: ['progress', 'spec', 'coverage-istanbul'],
        reporters: ['spec', 'coverage', 'dots'],
        coverageReporter: {
            dir: './coverage/',
            reporters: [
                { type: 'html' },
                { type: 'text' },
                { type: 'text-summary' },
            ],
        },
        // coverageIstanbulReporter: {
        //     reports: ['text-summary', 'html', 'cobertura'],
        //     'report-config': {
        //         html: { subdir: 'html-report' },
        //     },
        //     fixWebpackSourcePaths: true,
        // },
        client: {
            captureConsole: true,
            mocha: {
                bail: true,
                ui: 'bdd',
            },
        },
        webpack: webPackConf,
        webpackMiddleware: {
            // webpack-dev-middleware configuration
            noInfo: true,
        },
        logLevel: config.LOG_INFO,
        colors: true,
        action: 'run',
        autoWatch: true,
        plugins: [
            /* eslint-disable global-require */
            require('karma-webpack'),
            require('istanbul-instrumenter-loader'),
            require('karma-sourcemap-loader'),
            require('karma-coverage-istanbul-reporter'),
            require('karma-mocha'),
            require('karma-coverage'),
            require('karma-chrome-launcher'),
            require('karma-spec-reporter'),
            require('karma-chai-plugins'),
            /* eslint-enable global-require */
        ],
        browsers: ['Chrome'],
        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: false,
        captureTimeout: 60000,
        concurrency: Infinity,
    });
};
