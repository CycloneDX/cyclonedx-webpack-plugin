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
import { existsSync } from 'fs'
import normalizePackageJson from 'normalize-package-data'
import { join as joinPath, resolve } from 'path'
import { Compilation, type Compiler, sources, version as WEBPACK_VERSION } from 'webpack'

import { getPackageDescription, iterableSome, loadJsonFile } from './_helpers'
import { Extractor } from './extractor'

type WebpackLogger = Compilation['logger']

/** @public */
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
   * Whether to validate the BOM result.
   * Validation is skipped, if requirements not met. Requires {@link https://github.com/CycloneDX/cyclonedx-javascript-library#optional-dependencies transitive optional dependencies}.
   *
   * @default true
   */
  validateResults?: CycloneDxWebpackPlugin['validateResults']

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
   * See {@link https://cyclonedx.org/docs/1.6/json/#metadata_component_type the list of valid values}.
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

  /**
   * Set the externalReference URL for the build-system for the RootComponent.
   * See {@link https://cyclonedx.org/docs/1.6/json/#metadata_component_externalReferences}.
   */
  rootComponentBuildSystem?: CycloneDxWebpackPlugin['rootComponentBuildSystem']
  /**
   * Set the externalReference URL for the version control system for the RootComponent.
   * See {@link https://cyclonedx.org/docs/1.6/json/#metadata_component_externalReferences}.
   */
  rootComponentVCS?: CycloneDxWebpackPlugin['rootComponentVCS']

  /**
   * Whether to collect (license) evidence and attach them to the resulting SBOM.
   *
   * @default false
   */
  collectEvidence?: CycloneDxWebpackPlugin['collectEvidence']
}

class ValidationError extends Error {
  readonly details: any
  constructor (message: string, details: any) {
    super(message)
    this.details = details
  }
}

/** @public */
export class CycloneDxWebpackPlugin {
  specVersion: CDX.Spec.Version
  reproducibleResults: boolean
  validateResults: boolean

  resultXml: string
  resultJson: string
  resultWellknown: string | undefined

  rootComponentAutodetect: boolean
  rootComponentType: CDX.Models.Component['type']
  rootComponentName: CDX.Models.Component['name'] | undefined
  rootComponentVersion: CDX.Models.Component['version'] | undefined
  rootComponentBuildSystem: CDX.Models.ExternalReference['url'] | undefined
  rootComponentVCS: CDX.Models.ExternalReference['url'] | undefined

  collectEvidence: boolean

  constructor ({
    specVersion = CDX.Spec.Version.v1dot6,
    reproducibleResults = false,
    validateResults = true,
    outputLocation = './cyclonedx',
    includeWellknown = true,
    wellknownLocation = './.well-known',
    rootComponentAutodetect = true,
    rootComponentType = CDX.Enums.ComponentType.Application,
    rootComponentName = undefined,
    rootComponentVersion = undefined,
    rootComponentBuildSystem = undefined,
    rootComponentVCS = undefined,
    collectEvidence = false
  }: CycloneDxWebpackPluginOptions = {}) {
    this.specVersion = specVersion
    this.reproducibleResults = reproducibleResults
    this.validateResults = validateResults
    this.resultXml = joinPath(outputLocation, './bom.xml')
    this.resultJson = joinPath(outputLocation, './bom.json')
    this.resultWellknown = includeWellknown
      ? joinPath(wellknownLocation, './sbom')
      : undefined
    this.rootComponentAutodetect = rootComponentAutodetect
    this.rootComponentType = rootComponentType
    this.rootComponentName = rootComponentName
    this.rootComponentVersion = rootComponentVersion
    this.rootComponentBuildSystem = rootComponentBuildSystem
    this.rootComponentVCS = rootComponentVCS
    this.collectEvidence = collectEvidence
  }

  apply (compiler: Compiler): void {
    const pluginName = this.constructor.name
    compiler.hooks.thisCompilation.tap(pluginName, this.#compilationHook.bind(this))
  }

  #compilationHook (compilation: Compilation): void {
    const pluginName = this.constructor.name
    const logger = compilation.getLogger(pluginName)

    const spec = CDX.Spec.SpecVersionDict[this.specVersion]
    if (spec === undefined) {
      logger.warn('Skip CycloneDX SBOM generation due to unknown specVersion: %j Expected one of: %j',
        this.specVersion, Object.keys(CDX.Spec.SpecVersionDict))
      return
    }

    const cdxExternalReferenceFactory = new CDX.Factories.FromNodePackageJson.ExternalReferenceFactory()
    const cdxLicenseFactory = new CDX.Factories.LicenseFactory()
    const cdxPurlFactory = new CDX.Factories.FromNodePackageJson.PackageUrlFactory('npm')
    const cdxComponentBuilder = new CDX.Builders.FromNodePackageJson.ComponentBuilder(cdxExternalReferenceFactory, cdxLicenseFactory)

    const bom = new CDX.Models.Bom()
    bom.metadata.lifecycles.add(CDX.Enums.LifecyclePhase.Build)
    bom.metadata.component = this.#makeRootComponent(compilation.compiler.context, cdxComponentBuilder, logger.getChildLogger('RootComponentBuilder'))

    const serializeOptions: CDX.Serialize.Types.SerializerOptions & CDX.Serialize.Types.NormalizerOptions = {
      sortLists: this.reproducibleResults,
      space: 2 // TODO add option to have this configurable
    }

    let xmlSerializer: CDX.Serialize.XmlSerializer | undefined
    try {
      xmlSerializer = new CDX.Serialize.XmlSerializer(new CDX.Serialize.XML.Normalize.Factory(spec))
    } catch {
      /* pass */
    }
    const xmlValidator = this.validateResults && xmlSerializer !== undefined
      ? new CDX.Validation.XmlValidator(spec.version)
      : undefined

    let jsonSerializer: CDX.Serialize.JsonSerializer | undefined
    try {
      jsonSerializer = new CDX.Serialize.JsonSerializer(new CDX.Serialize.JSON.Normalize.Factory(spec))
    } catch {
      /* pass */
    }
    const jsonValidator = this.validateResults && jsonSerializer !== undefined
      ? new CDX.Validation.JsonStrictValidator(spec.version)
      : undefined

    const toBeSerialized = new Map<string, [CDX.Serialize.Types.Serializer, undefined | CDX.Validation.Types.Validator]>()
    if (xmlSerializer !== undefined) {
      toBeSerialized.set(this.resultXml, [xmlSerializer, xmlValidator])
    }
    if (jsonSerializer !== undefined) {
      toBeSerialized.set(this.resultJson, [jsonSerializer, jsonValidator])
      if (this.resultWellknown !== undefined) {
        toBeSerialized.set(this.resultWellknown, [jsonSerializer, jsonValidator])
      }
    }

    compilation.hooks.afterOptimizeTree.tap(
      pluginName,
      (_, modules) => {
        const thisLogger = logger.getChildLogger('ComponentFetcher')
        const extractor = new Extractor(compilation, cdxComponentBuilder, cdxPurlFactory)

        thisLogger.log('generating components...')
        for (const component of extractor.generateComponents(modules, this.collectEvidence, thisLogger.getChildLogger('Extractor'))) {
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
        thisLogger.log('generated components.')

        thisLogger.log('finalizing BOM...')
        this.#finalizeBom(bom, cdxComponentBuilder, cdxPurlFactory, logger.getChildLogger('BomFinalizer'))
        thisLogger.log('finalized BOM.')
      })

    compilation.hooks.processAssets.tapPromise(
      {
        name: pluginName,
        stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL
      },
      async () => {
        const compileBomAsset = async function (file: string, serializer: CDX.Serialize.Types.Serializer, validator?: CDX.Validation.Types.Validator): Promise<boolean> {
          const thisLogger = logger.getChildLogger('BomAssetCompiler')
          const serialized = serializer.serialize(bom, serializeOptions)
          if (undefined !== validator) {
            try {
              const validationErrors = await validator.validate(serialized)
              if (validationErrors !== null) {
                thisLogger.debug('BOM result invalid. details: ', validationErrors)
                throw new ValidationError(
                  `Failed to generate valid BOM "${file}"\n` +
                  'Please report the issue and provide the npm lock file of the current project to:\n' +
                  'https://github.com/CycloneDX/cyclonedx-webpack-plugin/issues/new?template=ValidationError-report.md&labels=ValidationError&title=%5BValidationError%5D',
                  validationErrors
                )
              }
            } catch (err) {
              if (err instanceof CDX.Validation.MissingOptionalDependencyError) {
                thisLogger.info('skipped validate BOM:', err.message)
              } else {
                thisLogger.error('unexpected error')
                throw err
              }
            }
          }
          const assetAction = compilation.getAsset(file) === undefined
            ? 'emitAsset'
            : 'updateAsset'
          compilation[assetAction](file, sources.CompatSource.from({
            source: () => serialized
          }))
          return true
        }
        const promises: Array<Promise<unknown>> = []
        toBeSerialized.forEach(
          ([serializer, validator], file) => {
            promises.push(compileBomAsset(file, serializer, validator))
          }
        )
        await Promise.all(promises)
      }
    )
  }

  #addRootComponentExtRefs (component: CDX.Models.Component, logger: WebpackLogger): void {
    if (
      typeof this.rootComponentBuildSystem === 'string' &&
      this.rootComponentBuildSystem.length > 0 &&
      !iterableSome(
        component.externalReferences,
        ref => ref.type === CDX.Enums.ExternalReferenceType.BuildSystem
      )
    ) {
      component.externalReferences.add(
        new CDX.Models.ExternalReference(
          this.rootComponentBuildSystem,
          CDX.Enums.ExternalReferenceType.BuildSystem,
          { comment: 'as declared via cyclonedx-webpack-plugin config "rootComponentBuildSystem"' }
        )
      )
      logger.debug('Added rootComponent BuildSystem URL:', this.rootComponentBuildSystem)
    }
    if (
      typeof this.rootComponentVCS === 'string' &&
      this.rootComponentVCS.length > 0 &&
      !iterableSome(
        component.externalReferences,
        ref => ref.type === CDX.Enums.ExternalReferenceType.VCS
      )
    ) {
      component.externalReferences.add(
        new CDX.Models.ExternalReference(
          this.rootComponentVCS,
          CDX.Enums.ExternalReferenceType.VCS,
          { comment: 'as declared via cyclonedx-webpack-plugin config "rootComponentVCS"' }
        )
      )
      logger.debug('Added rootComponent VCS URL:', this.rootComponentVCS)
    }
  }

  #makeRootComponent (
    path: string,
    builder: CDX.Builders.FromNodePackageJson.ComponentBuilder,
    logger: WebpackLogger
  ): CDX.Models.Component | undefined {
    const thisPackageJson: object = this.rootComponentAutodetect
      ? getPackageDescription(path)?.packageJson
      : { name: this.rootComponentName, version: this.rootComponentVersion }
    if (thisPackageJson === undefined) { return undefined }
    normalizePackageJson(
      thisPackageJson,
      function (w:string):void { logger.debug('normalizePackageJson from PkgPath', path, 'caused:', w) }
    )
    return builder.makeComponent(thisPackageJson)
  }

  #finalizeBom (
    bom: CDX.Models.Bom,
    cdxComponentBuilder: CDX.Builders.FromNodePackageJson.ComponentBuilder,
    cdxPurlFactory: CDX.Factories.FromNodePackageJson.PackageUrlFactory,
    logger: WebpackLogger
  ): void {
    bom.serialNumber = this.reproducibleResults
      ? undefined
      : CDX.Utils.BomUtility.randomSerialNumber()
    bom.metadata.timestamp = this.reproducibleResults
      ? undefined
      : new Date()

    bom.metadata.tools.components.add(new CDX.Models.Component(
      CDX.Enums.ComponentType.Application,
      'webpack',
      { version: WEBPACK_VERSION }
    ))
    for (const toolC of this.#makeToolCs(cdxComponentBuilder, logger.getChildLogger('ToolMaker'))) {
      bom.metadata.tools.components.add(toolC)
    }

    if (bom.metadata.component !== undefined) {
      this.#addRootComponentExtRefs(bom.metadata.component, logger)
      bom.metadata.component.type = this.rootComponentType
      bom.metadata.component.purl = cdxPurlFactory.makeFromComponent(bom.metadata.component)
      bom.metadata.component.bomRef.value = bom.metadata.component.purl?.toString()
    }
  }

  * #makeToolCs (builder: CDX.Builders.FromNodePackageJson.ComponentBuilder, logger: WebpackLogger): Generator<CDX.Models.Component> {
    const packageJsonPaths: Array<[string, CDX.Enums.ComponentType]> = [
      // this plugin is an optional enhancement, not a standalone application -- use as `Library`
      [resolve(module.path, '..', 'package.json'), CDX.Enums.ComponentType.Library]
    ]

    const libs = [
      '@cyclonedx/cyclonedx-library'
    ].map(s => s.split('/', 2))
    const nodeModulePaths = require.resolve.paths('__some_none-native_package__') ?? []
    /* eslint-disable no-labels */
    libsLoop:
    for (const lib of libs) {
      for (const nodeModulePath of nodeModulePaths) {
        const packageJsonPath = resolve(nodeModulePath, ...lib, 'package.json')
        if (existsSync(packageJsonPath)) {
          packageJsonPaths.push([packageJsonPath, CDX.Enums.ComponentType.Library])
          continue libsLoop
        }
      }
    }
    /* eslint-enable no-labels */

    for (const [packageJsonPath, cType] of packageJsonPaths) {
      logger.log('try to build new Tool from PkgPath', packageJsonPath)
      const packageJson: object = loadJsonFile(packageJsonPath) ?? {}
      normalizePackageJson(
        packageJson,
        function (w: string):void { logger.debug('normalizePackageJson from PkgPath', packageJsonPath, 'caused:', w) }
      )
      const tool = builder.makeComponent(packageJson, cType)
      if (tool !== undefined) {
        yield tool
      }
    }
  }
}
