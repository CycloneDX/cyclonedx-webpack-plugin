/*
 * This file is part of CycloneDX Webpack plugin.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 * Copyright (c) OWASP Foundation. All Rights Reserved.
 */

const path = require('path')
const { CompatSource } = require('webpack').sources || {} /* available in webpack>=5 */

const { generateBom } = require('../bom')

/** @typedef {import('webpack').Compiler} Compiler */

/** @typedef {import('webpack').Compilation} Compilation */

/**
 * @param {Compilation} compilation
 * @param {string} filePath
 * @param {function:string} sourceCallBack
 */
const webpackAddAsset = CompatSource
  ? /* webpack >= 5.0.0 */ function (compilation, filePath, sourceCallBack) {
    compilation.emitAsset(filePath, CompatSource.from({ source: sourceCallBack }))
  }
  : /* webpack < 5 */ function (compilation, filePath, sourceCallBack) {
    compilation.assets[filePath] = { source: sourceCallBack, size: () => undefined }
  }

/**
 * Webpack plugin for generating CycloneDX Software Bill of Materials (SBOM).
 * This will generate an SBOM of all dependencies used by webpack to link a
 * package's code with the needed dependencies. It's not unusual for the
 * SBOM to be a subset of the dependencies defined in `package.json`.
 */
class CycloneDxWebpackPlugin {
  /**
   * CycloneDX Webpack Plugin
   *
   * @param {{ context: string,
   *           outputLocation: string,
   *           emitStats: boolean,
   *            moduleName: string,
   *           moduleVersion: string
   *        }} param0 options for plugin execution
   */
  constructor ({
    // Default options
    context,
    moduleName,
    moduleVersion,
    outputLocation = './cyclonedx',
    includeWellknown = true,
    wellknownLocation = './.well-known',
    componentType = 'application',
    emitStats = false
  } = {}) {
    this.context = context
    this.moduleName = moduleName
    this.moduleVersion = moduleVersion
    this.outputLocation = outputLocation
    this.includeWellknown = includeWellknown
    this.wellknownLocation = wellknownLocation
    this.componentType = componentType
    this.emitStats = emitStats
  }

  /**
   * @param {Compiler} compiler
   */
  apply (compiler) {
    if (typeof compiler.hooks !== 'object') {
      throw new Error(`Webpack 4+ required to use ${this.constructor.name}`)
    }

    /** see https://webpack.js.org/api/compiler-hooks/#thiscompilation */
    compiler.hooks.emit.tapAsync(
      'cyclonedx-webpack-plugin',
      /**
       * @param {Compilation} compilation
       * @param {function} callback
       */
      async (compilation, callback) => {
        try {
          await this.#emitBom(compilation)
        } catch (err) {
          // Catch all errors and log it. This plugin shouldn't block the build process.
          /* eslint-disable-next-line no-console */
          console.error(err)
        }
        callback()
      }
    )
  }

  /**
   * Setup SBOM generation and emit the file.
   *
   * @param {Compilation} compilation
   */
  #emitBom = async function (compilation) {
    const output = await generateBom({
      // Needed for inspecting the webpack code linkages
      modules: compilation.modules,
      // Context from webpack config or defaults to process.cwd()
      context: this.context || compilation.options.context,
      moduleName: this.moduleName,
      moduleVersion: this.moduleVersion,
      componentType: this.componentType
    })

    webpackAddAsset(
      compilation,
      path.join(this.outputLocation, './bom.json'),
      () => output.toJSON()
    )
    webpackAddAsset(
      compilation,
      path.join(this.outputLocation, './bom.xml'),
      () => output.toXML()
    )
    if (this.includeWellknown) {
      webpackAddAsset(
        compilation,
        path.join(this.wellknownLocation, './sbom'),
        () => output.toJSON()
      )
    }
    if (this.emitStats) {
      webpackAddAsset(
        compilation,
        path.join(this.outputLocation, './stats.json'),
        () => JSON.stringify(
          compilation.getStats().toJson({ chunkModules: true }),
          null,
          2
        )
      )
    }
  }
}

module.exports = { CycloneDxWebpackPlugin }
