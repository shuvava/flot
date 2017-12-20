module.exports = (env) => {
    if (!env.umd) {
        return {};
    }
    const config = {
        output: {
            libraryTarget: 'umd',
        },
    };
    return config;
};
