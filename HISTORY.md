# Changelog

All notable changes to this project will be documented in this file.

## unreleased

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
