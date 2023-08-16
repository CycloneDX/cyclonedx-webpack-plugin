const { CycloneDxWebpackPlugin } = require('@cyclonedx/webpack-plugin')

module.exports = {
  plugins: [
    new CycloneDxWebpackPlugin({
      specVersion: '1.5',
      outputLocation: '.bom',
      reproducibleResults: true,
      validateResults: true
    })
  ]
}
