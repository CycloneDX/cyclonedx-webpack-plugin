const { CycloneDxWebpackPlugin } = require('@cyclonedx/webpack-plugin')

module.exports = {
  plugins: [
    new CycloneDxWebpackPlugin({
      outputLocation: '.bom',
      reproducibleResults: true,
      validateResults: true
    })
  ]
}
