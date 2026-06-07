const path = require('path');

module.exports = {
    entry: './src/index.ts',
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname, 'dist'),
    },
    resolve: {
        extensions: ['.ts', '.js'],
        // Optional peer deps used only in Node/Electron contexts — not needed in browser.
        fallback: {
            canvas: false,
            sharp: false,
        },
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: {
                    loader: 'ts-loader',
                    options: { transpileOnly: true },
                },
                exclude: /node_modules/,
            },
            {
                test: /\.data\.png$/,
                type: 'asset/inline',
            },
        ],
    },
    // Suppress "can't resolve canvas/sharp/electron" warnings — they're optional Node deps.
    ignoreWarnings: [/Can't resolve 'canvas'/, /Can't resolve 'sharp'/, /Can't resolve 'electron/],
};
