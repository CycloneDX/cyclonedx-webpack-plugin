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

import * as CDX from '@cyclonedx/cyclonedx-library'
import { readFileSync } from 'fs'
import * as normalizePackageJson from 'normalize-package-data'
import { basename, dirname } from 'path'
import type { Compilation, Module } from 'webpack'

import { getPackageDescription, isNonNullable, type PackageDescription, searchEvidenceSources, structuredClonePolyfill } from './_helpers'

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

  generateComponents (modules: Iterable<Module>, collectEvidence?: boolean, logger?: WebpackLogger): Iterable<CDX.Models.Component> {
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
   * @throws {Error} when no component could be fetched
   */
  makeComponent (pkg: PackageDescription, collectEvidence?: boolean, logger?: WebpackLogger): CDX.Models.Component {
    try {
      const _packageJson = structuredClonePolyfill(pkg.packageJson)
      normalizePackageJson(_packageJson as object /* add debug for warnings? */)
      // region fix normalizations
      if (typeof pkg.packageJson.version === 'string') {
        // allow non-SemVer strings
        _packageJson.version = pkg.packageJson.version.trim()
      }
      // endregion fix normalizations
      pkg.packageJson = _packageJson
    } catch (e) {
      logger?.warn('normalizePackageJson from PkgPath', pkg.path, 'failed:', e)
    }

    const component = this.#componentBuilder.makeComponent(pkg.packageJson as object)
    if (component === undefined) {
      throw new Error(`failed building Component from PkgPath ${pkg.path}`)
    }

    component.licenses.forEach(l => {
      l.acknowledgement = CDX.Enums.LicenseAcknowledgement.Declared
    })

    component.purl = this.#purlFactory.makeFromComponent(component)
    component.bomRef.value = component.purl?.toString()

    if (collectEvidence === true) {
      try {
        component.evidence = this.makeComponentEvidence(pkg)
      } catch (e) {
        logger?.warn('collecting Evidence from PkgPath', pkg.path, 'failed:', e)
      }
    }

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

  /**
   * Look for common files that may provide licenses and attach them to the component as evidence
   * @param pkg
   */
  makeComponentEvidence (pkg: PackageDescription): CDX.Models.ComponentEvidence {
    const cdxComponentEvidence = new CDX.Models.ComponentEvidence()

    // Add license evidence
    for (const { contentType, filepath } of searchEvidenceSources(dirname(pkg.path))) {
      cdxComponentEvidence.licenses.add(new CDX.Models.NamedLicense(
        `file: ${basename(filepath)}`,
        {
          text: new CDX.Models.Attachment(
            readFileSync(filepath).toString('base64'),
            {
              contentType,
              encoding: CDX.Enums.AttachmentEncoding.Base64
            }
          )
        }
      ))
    }

    return cdxComponentEvidence
  }
}
