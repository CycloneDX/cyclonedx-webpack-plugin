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

import { existsSync, readdirSync, readFileSync } from 'fs'
import { dirname, extname, isAbsolute, join, sep } from 'path'

export function isNonNullable<T> (value: T): value is NonNullable<T> {
  // NonNullable: not null and not undefined
  return value !== null && value !== undefined
}

export const structuredClonePolyfill: <T>(value: T) => T = typeof structuredClone === 'function'
  ? structuredClone
  : function (value) { return JSON.parse(JSON.stringify(value)) }

export interface PackageDescription {
  path: string
  packageJson: any
}

const PACKAGE_MANIFEST_FILENAME = 'package.json'

export function getPackageDescription (path: string): PackageDescription | undefined {
  const isSubDirOfNodeModules = isSubDirectoryOfNodeModulesFolder(path)

  while (isAbsolute(path)) {
    const pathToPackageJson = join(path, PACKAGE_MANIFEST_FILENAME)
    if (existsSync(pathToPackageJson)) {
      try {
        const contentOfPackageJson = loadJsonFile(pathToPackageJson) ?? {}
        // only look for valid candidate if we are in a node_modules subdirectory
        if (!isSubDirOfNodeModules || isValidPackageJSON(contentOfPackageJson)) {
          return {
            path: pathToPackageJson,
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
    path = nextPath
  }
  return undefined
}

const NODE_MODULES_FOLDERNAME = 'node_modules'

function isNodeModulesFolder (path: string): boolean {
  return path.endsWith(`${sep}${NODE_MODULES_FOLDERNAME}`)
}

function isSubDirectoryOfNodeModulesFolder (path: string): boolean {
  return path.includes(`${sep}${NODE_MODULES_FOLDERNAME}${sep}`)
}

export function isValidPackageJSON (pkg: any): boolean {
  // checking for the existence of name and version properties
  // both are required for a valid package.json according to https://docs.npmjs.com/cli/v10/configuring-npm/package-json
  return typeof pkg.name === 'string' && typeof pkg.version === 'string'
}

export function loadJsonFile (path: string): any {
  return JSON.parse(readFileSync(path, 'utf8'))
  // may be replaced by `require(f, { with: { type: "json" } })`
  // as soon as this spec is properly implemented.
  // see https://github.com/tc39/proposal-import-attributes
}

const LICENSE_FILENAME_PATTERN = /^(?:UN)?LICEN[CS]E|NOTICE/i
/**
 * Searches typical files in the package path which have typical a license notice text inside
 *
 * @param {string} searchFolder folder to look for common filenames
 *
 * @yields {{ filepath: string, contentType: string}} Next matching file containing path and MIME type
 */
export function * searchEvidenceSources (searchFolder: string): Generator<{
  filepath: string
  contentType: string
}> {
  for (const dirent of readdirSync(searchFolder, { withFileTypes: true })) {
    if (
      !dirent.isFile() ||
      !LICENSE_FILENAME_PATTERN.test(dirent.name)
    ) {
      continue
    }

    const contentType = determineContentType(dirent.name)
    if (contentType === undefined) {
      continue
    }

    yield {
      filepath: `${dirent.parentPath}/${dirent.name}`,
      contentType
    }
  }
}

// common file endings that are used for notice/license files
const CONTENT_TYPE_MAP: Record<string, string> = {
  '': 'text/plain',
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.xml': 'text/xml'
} as const

/**
 * Returns the MIME type for the file or undefined if nothing was matched
 * @param {string} filename filename or complete filepath
 */
export function determineContentType (filename: string): string | undefined {
  return CONTENT_TYPE_MAP[extname(filename)]
}
