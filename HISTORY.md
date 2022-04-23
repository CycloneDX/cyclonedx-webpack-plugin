# Changelog

All notable changes to this project will be documented in this file.

## unreleased

* Changed
  * Requires node `>= 12.0.0` now, was `8.0.0`. (via [#287])
  * Requires `@cyclonedx/bom` `^3.8.0` now, was `^3.1.1`. (via [#287])
* Misc
  * Added reproducible test environments for unit an integration tests. (via [#51]) 

[#51]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/51

## 1.0.2 - 2922-04-22

* Fixed
  * `data:`-urls are no longer exported. ([#45] via [#46])

[#45]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/issues/45
[#46]: https://github.com/CycloneDX/cyclonedx-webpack-plugin/pull/46

## 1.0.1 - 2921-12-07

* Fixed
  * Fixes related to `bom-ref` and internal flows.

## 1.0.0 - 2021-09-12

Initial release.
