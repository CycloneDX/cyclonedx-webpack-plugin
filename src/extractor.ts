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

import { type Dirent,readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

import * as CDX from '@cyclonedx/cyclonedx-library'
import normalizePackageJson from 'normalize-package-data'
import type { Compilation, Module } from 'webpack'

import {
  getMimeForLicenseFile,
  getPackageDescription,
  isNonNullable,
  type PackageDescription,
  structuredClonePolyfill
} from './_helpers'

type WebpackLogger = Compilation['logger']

export class Extractor {
  readonly #compilation: Compilation
  readonly #componentBuilder: CDX.Builders.FromNodePackageJson.ComponentBuilder
  readonly #purlFactory: CDX.Factories.FromNodePackageJson.PackageUrlFactory

  constructor (
    compilation: Compilation,
    componentBuilder: CDX.Builders.FromNodePackageJson.ComponentBuilder,
    purlFactory: CDX.Factories.FromNodePackageJson.PackageUrlFactory
  ) {
    this.#compilation = compilation
    this.#componentBuilder = componentBuilder
    this.#purlFactory = purlFactory
  }

  generateComponents (modules: Iterable<Module>, collectEvidence: boolean, logger?: WebpackLogger): Iterable<CDX.Models.Component> {
    const pkgs: Record<string, CDX.Models.Component | undefined> = {}
    const components = new Map<Module, CDX.Models.Component>()

    logger?.log('start building Components from modules...')
    for (const module of modules) {
      if (module.context === null) {
        logger?.debug('skipping', module)
        continue
      }
      const pkg = getPackageDescription(module.context)
      if (pkg === undefined) {
        logger?.debug('skipped package for', module.context)
        continue
      }
      let component = pkgs[pkg.path]
      if (component === undefined) {
        logger?.log('try to build new Component from PkgPath:', pkg.path)
        try {
          component = this.makeComponent(pkg, collectEvidence, logger)
        } catch (err) {
          logger?.debug('unexpected error:', err)
          logger?.warn('skipped Component from PkgPath', pkg.path)
          continue
        }
        logger?.debug('built', component, 'based on', pkg, 'for module', module)
        pkgs[pkg.path] = component
      }
      components.set(module, component)
    }

    logger?.log('linking Component.dependencies...')
    this.#linkDependencies(components)

    logger?.log('done building Components from modules...')
    return components.values()
  }

  /**
   * @throws {@link Error} when no component could be fetched
   */
  makeComponent (pkg: PackageDescription, collectEvidence: boolean, logger?: WebpackLogger): CDX.Models.Component {
    try {
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- expected */
      const _packageJson = structuredClonePolyfill(pkg.packageJson)
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- hint hont */
      normalizePackageJson(_packageJson as normalizePackageJson.Input /* add debug for warnings? */)
      // region fix normalizations
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- expected */
      if (typeof pkg.packageJson.version === 'string') {
        // allow non-SemVer strings
        /* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                                  , @typescript-eslint/no-unsafe-type-assertion
           -- hint hint */
        _packageJson.version = (pkg.packageJson.version as string).trim()
      }
      // endregion fix normalizations
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- hint hint */
      pkg.packageJson = _packageJson as normalizePackageJson.Package
    } catch (e) {
      logger?.warn('normalizePackageJson from PkgPath', pkg.path, 'failed:', e)
    }

    const component = this.#componentBuilder.makeComponent(
      /* eslint-disable-next-line  @typescript-eslint/no-unsafe-type-assertion -- hint hint */
      pkg.packageJson as normalizePackageJson.Package)
    if (component === undefined) {
      throw new Error(`failed building Component from PkgPath ${pkg.path}`)
    }

    component.licenses.forEach(l => {
      l.acknowledgement = CDX.Enums.LicenseAcknowledgement.Declared
    })

    if (collectEvidence) {
      component.evidence = new CDX.Models.ComponentEvidence({
        licenses: new CDX.Models.LicenseRepository(this.getLicenseEvidence(dirname(pkg.path), logger))
      })
    }

    component.purl = this.#purlFactory.makeFromComponent(component)
    component.bomRef.value = component.purl?.toString()

    return component
  }

  #linkDependencies (modulesComponents: Map<Module, CDX.Models.Component>): void {
    for (const [module, component] of modulesComponents) {
      for (const dependencyModule of module.dependencies.map(d => this.#compilation.moduleGraph.getModule(d)).filter(isNonNullable)) {
        const dependencyBomRef = modulesComponents.get(dependencyModule)?.bomRef
        if (dependencyBomRef !== undefined) {
          component.dependencies.add(dependencyBomRef)
        }
      }
    }
  }

  readonly #LICENSE_FILENAME_PATTERN = /^(?:UN)?LICEN[CS]E|.\.LICEN[CS]E$|^NOTICE$/i

  public * getLicenseEvidence (packageDir: string, logger?: WebpackLogger): Generator<CDX.Models.License> {
    let pcis: Dirent[] = []
    try {
      pcis = readdirSync(packageDir, { withFileTypes: true })
    } catch (e) {
      logger?.warn('collecting license evidence in', packageDir, 'failed:', e)
      return
    }
    for (const pci of pcis) {
      if (
        !pci.isFile() ||
        !this.#LICENSE_FILENAME_PATTERN.test(pci.name)
      ) {
        continue
      }

      const contentType = getMimeForLicenseFile(pci.name)
      if (contentType === undefined) {
        continue
      }

      const fp = join(packageDir, pci.name)
      try {
        yield new CDX.Models.NamedLicense(
          `file: ${pci.name}`,
          {
            text: new CDX.Models.Attachment(
              readFileSync(fp).toString('base64'),
              {
                contentType,
                encoding: CDX.Enums.AttachmentEncoding.Base64
              }
            )
          })
      } catch (e) { // may throw if `readFileSync()` fails
        logger?.warn('collecting license evidence from', fp, 'failed:', e)
      }
    }
  }
}
