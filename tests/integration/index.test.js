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

const nodeSV = Object.freeze((process?.versions?.node ?? '').split('.').map(Number))

const testSetups = [
  // region functional
  {
    dir: 'webpack5-vue2',
    purpose: 'functional: webpack5 with vue2',
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
    skip: !(nodeSV[0] > 16),
    dir: 'webpack5-vue2-yarn',
    purpose: 'functional: webpack5 with vue2 in yarn setup',
    packageManager: 'yarn',
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
    purpose: 'functional: webpack5 with angular13',
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
    dir: 'webpack5-angular17',
    purpose: 'functional: webpack5 with angular17',
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
    purpose: 'functional: webpack5 with react18',
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
  // endregion functional
  // region regression
  {
    dir: 'regression-issue745',
    purpose: 'regression: issue#745',
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
  // endregion regression
]

// for testing purposes, some outdated jest version must be used.
// this version has a different format for snapshots ...
let compareSnapshots
try {
  compareSnapshots = Number(require('jest/package.json').version.split('.')[0]) >= 29
} catch {
  compareSnapshots = null
}

describe('integration', () => {
  testSetups.forEach(({ skip: skipTests, purpose, dir, packageManager, results }) => {
    skipTests = !!skipTests
    describe(purpose, () => {
      if (!skipTests) {
        const built = spawnSync(
          packageManager ?? 'npm', ['run', 'build'], {
            cwd: path.resolve(module.path, dir),
            stdio: ['ignore', 'pipe', 'pipe'],
            encoding: 'utf8',
            shell: true,
            env: {
              PATH: process.env.PATH,
              CI: '1'
            }
          }
        )
        try {
          expect(built.status).toBe(0)
        } catch (err) {
          if (/should not be used for production|Angular CLI requires a minimum|does not support Node\.js v/.test(built.stderr.toString())) {
            skipTests = true
          } else {
            console.log('purpose: ', purpose, '\n')
            console.log('built', built, '\n')
            throw err
          }
        }
      }

      results.forEach(({ format, file }) => {
        (skipTests
          ? it.skip
          : it
        )(`generated ${format} file: ${file}`, () => {
          const resultFile = path.resolve(module.path, dir, file)
          const resultBuffer = fs.readFileSync(resultFile)
          expect(resultBuffer).toBeInstanceOf(Buffer)
          expect(resultBuffer.length).toBeGreaterThan(0)
          const resultReproducible = makeReproducible(format, resultBuffer.toString())
          if (compareSnapshots) {
            expect(resultReproducible).toMatchSnapshot()
          }
        })
      })
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
      // replace metadata.tools.version
      '        <vendor>@cyclonedx</vendor>\n' +
      '        <name>webpack-plugin</name>\n' +
      `        <version>${thisVersion}</version>`,
      '        <vendor>@cyclonedx</vendor>\n' +
      '        <name>webpack-plugin</name>\n' +
      '        <version>thisVersion-testing</version>'
    ).replace(
      // replace metadata.tools.version
      new RegExp(
        '        <vendor>@cyclonedx</vendor>\n' +
        '        <name>cyclonedx-library</name>\n' +
        '        <version>.+?</version>'
      ),
      '        <vendor>@cyclonedx</vendor>\n' +
      '        <name>cyclonedx-library</name>\n' +
      '        <version>libVersion-testing</version>'
    )
}
