# Changelog

All notable changes to this project will be documented in this file.

## unreleased

* Added
  * SBOM result might have additional items in metadata.tools populated ([#637] via [#])

[#637]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/issues/637
[#]: https://github.com/CycloneDX/cyclonedx-node-npm/pull/

## 3.1.4 - 2023-02-11

Maintenance release.

* Build
  * Use _TypeScript_ `v4.9.5` now, was `v4.9.4`. (via [#619])
* Misc
  * Use `eslint-config-standard-with-typescript@34.0.0` now, was `@24.0.0`. (via [#596], [#613])

[#596]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/596
[#613]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/613
[#619]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/619

## 3.1.3 - 2022-12-16

Maintenance release.

* Docs
  * fix CI/CT shield ([badges/shields#8671] via [#515])
* Build
  * Use _TypeScript_ `v4.9.4` now, was `v4.9.3`. (via [#508])
* Misc
  * Use `eslint-config-standard-with-typescript@24.0.0` now, was `@23.0.0`. (via [#519])

[badges/shields#8671]: https://github.com/badges/shields/issues/8671
[#508]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/508
[#515]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/515
[#519]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/519

## 3.1.2 - 2022-11-19

Maintenance release.

* Build
  * Use _TypeScript_ `v4.9.3` now, was `v4.8.3`. (via [#466])

[#466]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/466

## 3.1.1 - 2022-09-10

Maintenance release.

* Misc
  * Style: imports are sorted, now. (via [#286])
* Build
  * Use _TypeScript_ `v4.8.3` now, was `v4.8.2`. (via [#288])

[#286]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/286
[#288]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/288

## 3.1.0 - 2022-09-07

* Changed
  * PackageUrl(PURL) in JSON and XML results are as short as possible, but still precise. (via [#285])
* Misc
  * Raised dependency `@cyclonedx/cyclonedx-library@^1.4.0`, was `@^1.0.0`. (via [#285])
* Build
  * Use _TypeScript_ `v4.8.2` now, was `v4.7.4`. (via [#284])

[#284]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/284
[#285]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/285

## 3.0.1 - 2022-06-25

* Docs
  * Added the configuration options to the `README`. (via [#75])

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
    The value currently defaults to `'1.4'`. (fixes [#53] via [#70])
  * Full support for typing. This will make the configuration of this plugin easier.
  * Lots of small features got added due to the fact that the data processing is managed by  `@cyclonedx/cyclonedx-library` now.
* Fixed
  * Dependency graph no longer has `null` or `undefined` values. (fixes [#31] via [#70])
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
  * Fix invalid format of generated bom by incomplete `package.json` files in subdirectories of npm packages. ([#31] via [#68])
* Misc
  * Add integration test for react18 with webpack5 and babel-runtime dependency. (via [#68])

[#31]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/issues/31
[#68]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/68

## 2.0.1 - 2022-05-05

* Fixed
  * Fixed support for Webpack5. ([#33],[#47] via [#55])
* Misc
  * Removed dev-files from release package, like `tests`. (via [#54])
  * Fixed use of internals from foreign packages. (via [#60])

[#54]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/54
[#60]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/60
[#33]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/issues/33
[#47]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/issues/47
[#55]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/55 

## 2.0.0 - 2022-04-24

* BREAKING changes
  * Requires node `>= 12.0.0` now, was `8.0.0`. (via [#51])
  * Requires `webpack` version `>=4` as a `peerDependency`, like it was documented in the README. (via [#49])
* Changed
  * Requires `@cyclonedx/bom` version`^3.8.0` now, was `^3.1.1`. (via [#51])
* Misc
  * Added reproducible test environments for unit an integration tests. (via [#51]) 
  * Applied coding standards. (via [#49])

[#51]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/51
[#49]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/49

## 1.0.2 - 2022-04-22

* Fixed
  * `data:`-urls are no longer exported. ([#45] via [#46])

[#45]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/issues/45
[#46]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/46

## 1.0.1 - 2021-12-07

* Fixed
  * Fixes related to `bom-ref` and internal flows.

## 1.0.0 - 2021-09-12

Initial release.
