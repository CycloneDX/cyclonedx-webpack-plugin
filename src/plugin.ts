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

import { join as joinPath } from 'path'

import { sync as readPackageUpSync } from 'read-pkg-up'
import { Compilation, Compiler, sources } from 'webpack'
import * as CDX from '@cyclonedx/cyclonedx-library'

import { Extractor } from './extractor'
import { makeThisTool } from './thisTool'

export interface CycloneDxWebpackPluginOptions {
  // IMPORTANT: keep the table in the `README` in sync!

  /**
   * Which version of {@link https://github.com/CycloneDX/specification CycloneDX spec} to use.
   * Defaults to one that is the latest supported of this application.
   */
  specVersion?: CycloneDxWebpackPlugin['specVersion']
  /**
   * Whether to go the extra mile and make the output reproducible.
   * Reproducibility might result in loss of time- and random-based-values.
   *
   * @default false
   */
  reproducibleResults?: CycloneDxWebpackPlugin['reproducibleResults']

  /**
   * Path to write the output to.
   * The path is relative to webpack's overall output path.
   *
   * @default './cyclonedx'
   */
  outputLocation?: string
  /**
   * Whether to write the Wellknowns.
   *
   * @default true
   */
  includeWellknown?: boolean
  /**
   * Path to write the Wellknowns to.
   * The path is relative to webpack's overall output path.
   *
   * @default './.well-known'
   */
  wellknownLocation?: string

  /**
   * Whether to try auto-detection of the RootComponent.
   *
   * Tries to find the nearest `package.json` and build a CycloneDX component from it,
   * so it can be assigned to `bom.metadata.component`.
   *
   * @default true
   */
  rootComponentAutodetect?: CycloneDxWebpackPlugin['rootComponentAutodetect']
  /**
   * Set the RootComponent's type.
   * See {@link https://cyclonedx.org/docs/1.4/json/#metadata_component_type the list of valid values}.
   *
   * @default 'application'
   */
  rootComponentType?: CycloneDxWebpackPlugin['rootComponentType']
  /**
   * If `rootComponentAutodetect` is disabled, then
   * this value is assumed as the "name" of the `package.json`.
   *
   * @default undefined
   */
  rootComponentName?: CycloneDxWebpackPlugin['rootComponentName']
  /**
   * If `rootComponentAutodetect` is disabled, then
   * this value is assumed as the "version" of the `package.json`.
   *
   * @default undefined
   */
  rootComponentVersion?: CycloneDxWebpackPlugin['rootComponentVersion']
}

export class CycloneDxWebpackPlugin {
  specVersion: CDX.Spec.Version
  reproducibleResults: boolean

  resultXml: string
  resultJson: string
  resultWellknown: string | undefined

  rootComponentAutodetect: boolean
  rootComponentType: CDX.Models.Component['type']
  rootComponentName: CDX.Models.Component['name'] | undefined
  rootComponentVersion: CDX.Models.Component['version'] | undefined

  constructor ({
    specVersion = CDX.Spec.Version.v1dot4,
    reproducibleResults = false,
    outputLocation = './cyclonedx',
    includeWellknown = true,
    wellknownLocation = './.well-known',
    rootComponentAutodetect = true,
    rootComponentType = CDX.Enums.ComponentType.Application,
    rootComponentName = undefined,
    rootComponentVersion = undefined
  }: CycloneDxWebpackPluginOptions = {}) {
    this.specVersion = specVersion
    this.reproducibleResults = reproducibleResults
    this.resultXml = joinPath(outputLocation, './bom.xml')
    this.resultJson = joinPath(outputLocation, './bom.json')
    this.resultWellknown = includeWellknown
      ? joinPath(wellknownLocation, './sbom')
      : undefined
    this.rootComponentAutodetect = rootComponentAutodetect
    this.rootComponentType = rootComponentType
    this.rootComponentName = rootComponentName
    this.rootComponentVersion = rootComponentVersion
  }

  apply (compiler: Compiler): void {
    const pluginName = this.constructor.name
    compiler.hooks.thisCompilation.tap(pluginName, this.#compilationHook.bind(this))
  }

  #compilationHook (compilation: Compilation): void {
    const pluginName = this.constructor.name

    const spec = CDX.Spec.SpecVersionDict[this.specVersion]
    if (spec === undefined) {
      return
    }

    const logger = compilation.getLogger(pluginName)
    const cdxExternalReferenceFactory = new CDX.Factories.FromPackageJson.ExternalReferenceFactory()
    const cdxLicenseFactory = new CDX.Factories.LicenseFactory()
    const cdxPurlFactory = new CDX.Factories.PackageUrlFactory('npm')
    const cdxToolBuilder = new CDX.Builders.FromPackageJson.ToolBuilder(cdxExternalReferenceFactory)
    const cdxComponentBuilder = new CDX.Builders.FromPackageJson.ComponentBuilder(cdxExternalReferenceFactory, cdxLicenseFactory)

    const bom = new CDX.Models.Bom()
    bom.metadata.component = this.#makeRootComponent(compilation.compiler.context, cdxComponentBuilder)

    const serializeOptions: CDX.Serialize.Types.SerializerOptions & CDX.Serialize.Types.NormalizerOptions = {
      sortLists: this.reproducibleResults,
      space: 2 // TODO add option to have this configurable
    }

    let xmlSerializer: CDX.Serialize.XmlSerializer | undefined
    try {
      xmlSerializer = new CDX.Serialize.XmlSerializer(new CDX.Serialize.XML.Normalize.Factory(spec))
    } catch {
      // pass
    }

    let jsonSerializer: CDX.Serialize.JsonSerializer | undefined
    try {
      jsonSerializer = new CDX.Serialize.JsonSerializer(new CDX.Serialize.JSON.Normalize.Factory(spec))
    } catch {
      // pass
    }

    const toBeSerialized = new Map<string, CDX.Serialize.Types.Serializer>()
    if (xmlSerializer !== undefined) {
      toBeSerialized.set(this.resultXml, xmlSerializer)
    }
    if (jsonSerializer !== undefined) {
      toBeSerialized.set(this.resultJson, jsonSerializer)
      if (this.resultWellknown !== undefined) {
        toBeSerialized.set(this.resultWellknown, jsonSerializer)
      }
    }

    compilation.fileDependencies

    compilation.hooks.afterOptimizeTree.tap(
      pluginName,
      (_, modules) => {
        const thisLogger = logger.getChildLogger('ComponentFetcher')
        const extractor = new Extractor(compilation, cdxComponentBuilder, cdxPurlFactory)

        thisLogger.log('generating components...')
        for (const component of extractor.generateComponents(modules, thisLogger.getChildLogger('Extractor'))) {
          if (bom.metadata.component !== undefined &&
            bom.metadata.component.group === component.group &&
            bom.metadata.component.name === component.name &&
            bom.metadata.component.version === component.version
          ) {
            // metadata matches this exact component.
            // -> so the component is actually treated as the root component.
            thisLogger.debug('update bom.metadata.component - replace', bom.metadata.component, 'with', component)
            bom.metadata.component = component
          } else {
            thisLogger.debug('add to bom.components', component)
            bom.components.add(component)
          }
        }
        thisLogger.log('generated components...')

        thisLogger.log('finalizing BOM...')
        this.#finalizeBom(bom, cdxToolBuilder, cdxPurlFactory)
        thisLogger.log('finalizes BOM.')
      })

    compilation.hooks.processAssets.tap(
      {
        name: pluginName,
        stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL
      },
      () => toBeSerialized.forEach(
        (serializer: CDX.Serialize.Types.Serializer, file: string) => compilation[
          (compilation.getAsset(file) === undefined)
            ? 'emitAsset'
            : 'updateAsset'
        ](file, sources.CompatSource.from({
          source: () => serializer.serialize(bom, serializeOptions)
        }))
      )
    )
  }

  #makeRootComponent (cwd: string, builder: CDX.Builders.FromPackageJson.ComponentBuilder): CDX.Models.Component | undefined {
    const thisPackage = this.rootComponentAutodetect
      ? readPackageUpSync({ cwd, normalize: false })
      : { packageJson: { name: this.rootComponentName, version: this.rootComponentVersion } }
    return thisPackage === undefined
      ? undefined
      : builder.makeComponent(thisPackage.packageJson)
  }

  #finalizeBom (
    bom: CDX.Models.Bom,
    cdxToolBuilder: CDX.Builders.FromPackageJson.ToolBuilder,
    cdxPurlFactory: CDX.Factories.PackageUrlFactory
  ): void {
    bom.metadata.timestamp = this.reproducibleResults
      ? undefined
      : new Date()

    const thisTool = makeThisTool(cdxToolBuilder)
    if (thisTool !== undefined) {
      bom.metadata.tools.add(thisTool)
    }

    if (bom.metadata.component !== undefined) {
      bom.metadata.component.type = this.rootComponentType
      bom.metadata.component.purl = cdxPurlFactory.makeFromComponent(bom.metadata.component)
      bom.metadata.component.bomRef.value = bom.metadata.component.purl?.toString()
    }
  }
}
