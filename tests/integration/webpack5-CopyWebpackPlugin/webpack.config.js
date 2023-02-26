/*!
This file is part of CycloneDX Webpack plugin.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

SPDX-License-Identifier: Apache-2.0
Copyright (c) OWASP Foundation. All Rights Reserved.
*/

const path = require('path')

const CopyPlugin = require("copy-webpack-plugin");
const { CycloneDxWebpackPlugin } = require('@cyclonedx/webpack-plugin')

module.exports = {
  entry: './src/js/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "./src/css/index.css", to: "css/index.css" },
        { from: "./node_modules/bootstrap/dist/js/bootstrap.bundle.min.js", to: "bootstrap/bs.js" },
        { from: "./node_modules/bootstrap/dist/css/bootstrap.min.css", to: "bootstrap/bs.css" },
      ],
    }),
    new CycloneDxWebpackPlugin(
      {
        outputLocation: '.bom',
        reproducibleResults: true
      }
    )
  ]
}
