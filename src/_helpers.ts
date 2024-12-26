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

import { execSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { dirname, extname, isAbsolute, join, parse, sep } from 'path'

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

// region MIME

export type MimeType = string

const MIME_TEXT_PLAIN: MimeType = 'text/plain'

const MAP_TEXT_EXTENSION_MIME: Readonly<Record<string, MimeType>> = {
  '': MIME_TEXT_PLAIN,
  // https://www.iana.org/assignments/media-types/media-types.xhtml
  '.csv': 'text/csv',
  '.htm': 'text/html',
  '.html': 'text/html',
  '.md': 'text/markdown',
  '.txt': MIME_TEXT_PLAIN,
  '.rst': 'text/prs.fallenstein.rst',
  '.xml': 'text/xml', // not `application/xml` -- our scope is text!
  // add more mime types above this line. pull-requests welcome!
  // license-specific files
  '.license': MIME_TEXT_PLAIN,
  '.licence': MIME_TEXT_PLAIN
} as const

export function getMimeForTextFile (filename: string): MimeType | undefined {
  return MAP_TEXT_EXTENSION_MIME[extname(filename).toLowerCase()]
}

const LICENSE_FILENAME_BASE = new Set(['licence', 'license'])
const LICENSE_FILENAME_EXT = new Set([
  '.apache',
  '.bsd',
  '.gpl',
  '.mit'
])

export function getMimeForLicenseFile (filename: string): MimeType | undefined {
  const { name, ext } = parse(filename.toLowerCase())
  return LICENSE_FILENAME_BASE.has(name) && LICENSE_FILENAME_EXT.has(ext)
    ? MIME_TEXT_PLAIN
    : MAP_TEXT_EXTENSION_MIME[ext] ?? undefined
}

// endregion MIME

export function detectBuildUrl (): string | undefined {
  if (process.env.GITHUB_ACTIONS === 'true') {
    return `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
  }
  if (process.env.GITLAB_CI === 'true' && isNonNullable(process.env.CI_JOB_URL)) {
    return process.env.CI_JOB_URL
  }
  if (isNonNullable(process.env.CIRCLECI)) {
    return process.env.CIRCLE_BUILD_URL
  }
  if (isNonNullable(process.env.JENKINS_URL)) {
    return process.env.BUILD_URL
  }
  if (isNonNullable(process.env.TF_BUILD)) {
    return `${process.env.SYSTEM_TEAMFOUNDATIONCOLLECTIONURI}${process.env.SYSTEM_TEAMPROJECT}/_build/results?buildId=${process.env.BUILD_BUILDID}`
  }
  if (isNonNullable(process.env.TRAVIS)) {
    return process.env.TRAVIS_BUILD_WEB_URL
  }
  if (isNonNullable(process.env.BITBUCKET_BUILD_NUMBER)) {
    return process.env.BITBUCKET_GIT_HTTP_ORIGIN
  }
  if (isNonNullable(process.env.CODEBUILD_PUBLIC_BUILD_URL)) {
    return process.env.CODEBUILD_PUBLIC_BUILD_URL
  }
  if (isNonNullable(process.env.DRONE_BUILD_LINK)) {
    return process.env.DRONE_BUILD_LINK
  }
  return undefined
}

export function detectSourceUrl(): string | undefined {
  try {
    const hasGit = execSync('which git', { stdio: 'ignore' })
    if (hasGit !== null && hasGit.length > 0) {
      const gitUrl = execSync('git remote get-url origin 2>/dev/null', { encoding: 'utf8' }).trim()
      if (gitUrl !== null && gitUrl !== '') {
        if (gitUrl.startsWith('git@') && gitUrl.endsWith('.git')) {
          return gitUrl.replace(':', '/').replace('git@', 'https://')
        }
        return gitUrl
      }
    }
  } catch (error) {
    // Fall through to environment checks if git commands fail
  }

  if (isNonNullable(process.env.GITHUB_REPOSITORY)) {
    return `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}`
  }
  if (isNonNullable(process.env.GITLAB_CI)) {
    return process.env.CI_REPOSITORY_URL
  }
  if (isNonNullable(process.env.CIRCLECI)) {
    return process.env.CIRCLE_REPOSITORY_URL
  }
  if (isNonNullable(process.env.JENKINS_URL)) {
    return process.env.GIT_URL
  }
  if (isNonNullable(process.env.TF_BUILD)) {
    return process.env.BUILD_REPOSITORY_URI
  }
  if (isNonNullable(process.env.BITBUCKET_GIT_HTTP_ORIGIN)) {
    return process.env.BITBUCKET_GIT_HTTP_ORIGIN
  }
  if (isNonNullable(process.env.BITBUCKET_GIT_SSH_ORIGIN)) {
    return process.env.BITBUCKET_GIT_SSH_ORIGIN
  }
  if (isNonNullable(process.env.CODEBUILD_BUILD_ID)) {
    return process.env.CODEBUILD_SOURCE_REPO_URL
  }
  if (isNonNullable(process.env.DRONE_REPO_LINK)) {
    return process.env.DRONE_REPO_LINK
  }
  return undefined
}
