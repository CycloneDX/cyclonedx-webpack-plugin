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

const path = require('node:path')

const { CycloneDxWebpackPlugin } = require('@cyclonedx/webpack-plugin')

/* eslint-disable jsdoc/valid-types */

/** @type {import('@cyclonedx/webpack-plugin').CycloneDxWebpackPluginOptions} */
const cycloneDxWebpackPluginOptions = {
  specVersion: '1.7',
  reproducibleResults: false,
  outputLocation: './sbom',
  includeWellknown: true,
  wellknownLocation: './.well-known',
  rootComponentAutodetect: true,
  rootComponentType: 'application',
  rootComponentName: undefined,
  rootComponentVersion: undefined,
  rootComponentBuildSystem: undefined,
  rootComponentVCS: undefined,
  collectEvidence: true
}

/**
 * @see {@link https://webpack.js.org/configuration/}
 */
module.exports = {
  target: 'web',
  mode: 'production',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'app.js'
  },
  plugins: [
    new CycloneDxWebpackPlugin(cycloneDxWebpackPluginOptions)
  ],
  stats: 'detailed'
}
