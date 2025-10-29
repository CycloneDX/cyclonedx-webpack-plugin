const { CycloneDxWebpackPlugin } = require('@cyclonedx/webpack-plugin')

/** @type {import('@cyclonedx/webpack-plugin').CycloneDxWebpackPluginOptions} */
const cycloneDxWebpackPluginOptions = new CycloneDxWebpackPlugin({
  specVersion: '1.7', // feature is emitted in CDX >= 1.3
  outputLocation: '.bom',
  reproducibleResults: true,
  validateResults: true,
  collectEvidence: true // <<< this enables the feature
})

module.exports = {
  // Webpack noise constrained to ALL details - for debugging purposes
  // stats: 'detailed',
  plugins: [ cycloneDxWebpackPluginOptions ]
}
