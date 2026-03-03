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

import { dirname } from 'node:path'

import type { Builders as FromNodePackageJsonBuilders } from '@cyclonedx/cyclonedx-library/Contrib/FromNodePackageJson'
import type { Utils as LicenseUtils } from '@cyclonedx/cyclonedx-library/Contrib/License'
import { LicenseAcknowledgement } from '@cyclonedx/cyclonedx-library/Enums'
import type { Component, License } from '@cyclonedx/cyclonedx-library/Models'
import { ComponentEvidence, LicenseRepository, NamedLicense } from '@cyclonedx/cyclonedx-library/Models'
import type normalizePackageData from "normalize-package-data";
import type { Compilation, Module } from 'webpack'

import type { PackageDescription } from './_helpers'
import {
  getPackageConfig,
  isNonNullable,
  normalizePackageManifest
} from './_helpers'
import type { PackageUrlFactory } from './factories'


type WebpackLogger = Compilation['logger']

export class Extractor {
  readonly #compilation: Compilation
  readonly #componentBuilder: FromNodePackageJsonBuilders.ComponentBuilder
  readonly #purlFactory: PackageUrlFactory
  readonly #leGatherer: LicenseUtils.LicenseEvidenceGatherer

  constructor (
    compilation: Compilation,
    componentBuilder: FromNodePackageJsonBuilders.ComponentBuilder,
    purlFactory: PackageUrlFactory,
    leFetcher: LicenseUtils.LicenseEvidenceGatherer,
  ) {
    this.#compilation = compilation
    this.#componentBuilder = componentBuilder
    this.#purlFactory = purlFactory
    this.#leGatherer = leFetcher
  }

  generateComponents (modules: Iterable<Module>, collectEvidence: boolean, logger?: WebpackLogger): Map<string, Component> {
    const pkgs = new Map<string, Component>()
    const components = new Map<Module, Component>()

    logger?.log('start building Components from modules...')
    for (const module of modules) {
      if (module.context === null) {
        logger?.debug('skipping', module)
        continue
      }
      const pkg = getPackageConfig(module.context)
      if (pkg === undefined) {
        logger?.debug('skipped package for', module.context)
        continue
      }
      let component = pkgs.get(pkg.path)
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
        pkgs.set(pkg.path, component)
      }
      components.set(module, component)
    }

    logger?.log('linking Component.dependencies...')
    this.#linkDependencies(components)

    logger?.log('done building Components from modules...')
    return pkgs
  }

  /**
   * @throws {@link Error} when no component could be fetched
   */
  makeComponent (pkg: PackageDescription, collectEvidence: boolean, logger?: WebpackLogger): Component {
    try {
      // work with a deep copy, because `normalizePackageManifest()` might modify the data
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- ach */
      const _packageJson = structuredClone(pkg.packageJson)
      normalizePackageManifest(_packageJson)
      pkg.packageJson = _packageJson /* eslint-disable-line  no-param-reassign -- intended  */
    } catch (e) {
      logger?.warn('normalizePackageJson from PkgPath', pkg.path, 'failed:', e)
    }

    /* eslint-disable-next-line  @typescript-eslint/no-unsafe-argument -- ack */
    const component = this.#componentBuilder.makeComponent(pkg.packageJson )
    if (component === undefined) {
      throw new Error(`failed building Component from PkgPath ${pkg.path}`)
    }

    component.licenses.forEach(l => {
      /* eslint-disable no-param-reassign -- intended */
      l.acknowledgement = LicenseAcknowledgement.Declared
      /* eslint-enable no-param-reassign -- intended */
    })

    if (collectEvidence) {
      component.evidence = new ComponentEvidence({
        licenses: new LicenseRepository(this.getLicenseEvidence(dirname(pkg.path), logger))
      })
    }

    /* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ack */
    component.purl = this.#purlFactory.makeFromPackageJson(pkg.packageJson as normalizePackageData.Package)?.toString()

    /* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- ack */
    component.bomRef.value = `${pkg.packageJson.name}@${pkg.packageJson.version??'*'}`

    return component
  }

  #linkDependencies (modulesComponents: Map<Module, Component>): void {
    for (const [module, component] of modulesComponents) {
      for (const dependencyModule of module.dependencies.map(d => this.#compilation.moduleGraph.getModule(d)).filter(isNonNullable)) {
        const dependencyBomRef = modulesComponents.get(dependencyModule)?.bomRef
        if (dependencyBomRef !== undefined && dependencyBomRef !== component.bomRef) {
          component.dependencies.add(dependencyBomRef)
        }
      }
    }
  }

  public * getLicenseEvidence (packageDir: string, logger?: WebpackLogger): Generator<License> {
    const files = this.#leGatherer.getFileAttachments(
      packageDir,
      (error: Error): void => {
        /* c8 ignore next 2 */
        logger?.info(error.message)
        logger?.debug(error.message, error)
      }
    )
    try {
      for (const {file, text} of files) {
        yield new NamedLicense(`file: ${file}`, { text })
      }
    }
    /* c8 ignore next 3 */
    catch (e) {
      // generator will not throw before first `.nest()` is called ...
      logger?.warn('collecting license evidence in', packageDir, 'failed:', e)
    }
  }
}
