/* eslint-disable no-useless-concat,no-nested-ternary */

import path from 'path';
import { cloneDeep } from 'lodash';
import {
    createResolverSync,
    resolveWithPrefixSync,
    PrefixOptions,
} from 'resolve-with-prefix';
import {
    generateResolveValidator,
    validateResolveKeys,
    ResolveSchema,
} from './validate';
import { extendError } from './extend-error';
import { getProcessor, Parsers } from './processors';

export type Config = { [key: string]: any };

export type Context = {
    // actionable item
    value: any;
    // current value of actionable item
    current?: any;
    // current full config
    config?: Config;
    // current config directory
    dirname: string;
};

export type RequireContext = {
    options: any;
    dirname: string;
};

export type Validator = (context: Context) => void;
export type PostProcessor = (context: Context) => Config;
export type Preprocessor = (context: Context) => Config;
export type Processor = (context: Context) => any;

export type Overrides = {
    resolve?: PrefixOptions;
    processor?: Processor | Parsers;
    validator?: Validator;
    preprocessor?: Preprocessor;
};

type ResolveFn = typeof resolveWithPrefixSync;

type Options = {
    presets?: string | false;
    plugins?: string | false;
    preprocessor?: Preprocessor;
    processor?: Processor | Parsers;
    validator?: Validator;
    postProcessor?: PostProcessor;
    overrides?: { [key: string]: Overrides };
};

class ExConfig {
    private readonly presets: string | false;
    private readonly plugins: string | false;
    private readonly resolve: { [key: string]: ResolveFn };
    private readonly processor: Processor;
    private readonly validator?: Validator;
    private readonly preprocessor?: Preprocessor;
    private readonly postProcessor?: PostProcessor;
    private readonly overrides: { [key: string]: Overrides };
    private readonly resolveSchema: ResolveSchema;
    private config: Config;
    private loaded: boolean;

    constructor(options: Options = {}) {
        // prettier-ignore
        this.presets = options.presets
            ? options.presets
            : options.presets === undefined
                ? 'presets'
                : false;

        // prettier-ignore
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

        this.config = {};
        this.loaded = false;
    }

    private getResolveFn(key: string, prefixOptions?: PrefixOptions) {
        let resolve = this.resolve[key];

        if (resolve === undefined) {
            this.resolve[key] = createResolverSync(prefixOptions);

            resolve = this.resolve[key];
        }

        return resolve;
    }

    private static require(
        pkg: string | ReadonlyArray<string>,
        resolve: ResolveFn,
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
                const context: RequireContext = {
                    options,
                    dirname,
                };

                module = module(context);
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

    // Load is only called once. Setup configuration here
    load(config: Config, dirname: string = process.cwd()): Config {
        if (this.loaded === true) {
            return this.config;
        }

        let cfg = config;
        if (typeof config === 'function') {
            const args: RequireContext = {
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

    private sort(config: Config, dirname: string, packagePath?: string) {
        validateResolveKeys(config, this.resolveSchema, packagePath);

        /**
         * Handle presets first so object-key order does not matter
         */
        if (this.presets && config[this.presets]) {
            const presets: string | ReadonlyArray<string> =
                config[this.presets];

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

    private extend(
        packageIds: string | ReadonlyArray<string>,
        resolve: ResolveFn,
        dirname: string,
    ) {
        const normalizedPackageIds = Array.isArray(packageIds)
            ? packageIds
            : [packageIds];
        for (const packageId of normalizedPackageIds) {
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
        }
    }

    // Parse new value into old value
    private parse(key: string, value: unknown, dirname: string) {
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

export default ExConfig;
