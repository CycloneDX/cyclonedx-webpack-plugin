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

import { existsSync, readFileSync } from 'node:fs'
import { dirname, isAbsolute, join, sep } from 'node:path'

import type * as CDX from '@cyclonedx/cyclonedx-library'
import normalizePackageData from 'normalize-package-data'


export function isNonNullable<T>(value: T): value is NonNullable<T> {
  // NonNullable: not null and not undefined
  return value !== null && value !== undefined
}

export const structuredClonePolyfill: <T>(value: T) => T = typeof structuredClone === 'function'
  ? structuredClone
  : function <T>(value: T): T {
    /* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ack */
    return JSON.parse(JSON.stringify(value)) as T
  }

export interface ValidPackageJSON {
  name: string
  version: string
}

export interface PackageDescription {
  path: string
  packageJson: NonNullable<any>
}

export interface RootComponentCreationResult {
  rootComponent: CDX.Models.Component
  detectedRootComponent: CDX.Models.Component | undefined
}

const PACKAGE_MANIFEST_FILENAME = 'package.json'

export function getPackageDescription(path: string): PackageDescription | undefined {
  const isSubDirOfNodeModules = isSubDirectoryOfNodeModulesFolder(path)

  while (isAbsolute(path)) {
    const pathToPackageJson = join(path, PACKAGE_MANIFEST_FILENAME)
    if (existsSync(pathToPackageJson)) {
      try {
        /* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- expected */
        const contentOfPackageJson: NonNullable<any> = loadJsonFile(pathToPackageJson) ?? {}
        // only look for valid candidate if we are in a node_modules subdirectory
        if (!isSubDirOfNodeModules || isValidPackageJSON(contentOfPackageJson)) {
            return {
              path: pathToPackageJson,
              /* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- expected */
              packageJson: contentOfPackageJson
          }
        }
      } catch {
        return undefined
      }
    }

    const nextPath = dirname(path)
    if (nextPath === path || isNodeModulesFolder(nextPath)) {
      return undefined
    }
    path = nextPath /* eslint-disable-line  no-param-reassign -- ack */
  }
  return undefined
}

const NODE_MODULES_FOLDERNAME = 'node_modules'

function isNodeModulesFolder(path: string): boolean {
  return path.endsWith(`${sep}${NODE_MODULES_FOLDERNAME}`)
}

function isSubDirectoryOfNodeModulesFolder(path: string): boolean {
  return path.includes(`${sep}${NODE_MODULES_FOLDERNAME}${sep}`)
}

export function isValidPackageJSON(pkg: any): pkg is ValidPackageJSON {
  // checking for the existence of name and version properties
  // both are required for a valid package.json according to https://docs.npmjs.com/cli/v10/configuring-npm/package-json
  return isNonNullable(pkg)
    /* eslint-disable @typescript-eslint/no-unsafe-member-access -- false-positive */
    && typeof pkg.name === 'string'
    && typeof pkg.version === 'string'
    /* eslint-enable @typescript-eslint/no-unsafe-member-access */
}

export function loadJsonFile(path: string): any {
  return JSON.parse(readFileSync(path, 'utf8'))
  // may be replaced by `require(f, { with: { type: "json" } })`
  // as soon as this spec is properly implemented.
  // see https://github.com/tc39/proposal-import-attributes
}

// region polyfills

/** Polyfill for Iterator.some() */
export function iterableSome<T>(i: Iterable<T>, t: (v: T) => boolean): boolean {
  for (const v of i) {
    if (t(v)) {
      return true
    }
  }
  return false
}

// endregion polyfills


export function isString (v: any): v is string {
  return typeof v === 'string'
}

export function normalizePackageManifest (data: any, warn?: normalizePackageData.WarnFn): asserts data is normalizePackageData.Package {
  /* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access -- ack*/
  const oVersion = data.version

  /* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ack */
  normalizePackageData(data as normalizePackageData.Input, warn)

  if (isString(oVersion)) {
    // normalizer might have stripped version or sanitized it to SemVer -- we want the original
    /* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, no-param-reassign -- ack */
    data.version = oVersion.trim()
  }
}

export function doComponentsMatch(first: CDX.Models.Component, second: CDX.Models.Component): boolean {
  return first.group === second.group &&
    first.name === second.name &&
    first.version === second.version
}
