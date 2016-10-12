module.exports = {
    entry: './src/main.ts',
    output: {
        filename: './out/bundle.js'
    },
    resolve: {
        extensions: ['', '.webpack.js', '.web.js', '.ts', '.js','.tsx']
    },
    module: {
        loaders: [
            {test: /\.ts$/, loader: 'webpack-typescript?target=ES5'}
        ]
    }
}