const { CycloneDxWebpackPlugin } = require('@cyclonedx/webpack-plugin')

module.exports = {
  // Webpack noise constrained to ALL details - for debugging purposes
  stats: 'detailed',
  plugins: [
    new CycloneDxWebpackPlugin({
      specVersion: '1.5',
      outputLocation: '.bom',
      reproducibleResults: true,
      validateResults: true
    })
  ]
}
