# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]

-   Breaking: drop node 6 support

## [3.0.0] - 2019-05-02

### Added

-   Added sync export `exConfigSync`
-   Added `api` option

### Changed

-   Breaking: `exConfig` is now async

## [2.1.0] - 2019-04-29

### Added

-   Added `baseDirectory` option

## [2.0.0] - 2019-04-27

-   Add named export: `exConfig`
-   Breaking: remove default export
-   Breaking: Remove class and `new ExConfig`
-   Internal refactor

## [1.1.0] - 2019-04-05

### Changed

-   Migrate to Typescript
-   Internal: Use [`@backtrack/preset-node`](https://github.com/chrisblossom/backtrack-preset-node)
-   Update [`resolve-with-prefix`](https://github.com/chrisblossom/resolve-with-prefix)
-   Use full lodash package

## [1.0.12] - 2019-01-02

### Changed

-   Internal: Use [`backtrack`](https://github.com/chrisblossom/backtrack) to manage build environment
-   package updates

## [1.0.9] - 2018-05-17

### Fixed

-   when base config is a `function`, `options` is now an empty object

## [1.0.8] - 2018-05-15

### Fixed

-   handle base config as `function`

## [1.0.6] - 2018-05-09

### Changed

-   package updates

### Fixed

-   Updated `resolve-with-prefix`: [resolve id fix](https://github.com/chrisblossom/resolve-with-prefix/commit/6dfc4d4cd7d8a16678551496916aedc2636cf4a5)

## [1.0.5] - 2018-04-02

### Added

-   `presets` and `plugins` can now be expressed as `['PACKAGE_ID', OPTIONS]`.
-   handle es module default exports

## [1.0.4] - 2018-04-02

-   flow type updates

## [1.0.3] - 2018-03-31

### Changed

-   cherry pick lodash functions
-   refactor tests to remove normalizeRootPath

## [1.0.2] - 2018-03-18

### Changed

-   package updates
