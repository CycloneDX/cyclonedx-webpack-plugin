const { CycloneDxWebpackPlugin } = require('@cyclonedx/webpack-plugin');

module.exports = {
  productionSourceMap: false,
  runtimeCompiler: true,
  publicPath: '.',
  devServer: {},
  configureWebpack: {
    plugins: [
      new CycloneDxWebpackPlugin({
        specVersion: '1.6',
        outputLocation: '.bom',
        reproducibleResults: true,
        validateResults: true,
        collectEvidence: true
      }),
    ],
  },
};
