import { cloneDeep } from 'lodash';
import { extendError } from './utils/extend-error';
import { requireFromString } from './utils/require-from-string';
import { ResolveFunction } from './utils/get-resolve-function';
import { Context } from './utils/get-context';
import { Config } from './ex-config';
import { parseKeys } from './parse-keys';

interface Args {
    baseConfig: Config;
    packageIds: string | ReadonlyArray<string>;
    resolveFunction: ResolveFunction;
    dirname: string;
    context: Context;
}

function extendConfig({
    baseConfig,
    packageIds,
    resolveFunction,
    dirname,
    context,
}: Args): Config {
    const normalizedPackageIds = Array.isArray(packageIds)
        ? packageIds
        : [packageIds];

    let extendedConfig = baseConfig;

    for (const packageId of normalizedPackageIds) {
        const {
            module: LoadedConfig,
            dirname: updatedDirname,
            pathname,
        } = requireFromString(packageId, resolveFunction, dirname);

        let mergeLoadedConfig = cloneDeep(LoadedConfig);
        try {
            if (context.preprocessor) {
                mergeLoadedConfig = context.preprocessor({
                    config: extendedConfig,
                    value: mergeLoadedConfig,
                    dirname: updatedDirname,
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
                });
            }
        } catch (error) {
            // eslint-disable-next-line no-useless-concat
            const message = '\n' + `invalid nested config: ${pathname}`;

            extendError({ error, pathname, message });

            throw error;
        }

        extendedConfig = parseKeys({
            baseConfig: extendedConfig,
            config: mergeLoadedConfig,
            dirname: updatedDirname,
            packagePath: pathname,
            context,
        });
    }

    return extendedConfig;
}

export { extendConfig };
