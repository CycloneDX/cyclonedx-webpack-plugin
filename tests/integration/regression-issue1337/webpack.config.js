const path = require('path')

const { CycloneDxWebpackPlugin } = require('@cyclonedx/webpack-plugin')

module.exports = {
  resolve: {
    fallback: {
      "buffer": require.resolve("buffer/"),
      "stream": require.resolve("stream-browserify")
    }
  },
  entry: './src/index.js',
  // Webpack noise constrained to ALL details - for debugging purposes
  stats: 'detailed',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  plugins: [
    new CycloneDxWebpackPlugin(
      {
        outputLocation: '.bom',
        reproducibleResults: true,
        validateResults: true,
        collectEvidence: true
      }
    )
  ]
}
