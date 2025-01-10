const path = require('path')

const { CycloneDxWebpackPlugin } = require('@cyclonedx/webpack-plugin')

module.exports = {
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
        specVersion: '1.6',
        reproducibleResults: true,
        validateResults: true,
        rootComponentAutodetect: false,
        rootComponentName: 'overridden-cycloneDx-webpack-plugin',
        rootComponentVersion: '1.0.0',
        rootComponentBuildSystem: 'https://github.com/CycloneDX/cyclonedx-webpack-plugin/actions',
        rootComponentVCS: 'https://github.com/CycloneDX/cyclonedx-webpack-plugin'
      }
    )
  ]
}
