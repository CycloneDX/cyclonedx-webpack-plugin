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

const { spawnSync } = require('child_process')
const path = require('path')
const fs = require('fs')

const REQUIRES_NPM_INSTALL = [
  'webpack4-vue2',
  'webpack5-vue2',
  'webpack5-angular13',
  'webpack5-react18'
]

const ROOT_DIR = path.resolve(__dirname, '../..')

console.log('>>> build...')
const built = spawnSync(
  'npm', ['run', '--if-present', 'build'], {
    cwd: ROOT_DIR,
    stdio: 'inherit',
    shell: true
  }
)
if (built.status !== 0) {
  console.error(built)
  throw new Error('build failed')
}

console.log('>>> pack...')
const SUT_DIR = path.resolve(__dirname, '_SUT/')
const packed = spawnSync(
  'npm', ['pack', '--json', '--pack-destination', SUT_DIR], {
    cwd: ROOT_DIR,
    stdio: ['inherit', 'pipe', 'inherit'],
    shell: true
  }
)
if (packed.status !== 0) {
  console.error(built)
  throw new Error('pack failed')
}

console.log('>>> move packed...')
fs.renameSync(
  path.join(SUT_DIR, `cyclonedx-webpack-plugin-${JSON.parse(packed.stdout)[0].version}.tgz`),
  path.join(SUT_DIR, 'cyclonedx-webpack-plugin.indev.tgz')
)

console.warn(`
WILL SETUP INTEGRATION TEST BEDS 
THAT MIGHT CONTAIN OUTDATED VULNERABLE PACKAGES 
FOR SHOWCASING AND TESTING PURPOSES ONLY.
`)

process.exitCode = 0
let done

for (const DIR of REQUIRES_NPM_INSTALL) {
  console.log('>>> setup with NPM:', DIR)
  done = spawnSync(
    'npm', ['ci'], {
      cwd: path.resolve(__dirname, DIR),
      stdio: 'inherit',
      shell: true
    }
  )
  if (done.status !== 0) {
    ++process.exitCode
    console.error(done)
  }
}
