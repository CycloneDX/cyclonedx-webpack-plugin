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

const { spawnSync } = require('child_process')
const path = require('path');

(function () {
  const REQUIRES_NPM_INSTALL = [
    // region functional tests
    'webpack5-angular13',
    'webpack5-angular17',
    'webpack5-react18',
    'webpack5-vue2',
    // endregion functional tests
    // region regression tests
    'regression-issue745'
    // endregion regression tests
  ]

  const SetupMapMethodCmdArgs = {
    npm: ['npm', ['ci']],
    yarn: ['yarn', ['install', '--immutable']],
    pnpm: ['pnpm', ['install', '--frozen-lockfile']]
  }

  console.warn(`
  WILL SETUP INTEGRATION TEST BEDS
  THAT MIGHT CONTAIN OUTDATED VULNERABLE PACKAGES
  FOR SHOWCASING AND TESTING PURPOSES ONLY.
  `)

  process.exitCode = 0

  const setupMethod = (process.argv[2] || 'npm').toLowerCase()
  const setupMethodCmdArgs = SetupMapMethodCmdArgs[setupMethod]
  if (undefined === setupMethodCmdArgs) {
    throw new RangeError(`
    Unsupported setupMethod: ${setupMethod}
    Supported values: ${Object.keys(SetupMapMethodCmdArgs).join(' ')}
    `)
  }

  for (const DIR of REQUIRES_NPM_INSTALL) {
    console.log(`>>> setup with ${setupMethod}:`, DIR)
    const done = spawnSync(
      ...setupMethodCmdArgs, {
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
})()
