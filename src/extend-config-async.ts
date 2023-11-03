import cloneDeep from 'lodash.clonedeep';
import { extendError } from './utils/extend-error';
import { requireFromStringAsync } from './utils/require-from-string';
import { ResolveFunctionAsync } from './utils/get-resolve-function';
import { ContextAsync } from './utils/get-context';
import { parseKeysAsync } from './parse-keys-async';
import { BasicConfig } from './types';

interface Args {
	baseConfig: BasicConfig;
	packageIds: string | ReadonlyArray<string>;
	resolveFunction: ResolveFunctionAsync;
	dirname: string;
	context: ContextAsync;
}

async function extendConfigAsync({
	baseConfig,
	packageIds,
	resolveFunction,
	dirname,
	context,
}: Args): Promise<BasicConfig> {
	const api = context.api;
	const normalizedPackageIds = Array.isArray(packageIds)
		? packageIds
		: [packageIds];

	let extendedConfig = baseConfig;

	for await (const packageId of normalizedPackageIds) {
		const {
			module: LoadedConfig,
			dirname: updatedDirname,
			pathname,
		} = await requireFromStringAsync(
			packageId,
			resolveFunction,
			dirname,
			api,
		);

		let mergeLoadedConfig = cloneDeep(LoadedConfig);
		try {
			if (context.preprocessor) {
				mergeLoadedConfig = await context.preprocessor({
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
				await context.validator({
					value: mergeLoadedConfig,
					config: extendedConfig,
					dirname: updatedDirname,
					api,
				});
			}
		} catch (unsafeError: unknown) {
			const error = unsafeError as Error;
			// eslint-disable-next-line no-useless-concat
			const message = '\n' + `invalid nested config: ${pathname}`;
			extendError({ error, pathname, message });
			throw error;
		}

		extendedConfig = await parseKeysAsync({
			baseConfig: extendedConfig,
			config: mergeLoadedConfig,
			dirname: updatedDirname,
			packagePath: pathname,
			context,
		});
	}

	return extendedConfig;
}

export { extendConfigAsync };
