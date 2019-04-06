import { cloneDeep } from 'lodash';
import { requireFromString } from './utils/require-from-string';
import { getResolveFunction } from './utils/get-resolve-function';
import { validateResolveKeys } from './utils/validation-utils';
import { extendError } from './utils/extend-error';
import { Config } from './ex-config';
import { Overrides } from './types';
import { Context } from './utils/get-context';
import { extendConfig } from './extend-config';
import { getProcessor } from './utils/get-processor';

interface Args {
    baseConfig: Config;
    config: Config;
    dirname: string;
    packagePath?: string;
    context: Context;
}

function parseKeys({
    baseConfig,
    config,
    dirname,
    packagePath,
    context,
}: Args): Config {
    validateResolveKeys(config, context.resolveSchema, packagePath);

    let currentConfig = baseConfig;

    /**
     * Handle presets first so object-key order does not matter
     */
    if (context.presets && config[context.presets]) {
        const presets: string | ReadonlyArray<string> = config[context.presets];

        /* eslint-disable no-param-reassign */
        delete config[context.presets];
        /* eslint-enable */

        const overrides: Overrides = context.overrides[context.presets] || {};
        const resolveFunction = getResolveFunction({
            key: context.presets,
            prefixOptions: overrides.resolve,
            context,
        });

        currentConfig = extendConfig({
            baseConfig: currentConfig,
            packageIds: presets,
            resolveFunction,
            dirname,
            context,
        });
    }

    for (const key of Object.keys(config)) {
        let value = config[key];
        const previousValue = currentConfig[key];
        const overrides = context.overrides[key] || {};

        // eslint-disable-next-line no-useless-concat
        const errorMessage = '\n' + `invalid key: ${key}`;

        if (overrides.preprocessor) {
            try {
                value = overrides.preprocessor({
                    value,
                    current: previousValue,
                    config: currentConfig,
                    dirname,
                });
            } catch (error) {
                error.message += errorMessage;

                extendError({ error });

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
            if (context.plugins === key) {
                const normalizedPluginValue = Array.isArray(value)
                    ? value
                    : [value];
                const resolve = getResolveFunction({
                    key,
                    prefixOptions: overrides.resolve,
                    context,
                });

                value = [];
                for (const packageId of normalizedPluginValue) {
                    const { module: plugin } = requireFromString(
                        packageId,
                        resolve,
                        dirname,
                    );

                    value.push(cloneDeep(plugin));
                }
            }

            if (overrides.validator) {
                overrides.validator({
                    value,
                    current: previousValue,
                    config: currentConfig,
                    dirname,
                });
            }

            /**
             * run processor on value
             */
            const processor =
                context.overrides[key] && context.overrides[key].processor
                    ? getProcessor(context.overrides[key].processor)
                    : context.processor;

            const currentValue = currentConfig[key];
            const processedValue = processor({
                value,
                current: currentValue,
                config,
                dirname,
            });

            currentConfig[key] = processedValue;
        } catch (error) {
            error.message += errorMessage;

            extendError({ error, pathname: packagePath });

            throw error;
        }
    }

    return currentConfig;
}

export { parseKeys };
