# ex-config

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

## Thanks To

This package was created with the great work / lessons learned from:

* [babel](https://github.com/babel/babel/)
* [eslint](https://github.com/eslint/eslint)
