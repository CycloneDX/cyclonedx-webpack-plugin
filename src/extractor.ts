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
import * as normalizePackageJson from 'normalize-package-data'
import { type Compilation, type Module } from 'webpack'

import { getComponentEvidence, getPackageDescription, type PackageDescription } from './_helpers'

type WebpackLogger = Compilation['logger']

export class Extractor {
  readonly #compilation: Compilation
  readonly #componentBuilder: CDX.Builders.FromNodePackageJson.ComponentBuilder
  readonly #purlFactory: CDX.Factories.FromNodePackageJson.PackageUrlFactory
  readonly #licenseFactory: CDX.Factories.LicenseFactory

  constructor (
    compilation: Compilation,
    componentBuilder: CDX.Builders.FromNodePackageJson.ComponentBuilder,
    purlFactory: CDX.Factories.FromNodePackageJson.PackageUrlFactory,
    licenseFactory: CDX.Factories.LicenseFactory
  ) {
    this.#compilation = compilation
    this.#componentBuilder = componentBuilder
    this.#purlFactory = purlFactory
    this.#licenseFactory = licenseFactory
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
        component.evidence = getComponentEvidence(pkg, this.#licenseFactory)
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
}

function isNonNullable<T> (value: T): value is NonNullable<T> {
  // NonNullable: not null and not undefined
  return value !== null && value !== undefined
}

const structuredClonePolyfill: <T>(value: T) => T = typeof structuredClone === 'function'
  ? structuredClone
  : function (value) { return JSON.parse(JSON.stringify(value)) }
