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

const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const { describe, expect, it } = require('@jest/globals')

const { version: thisVersion } = require('../../package.json')

describe('integration', () => {
  describe.each(
    [
      {
        dir: 'webpack5-vue2',
        purpose: 'webpack5 with vue2',
        results: [ // paths relative to `dir`
          {
            format: 'xml',
            file: 'dist/.bom/bom.xml'
          },
          {
            format: 'json',
            file: 'dist/.bom/bom.json'
          },
          {
            format: 'json',
            file: 'dist/.well-known/sbom'
          }
        ]
      },
      {
        dir: 'webpack5-angular13',
        purpose: 'webpack5 with angular13',
        results: [ // paths relative to `dir`
          {
            format: 'xml',
            file: 'dist/.bom/bom.xml'
          },
          {
            format: 'json',
            file: 'dist/.bom/bom.json'
          },
          {
            format: 'json',
            file: 'dist/.well-known/sbom'
          }
        ]
      },
      {
        dir: 'webpack5-react18',
        purpose: 'webpack5 with react18',
        results: [ // paths relative to `dir`
          {
            format: 'xml',
            file: 'dist/.bom/bom.xml'
          },
          {
            format: 'json',
            file: 'dist/.bom/bom.json'
          },
          {
            format: 'json',
            file: 'dist/.well-known/sbom'
          }
        ]
      }
    ]
  )('$purpose', ({ dir, results }) => {
    const built = spawnSync(
      'npm', ['run', 'build'], {
        cwd: path.resolve(__dirname, dir),
        stdio: ['ignore', 'pipe', 'pipe'],
        encoding: 'utf8',
        shell: true,
        env: {
          PATH: process.env.PATH,
          CI: '1'
        }
      }
    )
    let skipTests = false
    try {
      expect(built.status).toBe(0)
    } catch (err) {
      if (/does not support Node.js v/.test(built.stderr.toString())) {
        skipTests = true
      } else {
        console.log(built, '\n')
        throw err
      }
    }

    (skipTests
      ? it.skip
      : it
    ).each(results)('generated $format file: $file', ({ format, file }) => {
      const resultFile = path.resolve(__dirname, dir, file)
      const resultBuffer = fs.readFileSync(resultFile)
      expect(resultBuffer).toBeInstanceOf(Buffer)
      expect(resultBuffer.length).toBeGreaterThan(0)
      const resultReproducible = makeReproducible(format, resultBuffer.toString())
      expect(resultReproducible).toMatchSnapshot()
    })
  })
})

/**
 * @param {string} format
 * @param {*} data
 * @returns {string}
 */
function makeReproducible (format, data) {
  switch (format.toLowerCase()) {
    case 'xml':
      return makeXmlReproducible(data)
    case 'json':
      return makeJsonReproducible(data)
    default:
      throw new RangeError(`unexpected format: ${format}`)
  }
}

/**
 * @param {string} json
 * @returns {string}
 */
function makeJsonReproducible (json) {
  return json
    .replace(
      // replace metadata.tools.version
      '        "vendor": "@cyclonedx",\n' +
      '        "name": "webpack-plugin",\n' +
      `        "version": ${JSON.stringify(thisVersion)},\n`,
      '        "vendor": "@cyclonedx",\n' +
      '        "name": "webpack-plugin",\n' +
      '        "version": "thisVersion-testing",\n'
    ).replace(
      // replace metadata.tools.version
      new RegExp(
        '        "vendor": "@cyclonedx",\n' +
        '        "name": "cyclonedx-library",\n' +
        '        "version": ".+?",\n'
      ),
      '        "vendor": "@cyclonedx",\n' +
      '        "name": "cyclonedx-library",\n' +
      '        "version": "libVersion-testing",\n'
    )
}

/**
 * @param {string} xml
 * @returns {string}
 *
 * eslint-disable-next-line no-unused-vars
 */
function makeXmlReproducible (xml) {
  return xml
    .replace(
      '      <vendor>@cyclonedx</vendor>' +
      '      <name>webpack-plugin</name>' +
      `      <version>${thisVersion}</version>`,
      '      <vendor>@cyclonedx</vendor>' +
      '      <name>webpack-plugin</name>' +
      '      <version>thisVersion-testing</version>'
    ).replace(new RegExp(
      '      <vendor>@cyclonedx</vendor>' +
        '      <name>cyclonedx-library</name>' +
        '      <version>.+?</version>'),
    '      <vendor>@cyclonedx</vendor>' +
      '      <name>cyclonedx-library</name>' +
      '      <version>libVersion-testing</version>'
    )
}
