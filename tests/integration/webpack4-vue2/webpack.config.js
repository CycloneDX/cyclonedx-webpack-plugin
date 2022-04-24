const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const HtmlInlineScriptPlugin = require('html-inline-script-webpack-plugin')

const { CycloneDxWebpackPlugin } = require('@cyclonedx/webpack-plugin')

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
    }),
    new HtmlInlineScriptPlugin(),
    new CycloneDxWebpackPlugin({
      context: '../',
      outputLocation: '.bom'
    })
  ],
  externals: {
    //     vue: 'Vue'
  },
  resolve: {
    alias: {
      'vue$': 'vue/dist/vue.esm.js'
    }
  }
}