/* @flow */

/* eslint-disable no-useless-concat,no-nested-ternary */

import path from 'path';
import cloneDeep from 'lodash.clonedeep';
import ResolveWithPrefix, { type Resolve } from 'resolve-with-prefix';
import type { ResolveWithPrefixOptions as PrefixOptions } from 'resolve-with-prefix';
import { generateResolveValidator, validateResolveKeys } from './validate';
import { extendError } from './extend-error';
import { getProcessor } from './processors';

// eslint-disable-next-line flowtype/require-exact-type
export type Config = {};
export type ResolveSchema = Object | null;

export type Args = $Shape<{
    // actionable item
    value: any,
    // current value of actionable item
    current?: any,
    // current full config
    config?: any,
    // current config directory
    dirname: string,
}>;

export type RequireArgs = {|
    options: any,
    dirname: string,
|};

type Validator = (args: Args) => void;
type PostProcessor = (args: Args) => any;
type Preprocessor = (args: Args) => any;
export type Processor = (args: Args) => any;

export type Overrides = $Shape<{
    resolve?: PrefixOptions,
    processor?: Processor | string,
    validator?: Validator,
    preprocessor?: Preprocessor,
}>;

type Options = $Shape<{
    presets?: string | false,
    plugins?: string | false,
    preprocessor?: Preprocessor,
    processor?: Processor | string,
    validator?: Validator,
    postProcessor?: PostProcessor,
    overrides?: { [key: string]: Overrides },
}>;

class ExConfig {
    presets: string | false;
    plugins: string | false;
    config: Config;
    resolve: { [key: string]: Resolve };
    processor: Processor;
    validator: ?Validator;
    preprocessor: ?Preprocessor;
    postProcessor: ?PostProcessor;
    overrides: { [key: string]: Overrides };
    resolveSchema: ResolveSchema;
    loaded: boolean;

    constructor(options?: Options = {}) {
        this.presets = options.presets
            ? options.presets
            : options.presets === undefined
            ? 'presets'
            : false;

        this.plugins = options.plugins
            ? options.plugins
            : options.plugins === undefined
            ? 'plugins'
            : false;

        this.overrides = options.overrides || {};
        this.processor = getProcessor(options.processor);
        this.validator = options.validator;
        this.preprocessor = options.preprocessor;
        this.postProcessor = options.postProcessor;
        this.resolve = {};
        this.resolveSchema = generateResolveValidator(
            this.presets,
            this.plugins,
        );
        this.loaded = false;
    }

    getResolveFn(key: string, prefixOptions: PrefixOptions) {
        let resolve = this.resolve[key];
        if (!resolve) {
            this.resolve[key] = new ResolveWithPrefix(prefixOptions);

            resolve = this.resolve[key];
        }

        return resolve;
    }

    static require(
        pkg: string | $ReadOnlyArray<*>,
        resolve: Resolve,
        dirname: string,
    ) {
        const [packageId, options = {}] = Array.isArray(pkg) ? pkg : [pkg];

        try {
            const packagePath = resolve(packageId, { dirname });
            const { dir: updatedDirname } = path.parse(packagePath);

            let module = require(packagePath);

            /**
             * Handle ES Modules
             */
            if (typeof module === 'object' && module.__esModule) {
                if (module.default) {
                    module = module.default;
                } else {
                    throw new Error(
                        `${packagePath} must use export default with es modules`,
                    );
                }
            }

            if (typeof module === 'function') {
                const args: RequireArgs = {
                    options,
                    dirname,
                };

                module = module(args);
            }

            return {
                module,
                dirname: updatedDirname,
                pathname: packagePath,
            };
        } catch (error) {
            extendError(error, dirname);
            throw error;
        }
    }

    /**
     * Load is only called once. Setup configuration here
     */
    load(config: {}, dirname?: string = process.cwd()): any {
        if (this.loaded === true) {
            return this.config;
        }

        let cfg = config;
        if (typeof config === 'function') {
            const args: RequireArgs = {
                options: {},
                dirname,
            };

            cfg = config(args);
        }
        /**
         * Prevent original config from being mutated to guard against external caching issues
         */
        cfg = cloneDeep(cfg);

        if (this.preprocessor) {
            try {
                cfg = this.preprocessor({ value: cfg, dirname });
            } catch (error) {
                extendError(error, dirname);
                throw error;
            }
        }

        /**
         * Validate base config
         */
        if (this.validator) {
            this.validator({ value: cfg, dirname });
        }

        if (this.config === undefined) {
            this.config = {};
        }

        this.sort(cfg, dirname);

        if (this.postProcessor) {
            try {
                this.config = this.postProcessor({
                    value: this.config,
                    dirname,
                });
            } catch (error) {
                extendError(error, dirname);
                throw error;
            }
        }

        this.loaded = true;

        return this.config;
    }

    /**
     * Handle extendable configs
     */
    sort(config: {}, dirname: string, packagePath?: string) {
        validateResolveKeys(config, this.resolveSchema, packagePath);

        /**
         * Handle presets first so object-key order does not matter
         */
        if (this.presets && config[this.presets]) {
            const presets = config[this.presets];

            // eslint-disable-next-line no-param-reassign
            delete config[this.presets];

            const overrides: Overrides = this.overrides[this.presets] || {};
            const resolve = this.getResolveFn(this.presets, overrides.resolve);

            this.extend(presets, resolve, dirname);
        }

        for (const key of Object.keys(config)) {
            let value = config[key];
            const previousValue = this.config[key];
            const overrides = this.overrides[key] || {};

            const errorMessage = '\n' + `invalid key: ${key}`;

            if (overrides.preprocessor) {
                try {
                    value = overrides.preprocessor({
                        value,
                        current: previousValue,
                        config: this.config,
                        dirname,
                    });
                } catch (error) {
                    error.message += errorMessage;

                    extendError(error);

                    throw error;
                }
            }

            /**
             * Handle extendable configurations. Typically key extends or presets
             */
            try {
                /**
                 * Handle non-extendable packageIds. Typically a plugin
                 */
                if (this.plugins === key) {
                    const toArray = Array.isArray(value) ? value : [value];
                    const resolve = this.getResolveFn(key, overrides.resolve);

                    value = toArray.map((packageId) => {
                        const { module } = ExConfig.require(
                            packageId,
                            resolve,
                            dirname,
                        );

                        return cloneDeep(module);
                    });
                }

                if (overrides.validator) {
                    overrides.validator({
                        value,
                        current: previousValue,
                        config: this.config,
                        dirname,
                    });
                }

                this.parse(key, value, dirname);
            } catch (error) {
                error.message += errorMessage;

                extendError(error, packagePath);

                throw error;
            }
        }
    }

    /**
     * Handle extendable configs
     */
    extend(
        packageIds: string | $ReadOnlyArray<string>,
        resolve: Resolve,
        dirname: string,
    ) {
        const toArray = Array.isArray(packageIds) ? packageIds : [packageIds];

        toArray.forEach((packageId) => {
            const {
                module,
                dirname: updatedDirname,
                pathname,
            } = ExConfig.require(packageId, resolve, dirname);

            let config = cloneDeep(module);
            try {
                if (this.preprocessor) {
                    config = this.preprocessor({
                        value: config,
                        config: this.config,
                        dirname: updatedDirname,
                    });
                }

                /**
                 * Validate config before merging
                 */
                if (this.validator) {
                    this.validator({
                        value: config,
                        config: this.config,
                        dirname: updatedDirname,
                    });
                }
            } catch (error) {
                const message = '\n' + `invalid nested config: ${pathname}`;

                extendError(error, pathname, message);

                throw error;
            }

            this.sort(config, updatedDirname, pathname);
        });
    }

    /**
     * Parse new value into old value
     */
    parse(key: string, value: *, dirname: string) {
        const processor =
            this.overrides[key] && this.overrides[key].processor
                ? getProcessor(this.overrides[key].processor)
                : this.processor;

        const currentValue = this.config[key];
        const parsed = processor({
            value,
            current: currentValue,
            config: this.config,
            dirname,
        });

        this.config[key] = parsed;
    }
}

// eslint-disable-next-line import/no-default-export
export default ExConfig;
