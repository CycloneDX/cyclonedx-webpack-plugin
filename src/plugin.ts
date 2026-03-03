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

import { existsSync } from 'node:fs'
import { join as joinPath, resolve } from 'node:path'

import { Utils as BomUtils } from '@cyclonedx/cyclonedx-library/Contrib/Bom'
import { Builders as FromNodePackageJsonBuilders, Factories as FromNodePackageJsonFactories } from '@cyclonedx/cyclonedx-library/Contrib/FromNodePackageJson'
import { Factories as LicenseFactories, Utils as LicenseUtils } from '@cyclonedx/cyclonedx-library/Contrib/License'
import { ComponentType, ExternalReferenceType,LifecyclePhase } from '@cyclonedx/cyclonedx-library/Enums'
import { Bom, Component, ExternalReference } from '@cyclonedx/cyclonedx-library/Models'
import type { Types as SerializeTypes } from '@cyclonedx/cyclonedx-library/Serialize'
import { JSON as SerializeJSON, JsonSerializer, XML as SerializeXML,XmlSerializer } from '@cyclonedx/cyclonedx-library/Serialize'
import { SpecVersionDict,Version as SpecVersion } from '@cyclonedx/cyclonedx-library/Spec'
import type { Types as ValidationTypes } from '@cyclonedx/cyclonedx-library/Validation'
import { JsonStrictValidator, MissingOptionalDependencyError,XmlValidator } from '@cyclonedx/cyclonedx-library/Validation'
import spdxExpressionParse from "spdx-expression-parse"
import type { Compiler } from 'webpack'
import { Compilation, sources, version as WEBPACK_VERSION } from 'webpack'

import type { PackageDescription } from './_helpers'
import {
  getPackageConfig,
  iterableSome,
  loadJsonFile,
  normalizePackageManifest
} from './_helpers'
import { Extractor } from './extractor'
import { PackageUrlFactory } from './factories'


type WebpackLogger = Compilation['logger']

/** @public */
export interface CycloneDxWebpackPluginOptions {
  // IMPORTANT: keep the table in the `README` in sync!

  /**
   * Which version of {@link https://github.com/CycloneDX/specification | CycloneDX spec} to use.
   *
   * @defaultValue `"1.6"`
   */
  specVersion?: CycloneDxWebpackPlugin['specVersion']

  /**
   * Whether to go the extra mile and make the output reproducible.
   * Reproducibility might result in loss of time- and random-based-values.
   *
   * @defaultValue `false`
   */
  reproducibleResults?: CycloneDxWebpackPlugin['reproducibleResults']
  /**
   * Whether to validate the BOM result.
   * Validation is skipped, if requirements not met. Requires {@link https://github.com/CycloneDX/cyclonedx-javascript-library#optional-dependencies | transitive optional dependencies}.
   *
   * @defaultValue `true`
   */
  validateResults?: CycloneDxWebpackPlugin['validateResults']

  /**
   * Path to write the output to.
   * The path is relative to webpack's overall output path.
   *
   * @defaultValue './cyclonedx'
   */
  outputLocation?: string
  /**
   * Whether to write the Wellknowns.
   *
   * @defaultValue `true`
   */
  includeWellknown?: boolean
  /**
   * Path to write the Wellknowns to.
   * The path is relative to webpack's overall output path.
   *
   * @defaultValue `'./.well-known'`
   */
  wellknownLocation?: string

  /**
   * Whether to try auto-detection of the RootComponent.
   *
   * Tries to find the nearest `package.json` and build a CycloneDX component from it,
   * so it can be assigned to `bom.metadata.component`.
   *
   * @defaultValue `true`
   */
  rootComponentAutodetect?: CycloneDxWebpackPlugin['rootComponentAutodetect']
  /**
   * Set the RootComponent's type.
   * See {@link https://cyclonedx.org/docs/1.7/json/#metadata_component_type | the list of valid values}.
   *
   * @defaultValue `'application'`
   */
  rootComponentType?: CycloneDxWebpackPlugin['rootComponentType']
  /**
   * If `rootComponentAutodetect` is disabled, then
   * this value is assumed as the "name" of the `package.json`.
   *
   * @defaultValue `undefined`
   */
  rootComponentName?: CycloneDxWebpackPlugin['rootComponentName']
  /**
   * If `rootComponentAutodetect` is disabled, then
   * this value is assumed as the "version" of the `package.json`.
   *
   * @defaultValue `undefined`
   */
  rootComponentVersion?: CycloneDxWebpackPlugin['rootComponentVersion']

  /**
   * Set the externalReference URL for the build-system for the RootComponent.
   * See {@link https://cyclonedx.org/docs/1.7/json/#metadata_component_externalReferences}.
   */
  rootComponentBuildSystem?: CycloneDxWebpackPlugin['rootComponentBuildSystem']
  /**
   * Set the externalReference URL for the version control system for the RootComponent.
   * See {@link https://cyclonedx.org/docs/1.7/json/#metadata_component_externalReferences}.
   */
  rootComponentVCS?: CycloneDxWebpackPlugin['rootComponentVCS']

  /**
   * Whether to collect (license) evidence and attach them to the resulting SBOM.
   *
   * @defaultValue `false`
   */
  collectEvidence?: CycloneDxWebpackPlugin['collectEvidence']
}

/** @public */
export class CycloneDxWebpackPlugin {
  specVersion: SpecVersion | `${SpecVersion}`
  reproducibleResults: boolean
  validateResults: boolean

  resultXml: string
  resultJson: string
  resultWellknown: string | undefined

  rootComponentAutodetect: boolean
  rootComponentType: Component['type'] | `${Component['type']}`
  rootComponentName: Component['name'] | undefined
  rootComponentVersion: Component['version'] | undefined
  rootComponentBuildSystem: ExternalReference['url'] | undefined
  rootComponentVCS: ExternalReference['url'] | undefined

  collectEvidence: boolean

  /* eslint-disable-next-line complexity -- acknowledged */
  constructor ({
    specVersion = SpecVersion.v1dot6,
    reproducibleResults = false,
    validateResults = true,
    outputLocation = './cyclonedx',
    includeWellknown = true,
    wellknownLocation = './.well-known',
    rootComponentAutodetect = true,
    rootComponentType = ComponentType.Application,
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

    const spec = SpecVersionDict[this.specVersion]
    if (spec === undefined) {
      logger.warn('Skip CycloneDX SBOM generation due to unknown specVersion: %j Expected one of: %j',
        this.specVersion, Object.keys(SpecVersionDict))
      return
    }

    const cdxExternalReferenceFactory = new FromNodePackageJsonFactories.ExternalReferenceFactory()
    const cdxLicenseFactory = new LicenseFactories.LicenseFactory(spdxExpressionParse)
    const cdxPurlFactory = new PackageUrlFactory()
    const cdxComponentBuilder = new FromNodePackageJsonBuilders.ComponentBuilder(cdxExternalReferenceFactory, cdxLicenseFactory)

    const bom = new Bom()
    bom.metadata.lifecycles.add(LifecyclePhase.Build)

    const serializeOptions: SerializeTypes.SerializerOptions & SerializeTypes.NormalizerOptions = {
      sortLists: this.reproducibleResults,
      space: 2 // TODO add option to have this configurable
    }

    const toBeSerialized = new Map<
      /* outputLocation */ string,
      [SerializeTypes.Serializer, undefined | ValidationTypes.Validator]
    >()

    let xmlSerializer: XmlSerializer | undefined = undefined
    try {
      xmlSerializer = new XmlSerializer(new SerializeXML.Normalize.Factory(spec))
    } catch {
      /* pass */
    }
    if (xmlSerializer !== undefined) {
      const xmlValidator = this.validateResults
        ? new XmlValidator(spec.version)
        : undefined
      toBeSerialized.set(this.resultXml, [xmlSerializer, xmlValidator])
    }

    let jsonSerializer: JsonSerializer | undefined = undefined
    try {
      jsonSerializer = new JsonSerializer(new SerializeJSON.Normalize.Factory(spec))
    } catch {
      /* pass */
    }
    if (jsonSerializer !== undefined) {
      const jsonValidator = this.validateResults
        ? new JsonStrictValidator(spec.version)
        : undefined
      toBeSerialized.set(this.resultJson, [jsonSerializer, jsonValidator])
      if (this.resultWellknown !== undefined) {
        toBeSerialized.set(this.resultWellknown, [jsonSerializer, jsonValidator])
      }
    }

    const rcPath = getPackageConfig(compilation.compiler.context)?.path
      ?? compilation.compiler.context

    compilation.hooks.afterOptimizeTree.tap(
      pluginName,
      (_, modules) => {
        const thisLogger = logger.getChildLogger('ComponentFetcher')
        const extractor = new Extractor(
          compilation,
          cdxComponentBuilder,
          cdxPurlFactory,
          new LicenseUtils.LicenseEvidenceGatherer()
        )

        thisLogger.log('generating components...')
        const components = extractor.generateComponents(modules, this.collectEvidence, thisLogger.getChildLogger('Extractor'))
        const rcComponentDetected = components.get(rcPath)
        if ( undefined !== rcComponentDetected ) {
          if (this.rootComponentAutodetect) {
            thisLogger.debug('set bom.metadata.component', rcComponentDetected)
            bom.metadata.component = rcComponentDetected
            components.delete(rcPath)
          } else {
            const rcComponent = cdxComponentBuilder.makeComponent({
              name: this.rootComponentName,
              version: this.rootComponentVersion,
            })
            if (rcComponent !== undefined) {
              rcComponent.dependencies = rcComponentDetected.dependencies
              for (const {dependencies} of components.values()) {
                if (dependencies.delete(rcComponentDetected.bomRef)) {
                  dependencies.add(rcComponent.bomRef)
                }
              }
              thisLogger.debug('add to bom.metadata.component', rcComponentDetected)
              bom.metadata.component = rcComponent
              components.delete(rcPath)
            }
          }
        }
        for (const component of components.values()) {
            thisLogger.debug('add to bom.components', component)
            bom.components.add(component)
        }
        thisLogger.log('generated components.')

        thisLogger.log('finalizing BOM...')
        this.#finalizeBom(bom, cdxComponentBuilder, logger.getChildLogger('BomFinalizer'))
        thisLogger.log('finalized BOM.')
      })

    compilation.hooks.processAssets.tapPromise(
      {
        name: pluginName,
        stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL
      },
      async () => {
        const compileBomAsset = async function (file: string, serializer: SerializeTypes.Serializer, validator?: ValidationTypes.Validator): Promise<boolean> {
          const thisLogger = logger.getChildLogger('BomAssetCompiler')
          const serialized = serializer.serialize(bom, serializeOptions)
          if (undefined !== validator) {
            try {
              /* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- expected */
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
              if (err instanceof MissingOptionalDependencyError) {
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

  #addRootComponentExtRefs (component: Component, logger: WebpackLogger): void {
    if (
      typeof this.rootComponentBuildSystem === 'string' &&
      this.rootComponentBuildSystem.length > 0 &&
      !iterableSome(
        component.externalReferences,
        ref => ref.type === ExternalReferenceType.BuildSystem
      )
    ) {
      component.externalReferences.add(
        new ExternalReference(
          this.rootComponentBuildSystem,
          ExternalReferenceType.BuildSystem,
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
        ref => ref.type === ExternalReferenceType.VCS
      )
    ) {
      component.externalReferences.add(
        new ExternalReference(
          this.rootComponentVCS,
          ExternalReferenceType.VCS,
          { comment: 'as declared via cyclonedx-webpack-plugin config "rootComponentVCS"' }
        )
      )
      logger.debug('Added rootComponent VCS URL:', this.rootComponentVCS)
    }
  }

  #finalizeBom (
    bom: Bom,
    cdxComponentBuilder: FromNodePackageJsonBuilders.ComponentBuilder,
    logger: WebpackLogger
  ): void {
    /* eslint-disable no-param-reassign -- intended */
    bom.serialNumber = this.reproducibleResults
      ? undefined
      : BomUtils.randomSerialNumber()
    bom.metadata.timestamp = this.reproducibleResults
      ? undefined
      : new Date()

    bom.metadata.tools.components.add(new Component(
      ComponentType.Application,
      'webpack',
      { version: WEBPACK_VERSION }
    ))
    for (const toolC of this.#makeToolCs(cdxComponentBuilder, logger.getChildLogger('ToolMaker'))) {
      bom.metadata.tools.components.add(toolC)
    }

    const rComponent = bom.metadata.component
    if (rComponent !== undefined) {
      this.#addRootComponentExtRefs(rComponent, logger)
      /* eslint-disable-next-line  @typescript-eslint/no-unsafe-type-assertion -- ack */
      rComponent.type = this.rootComponentType as Component['type']
      rComponent.bomRef.value ??= '__root_component__'
    }
    /* eslint-enable no-param-reassign */
  }

  * #makeToolCs (builder: FromNodePackageJsonBuilders.ComponentBuilder, logger: WebpackLogger): Generator<Component> {
    const packageJsonPaths: Array<[string, ComponentType]> = [
      // this plugin is an optional enhancement, not a standalone application -- use as `Library`
      [resolve(module.path, '..', 'package.json'), ComponentType.Library]
    ]

    const libs = [
      '@cyclonedx/cyclonedx-library'
    ].map(s => s.split('/', 2))
    const nodeModulePaths = require.resolve.paths('__some_none-native_package__') ?? []
    /* eslint-disable no-labels -- technically needed */
    libsLoop:
    for (const lib of libs) {
      for (const nodeModulePath of nodeModulePaths) {
        const packageJsonPath = resolve(nodeModulePath, ...lib, 'package.json')
        if (existsSync(packageJsonPath)) {
          packageJsonPaths.push([packageJsonPath, ComponentType.Library])
          continue libsLoop
        }
      }
    }
    /* eslint-enable no-labels */

    for (const [packageJsonPath, cType] of packageJsonPaths) {
      logger.log('try to build new Tool from PkgPath', packageJsonPath)
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- expected */
      const packageJson: PackageDescription['packageJson'] = loadJsonFile(packageJsonPath) ?? {}
      normalizePackageManifest(
        packageJson,
        w => { logger.debug('normalizePackageJson from PkgPath', packageJsonPath, 'caused:', w) }
      )
      const tool = builder.makeComponent(packageJson, cType)
      if (tool !== undefined) {
        yield tool
      }
    }
  }
}

class ValidationError extends Error {
  readonly details: any
  constructor (message: string, details: any) {
    super(message)
    /* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- expected */
    this.details = details
  }
}
