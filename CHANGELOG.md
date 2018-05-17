# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]

### Fixed

*   when base config is a `function`, `options` is now an empty object

## [1.0.8] - 2018-05-15

### Fixed

*   handle base config as `function`

## [1.0.6] - 2018-05-09

### Changed

*   package updates

### Fixed

*   Updated `resolve-with-prefix`: [resolve id fix](https://github.com/chrisblossom/resolve-with-prefix/commit/6dfc4d4cd7d8a16678551496916aedc2636cf4a5)

## [1.0.5] - 2018-04-02

### Added

*   `presets` and `plugins` can now be expressed as `['PACKAGE_ID', OPTIONS]`.
*   handle es module default exports

## [1.0.4] - 2018-04-02

*   flow type updates

## [1.0.3] - 2018-03-31

### Changed

*   cherry pick lodash functions
*   refactor tests to remove normalizeRootPath

## [1.0.2] - 2018-03-18

### Changed

*   package updates
