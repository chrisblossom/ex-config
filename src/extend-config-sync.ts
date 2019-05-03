import { cloneDeep } from 'lodash';
import { extendError } from './utils/extend-error';
import { requireFromStringSync } from './utils/require-from-string';
import { ResolveFunctionSync } from './utils/get-resolve-function';
import { ContextSync } from './utils/get-context';
import { BasicConfig } from './types';
import { parseKeysSync } from './parse-keys-sync';

interface Args {
    baseConfig: BasicConfig;
    packageIds: string | ReadonlyArray<string>;
    resolveFunction: ResolveFunctionSync;
    dirname: string;
    context: ContextSync;
}

function extendConfigSync({
    baseConfig,
    packageIds,
    resolveFunction,
    dirname,
    context,
}: Args): BasicConfig {
    const api = context.api;
    const normalizedPackageIds = Array.isArray(packageIds)
        ? packageIds
        : [packageIds];

    let extendedConfig = baseConfig;

    for (const packageId of normalizedPackageIds) {
        const {
            module: LoadedConfig,
            dirname: updatedDirname,
            pathname,
        } = requireFromStringSync({
            pkg: packageId,
            resolveFunction,
            dirname,
            api,
        });

        let mergeLoadedConfig = cloneDeep(LoadedConfig);
        try {
            if (context.preprocessor) {
                mergeLoadedConfig = context.preprocessor({
                    config: extendedConfig,
                    value: mergeLoadedConfig,
                    dirname: updatedDirname,
                    api,
                });
            }

            /**
             * Validate config before merging
             */
            if (context.validator) {
                context.validator({
                    value: mergeLoadedConfig,
                    config: extendedConfig,
                    dirname: updatedDirname,
                    api,
                });
            }
        } catch (error) {
            // eslint-disable-next-line no-useless-concat
            const message = '\n' + `invalid nested config: ${pathname}`;

            extendError({ error, pathname, message });

            throw error;
        }

        extendedConfig = parseKeysSync({
            baseConfig: extendedConfig,
            config: mergeLoadedConfig,
            dirname: updatedDirname,
            packagePath: pathname,
            context,
        });
    }

    return extendedConfig;
}

export { extendConfigSync };
