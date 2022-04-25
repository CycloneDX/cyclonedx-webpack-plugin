const { CycloneDxWebpackPlugin } = require('@cyclonedx/webpack-plugin')

module.exports = {
  plugins: [
    new CycloneDxWebpackPlugin({
      context: '../',
      outputLocation: '.bom'
    })
  ],
  experiments: {
    // suppress webpack5 deprication warnings
    // see https://github.com/CycloneDX/cyclonedx-webpack-plugin/issues/33
    backCompat: true
  }
}
