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

import type * as CDX from '@cyclonedx/cyclonedx-library'
import normalizePackageJson from 'normalize-package-data'
import { type Compilation, type Module } from 'webpack'

import { getPackageDescription } from './_helpers'

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

  generateComponents (modules: Iterable<Module>, logger?: WebpackLogger): Iterable<CDX.Models.Component> {
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
        logger?.debug('no package for', module.context)
        continue
      }
      let component = pkgs[pkg.path]
      if (component === undefined) {
        logger?.log('try to build new Component from PkgPath', pkg.path)
        try {
          const _packageJson = structuredClonePolyfill(pkg.packageJson)
          normalizePackageJson(_packageJson /* add debug for warnings? */)
          // region fix normalizations
          if (typeof pkg.packageJson === 'string') {
            // allow non-SemVer strings
            _packageJson.version = pkg.packageJson.trim()
          }
          // endregion fix normalizations
          pkg.packageJson = _packageJson
        } catch (e) {
          logger?.warn('normalizePackageJson from PkgPath', pkg.path, 'failed:', e)
        }
        component = pkgs[pkg.path] = this.#componentBuilder.makeComponent(pkg.packageJson)
        logger?.debug('built', component, 'based on', pkg, 'for module', module)
      }
      if (component !== undefined) {
        components.set(module, component)
      }
    }

    logger?.log('generating PURLs and BomRefs...')
    for (const component of components.values()) {
      component.purl = this.#purlFactory.makeFromComponent(component)
      component.bomRef.value = component.purl?.toString()
    }

    logger?.log('linking Component.dependencies...')
    this.#linkDependencies(components)

    logger?.log('done building Components from modules...')
    return components.values()
  }

  #linkDependencies (modulesComponents: Map<Module, CDX.Models.Component>): void {
    for (const [module, component] of modulesComponents) {
      for (const dependencyModule of module.dependencies.map(d => this.#compilation.moduleGraph.getModule(d))) {
        const dependencyBomRef = modulesComponents.get(dependencyModule)?.bomRef
        if (dependencyBomRef !== undefined) {
          component.dependencies.add(dependencyBomRef)
        }
      }
    }
  }
}

const structuredClonePolyfill: <T>(value: T) => T = typeof structuredClone === 'function'
  ? structuredClone
  : function (value) { return JSON.parse(JSON.stringify(value)) }
