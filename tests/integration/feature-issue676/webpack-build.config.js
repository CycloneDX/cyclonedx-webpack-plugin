const { CycloneDxWebpackPlugin } = require('@cyclonedx/webpack-plugin')

/** @type {import('@cyclonedx/webpack-plugin').CycloneDxWebpackPluginOptions} */
const cycloneDxWebpackPluginOptions = new CycloneDxWebpackPlugin({
  specVersion: '1.4',
  outputLocation: '.bom',
  collectEvidence: true,
  reproducibleResults: true
})

module.exports = {
  // Webpack noise constrained to ALL details - for debugging purposes
  // stats: 'detailed',
  plugins: [ cycloneDxWebpackPluginOptions ]
}
