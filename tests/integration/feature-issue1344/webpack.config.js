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
        specVersion: '1.7',
        reproducibleResults: true,
        validateResults: true,
        rootComponentBuildSystem: 'https://github.com/CycloneDX/cyclonedx-webpack-plugin/actions',
        // This will not be used as autodetect is set to true by default
        rootComponentVCS: 'https://example.com/will-overide-value-in-package.json'
      }
    )
  ]
}
