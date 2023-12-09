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

import { existsSync, readFileSync } from 'fs'
import { dirname, isAbsolute, join } from 'path'

export interface PackageDescription {
  path: string
  packageJson: any
}

export function getPackageDescription (path: string): PackageDescription | undefined {
  while (isAbsolute(path)) {
    const packageJson = join(path, 'package.json')
    if (existsSync(packageJson)) {
      try {
        return {
          path: packageJson,
          packageJson: loadJsonFile(packageJson) ?? {}
        }
      } catch {
        return undefined
      }
    }

    const nextPath = dirname(path)
    if (nextPath === path) {
      return undefined
    }
    path = nextPath
  }
  return undefined
}

export function loadJsonFile (path: string): any {
  return JSON.parse(readFileSync(path, 'utf8'))
  // may be replaced by `require(f, { with: { type: "json" } })`
  // as soon as this spec is properly implemented.
  // see https://github.com/tc39/proposal-import-attributes
}
