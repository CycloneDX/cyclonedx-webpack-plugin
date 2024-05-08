# Changelog

All notable changes to this project will be documented in this file.

## unreleased

<!-- unreleased changes go here -->

## 3.11.0 - 2024-05-08

* Added
  * Licenses acknowledgement might be populated ([#1274] via [#1281])
* Misc
  * Raised dependency `@cyclonedx/cyclonedx-library@^6.6.0`, was `@^6.5.0` (via [#1281])

[#1274]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/issues/1274
[#1281]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/1281

## 3.10.0 - 2024-04-23

Added support for [_CycloneDX_ Specification-1.6](https://github.com/CycloneDX/specification/releases/tag/1.6).

* Changed
  * This tool supports _CycloneDX_ Specification-1.6 now (via [#1276])
* Added
  * Option `specVersion` now supports value `1.6` to reflect _CycloneDX_ Specification-1.6 (via [#1276])  
    Default value for that option is unchanged - still `1.4`.
* Build
  * Use _TypeScript_ `v5.4.5` now, was `v5.4.2` (via [#1270])

[#1270]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/1270
[#1276]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/1276

## 3.9.2 - 2024-03-19

* Build
  * Use _TypeScript_ `v5.4.2` now, was `v5.3.3` (via [#1259])

[#1259]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/1259

## 3.9.1 - 2023-12-10

* Fix
  * Malformed ingested package versions are fixed (via [#1246]) 

[#1246]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/1246

## 3.9.0 - 2023-12-10

* Changed
  * Hardened JSON imports (via [#1242], [#1245])
* Build
  * Use _TypeScript_ `v5.3.3` now, was `v5.3.2` (via [#1244])

[#1242]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/1242
[#1244]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/1244
[#1245]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/1245

## 3.8.3 - 2023-12-01

* Build
  * Use _TypeScript_ `v5.3.2` now, was `v5.2.2` (via [#1238])

[#1238]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/1238

## 3.8.2 - 2023-08-28

* Build
  * Use _TypeScript_ `v5.2.2` now, was `v5.1.6` (via [#1218])
* Misc
  * Raised dependency `@cyclonedx/cyclonedx-library@^5||^6`, was `@^5` (via [#1214])

[#1214]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/1214
[#1218]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/1218

## 3.8.1 - 2023-08-17

* Misc
  * Raised dependency `normalize-package-data@^3||^4||^5||^6`, was `@^3||^4||^5` (via [#1194])

[#1194]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/1194

## 3.8.0 - 2023-08-17

* Added
  * SBOM results are marked to be produced in lifecycle phase "build" ([#1173] via [#1188]) 
* Misc
  * Raised dependency `@cyclonedx/cyclonedx-library@^5`, was `@^3||^4` (via [#1188])

[#1173]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/issues/1173
[#1188]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/1188

## 3.7.0 - 2023-07-05

Added support for [_CycloneDX_ Specification-1.5](https://github.com/CycloneDX/specification/releases/tag/1.5).

* Changed
  * This tool supports _CycloneDX_ Specification-1.5 now ([#1001] via [#1021])
  * This tool warns now, if SBOM generation is skipped due to an unsupported value for option `specVersion` (via [#1021])  
    Previous behaviour was a silent skip.
* Added
  * Option `specVersion` now supports value `1.5` to reflect _CycloneDX_ Specification-1.5 ([#1001] via [#1021])  
    Default value for that option is unchanged - still `1.4`.
* Build
  * Use _TypeScript_ `v5.1.6` now, was `v5.1.3` (via [#1017])
* Misc
  * Raised dependency `@cyclonedx/cyclonedx-library@^3||^4`, was `@^2.0.0` ([#1001] via [#1021])

[#1001]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/issues/1001
[#1017]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/1017
[#1021]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/1021

## 3.6.1 - 2023-06-16

* Build
  * Use _TypeScript_ `v5.1.3` now, was `v5.0.4` (via [#934])
  * Disabled TypeScript compilerOption `esModuleInterop` (via [#892])
  * Disabled TypeScript compilerOption `allowSyntheticDefaultImports` (via [#892])
* Misc
  * Improved internal type-compatibility to _webpack_ (via [#980])

[#892]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/892
[#934]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/934
[#980]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/980

## 3.6.0 - 2023-05-17

* Changes
  * SPDX license expression detection improved (via [#881])  
    Previously, some expressions were not properly detected, so they were marked as named-license in the SBOM results.
    They should be marked as expression, now.
* Misc
  * Raised dependency `@cyclonedx/cyclonedx-library@^2.0.0`, was `@^1.14.0` (via [#881])

[#881]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/881

## 3.5.0 - 2023-04-27

* Added
  * SBOM results might be validated (via [#825])  
    This feature is enabled per default and can be controlled via the new option `validateResults`.  
    Validation is skipped, if requirements are not met.
    Requires [transitive optional dependencies](https://github.com/CycloneDX/cyclonedx-javascript-library/blob/main/README.md#optional-dependencies)
* Build
  * Use _TypeScript_ `v5.0.4` now, was `v4.9.5` (via [#790])

[#790]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/790
[#825]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/825

## 3.4.1 - 2023-03-31

* Fixed
  * If packages' metadata [normalization](https://www.npmjs.com/package/normalize-package-data)
    fails, then this results no longer in an unhandled crash but causes a warning message ([#745] via [#754])
* Misc
  * Packages' metadata [normalization](https://www.npmjs.com/package/normalize-package-data)
    is less verbose (via [#754])  
    If failed, then a warning is sent to _webpack_'s log, now. No additional debug messages anymore.  
    As always, you can control the display of these messages via [webpack stats](https://webpack.js.org/configuration/stats/).

[#745]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/issues/745
[#754]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/754

## 3.4.0 - 2023-03-28

* Added
  * SBOM result might have `serialNumber` populated ([#747] via [#748])

[#747]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/issues/747
[#748]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/748

## 3.3.1 - 2023-03-15

Maintenance release.

## 3.3.0 - 2023-03-02

* Changed
  * Detected node packages' metadata are now [normalized](https://www.npmjs.com/package/normalize-package-data), before translation to SBOM components happens ([#678] via [#679])  
    This might increase the quality of SBOM results.
  
[#678]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/issues/678
[#679]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/679

## 3.2.0 - 2023-02-16

* Added
  * SBOM result might have additional items in `metadata.tools` populated ([#637] via [#638])
* Misc
  * Dropped outdated dependency `read-pkg-up` ([#647] via [#648])

[#637]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/issues/637
[#638]: https://github.com/CycloneDX/cyclonedx-node-npm/pull/638
[#647]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/issues/647
[#648]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/648

## 3.1.4 - 2023-02-11

Maintenance release.

* Build
  * Use _TypeScript_ `v4.9.5` now, was `v4.9.4` (via [#619])
* Misc
  * Use `eslint-config-standard-with-typescript@34.0.0` now, was `@24.0.0` (via [#596], [#613])

[#596]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/596
[#613]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/613
[#619]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/619

## 3.1.3 - 2022-12-16

Maintenance release.

* Docs
  * fix CI/CT shield ([badges/shields#8671] via [#515])
* Build
  * Use _TypeScript_ `v4.9.4` now, was `v4.9.3` (via [#508])
* Misc
  * Use `eslint-config-standard-with-typescript@24.0.0` now, was `@23.0.0` (via [#519])

[badges/shields#8671]: https://github.com/badges/shields/issues/8671
[#508]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/508
[#515]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/515
[#519]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/519

## 3.1.2 - 2022-11-19

Maintenance release.

* Build
  * Use _TypeScript_ `v4.9.3` now, was `v4.8.3` (via [#466])

[#466]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/466

## 3.1.1 - 2022-09-10

Maintenance release.

* Misc
  * Style: imports are sorted, now (via [#286])
* Build
  * Use _TypeScript_ `v4.8.3` now, was `v4.8.2` (via [#288])

[#286]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/286
[#288]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/288

## 3.1.0 - 2022-09-07

* Changed
  * PackageUrl(PURL) in JSON and XML results are as short as possible, but still precise (via [#285])
* Misc
  * Raised dependency `@cyclonedx/cyclonedx-library@^1.4.0`, was `@^1.0.0` (via [#285])
* Build
  * Use _TypeScript_ `v4.8.2` now, was `v4.7.4` (via [#284])

[#284]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/284
[#285]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/285

## 3.0.1 - 2022-06-25

* Docs
  * Added the configuration options to the `README` (via [#75])

[#75]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/75

## 3.0.0 - 2022-06-20

This is a reboot, written in _TypeScript_ and compiled to _JavaScript_.

* BREAKING changes
  * Requires _Node.js_ `>= 14.0.0` now, was `>= 12.0.0`.
  * Requires _webpack_ version `^5` as a `peerDependency`, was `>=4 <6`.
* Changed
  * The optional configuration options changed in name and meaning. Consult the `README` for details.
* Added
  * Added an optional switch to select the desired CycloneDX spec version for the output.  
    The value currently defaults to `'1.4'` (fixes [#53] via [#70])
  * Full support for typing. This will make the configuration of this plugin easier.
  * Lots of small features got added due to the fact that the data processing is managed by  `@cyclonedx/cyclonedx-library` now.
* Fixed
  * Dependency graph no longer has `null` or `undefined` values (fixes [#31] via [#70])
* Removed
  * The optional config option `emitStats` and its functionality were dropped.
    You may use _webpack_'s `--stats` switch instead.
* Misc
  * Uses `@cyclonedx/cyclonedx-library` now, instead of `@cyclonedx/bom`.

[#31]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/issues/31
[#53]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/issues/53
[#70]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/70

## 2.0.2 - 2022-06-11

* Fixed
  * Fix invalid format of generated bom by incomplete `package.json` files in subdirectories of npm packages ([#31] via [#68])
* Misc
  * Add integration test for react18 with webpack5 and babel-runtime dependency (via [#68])

[#31]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/issues/31
[#68]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/68

## 2.0.1 - 2022-05-05

* Fixed
  * Fixed support for Webpack5 ([#33],[#47] via [#55])
* Misc
  * Removed dev-files from release package, like `tests` (via [#54])
  * Fixed use of internals from foreign packages (via [#60])

[#54]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/54
[#60]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/60
[#33]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/issues/33
[#47]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/issues/47
[#55]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/55 

## 2.0.0 - 2022-04-24

* BREAKING changes
  * Requires node `>= 12.0.0` now, was `8.0.0` (via [#51])
  * Requires `webpack` version `>=4` as a `peerDependency`, like it was documented in the README (via [#49])
* Changed
  * Requires `@cyclonedx/bom` version`^3.8.0` now, was `^3.1.1` (via [#51])
* Misc
  * Added reproducible test environments for unit an integration tests (via [#51]) 
  * Applied coding standards (via [#49])

[#51]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/51
[#49]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/49

## 1.0.2 - 2022-04-22

* Fixed
  * `data:`-urls are no longer exported ([#45] via [#46])

[#45]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/issues/45
[#46]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/46

## 1.0.1 - 2021-12-07

* Fixed
  * Fixes related to `bom-ref` and internal flows.

## 1.0.0 - 2021-09-12

Initial release.
