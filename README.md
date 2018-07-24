# ex-config

[![npm](https://img.shields.io/npm/v/ex-config.svg?label=npm%20version)](https://www.npmjs.com/package/ex-config)
[![Linux Build Status](https://img.shields.io/circleci/project/github/chrisblossom/ex-config/master.svg?label=linux%20build)](https://circleci.com/gh/chrisblossom/ex-config/tree/master)
[![Windows Build Status](https://img.shields.io/appveyor/ci/chrisblossom/ex-config/master.svg?label=windows%20build)](https://ci.appveyor.com/project/chrisblossom/ex-config/branch/master)
[![Code Coverage](https://img.shields.io/codecov/c/github/chrisblossom/ex-config/master.svg)](https://codecov.io/gh/chrisblossom/ex-config/branch/master)

## About

ex-config is an extendable configuration processor. It is used to merge multiple configurations together like [babel](https://github.com/babel/babel/) and [eslint](https://github.com/eslint/eslint/) configurations do.

## Installation

`npm install --save ex-config`

## Usage

```js
'use strict';

const cosmiconfig = require('cosmiconfig');
const ExConfig = require('ex-config');

/**
 * Original configs are not mutated
 *
 * all options are optional
 *
 * preprocessor, validator, processor, and postProcessor lifecycles all
 *   are given one argument object containing:
 * {
 *   value: new value
 *   current: current value, can be undefined
 *   config: current config, can be undefined
 *   dirname: directory where the preset was loaded from
 * }
 */
const exConfig = new ExConfig({
    /**
     * key id that extends configurations via resolve
     * See also, overrides.presets.resolve
     *
     * default: 'presets'
     * set to false to disable
     */
    presets: 'presets',

    /**
     * key id that resolves plugins
     *
     * default: 'plugins'
     * set to false to disable
     */
    plugins: 'plugins',

    /**
     * Pre-process the preset before validation
     *
     * Whatever is returned will be the new value of the current preset
     *
     * Runs once with each preset
     */
    preprocessor: ({ value, current, config, dirname }) => {
        // returned value will be the updated preset value
        return value;
    },

    /**
     * Used to validate a preset. if preset is invalid, throw with an error
     *
     * Runs once with each preset
     */
    validator: ({ value, current, config, dirname }) => {
        if (value !== 'valid') {
            throw new Error('value is invalid');
        }

        // does not expect a return value
        return undefined;
    },

    /**
     * Post Processor runs once after all configurations
     *   have been successfully processed.
     */
    postProcessor: ({ value, dirname }) => {
        // returned value will equal the final config
        return value;
    },

    /**
     * processor runs once per key per preset
     *
     * used merge the value with the overall current value
     *
     * by default, this will deep merge any objects,
     *   push new value onto array, or replace current value
     *
     * other built-in processors are:
     * arrayPush: all values are an array that are appended
     *   to the end of the current array
     *
     * arrayConcat: all values are an array that are added
     *   to the front of the current array
     *
     * mergeDeep: all values are treated as an object
     *
     * Pass a function to use a custom processor
     */
    processor: ({ value, current = [], config, dirname }) => {
        const val = Array.isArray(value) ? value : [value];

        // returned value will be the new value of the key
        return [...current, ...val];
    },

    /**
     * overrides can override/change the settings above
     */
    overrides: {
        presets: {
            resolve: {
                /**
                 * Prefix to add to packageId
                 *
                 * example: one -> example-preset-one
                 *
                 * Optional
                 *
                 * Accepts a single or an array of prefixes
                 */
                prefix: 'example-preset',

                /**
                 * NPM Scope of organization to override prefix
                 *
                 * Optional
                 */
                org: '@example',

                /**
                 * Org prefixes
                 *
                 * example: @example/one -> @example/preset-one
                 *
                 * Optional
                 *
                 * Accepts a single or an array of prefixes
                 */
                orgPrefix: 'preset',

                /**
                 * Only allow prefixed module resolution.
                 * Explicit modules can be required by prepending module:
                 * For example, module:local-module
                 *
                 * Default: true
                 * Optional
                 */
                strict: true,
            },
        },

        files: {
            /**
             * preprocessor override is in addition to the base preprocessor
             */
            preprocessor: ({ value, current, config, dirname }) => {
                return value;
            },

            /**
             * validator override will validate in addition to the base validator
             */
            validator: ({ value, current, config, dirname }) => {
                if (typeof value.source !== 'string') {
                    throw new Error('files source must be a string');
                }
            },

            /**
             * processor override will override the base processor
             */
            processor: ({ value, current = [], config, dirname }) => {
                const val = Array.isArray(value) ? value : [value];

                return [...val, ...current];
            },
        },
    },
});

/**
 * Example using cosmiconfig to load the base config from disk
 */
const explorer = cosmiconfig('example', {
    rcExtensions: true,
    sync: true,
});
const config = explorer.load();

const result = exConfig.load(config);

module.exports = result;
```

## Creating Presets and Plugins

A `preset` or `plugin` needs to export an `object` or `function`.

Only `export default` is supported when using es modules.

If a `function` is used it will be invoked with the following argument:

```js
// config.js
const exampleConfig = {
    presets: [
        [
            // packageId
            'presetExample',
            // options for preset/plugin
            { verbose: true },
        ],
    ],
};

module.exports = exampleConfig;

// preset-example.js
function presetExample(args) {
    // options given as second index when calling preset/plugin
    const options = args.options;
    // dirname package was found from
    const dirname = args.dirname;

    return {
        verbose: options.verbose,
    };
}

module.exports = presetExample;
```

## Thanks To

This package was created with the great work / lessons learned from:

-   [babel](https://github.com/babel/babel/)
-   [eslint](https://github.com/eslint/eslint)
