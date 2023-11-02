import { cloneDeep } from 'lodash';
import { requireFromStringAsync } from './utils/require-from-string';
import { getResolveFunctionAsync } from './utils/get-resolve-function';
import { validateResolveKeys } from './utils/validation-utils';
import { extendError } from './utils/extend-error';
import { BasicConfig, OverridesAsync } from './types';
import { ContextAsync } from './utils/get-context';
import { extendConfigAsync } from './extend-config-async';
import { getProcessorAsync } from './utils/get-processor';

interface Args {
	baseConfig: BasicConfig;
	config: BasicConfig;
	dirname: string;
	packagePath?: string;
	context: ContextAsync;
}

async function parseKeysAsync({
	baseConfig,
	config,
	dirname,
	packagePath,
	context,
}: Args): Promise<BasicConfig> {
	validateResolveKeys(config, context.resolveSchema, packagePath);

	let currentConfig = baseConfig;

	const api = context.api;

	/**
	 * Handle presets first so object-key order does not matter
	 */
	if (context.presets && config[context.presets]) {
		const presets: string | ReadonlyArray<string> = config[context.presets];

		/* eslint-disable no-param-reassign */
		delete config[context.presets];
		/* eslint-enable */

		const overrides: OverridesAsync =
			context.overrides[context.presets] || {};
		const resolveFunction = getResolveFunctionAsync({
			key: context.presets,
			prefixOptions: overrides.resolve,
			context,
		});

		currentConfig = await extendConfigAsync({
			baseConfig: currentConfig,
			packageIds: presets,
			resolveFunction,
			dirname,
			context,
		});
	}

	for await (const key of Object.keys(config)) {
		let value = config[key];
		const previousValue = currentConfig[key];
		const overrides = context.overrides[key] || {};

		// eslint-disable-next-line no-useless-concat
		const errorMessage = '\n' + `invalid key: ${key}`;

		if (overrides.preprocessor) {
			try {
				value = await overrides.preprocessor({
					value,
					current: previousValue,
					config: currentConfig,
					dirname,
					api,
				});
			} catch (unsafeError: unknown) {
				const error = unsafeError as Error;
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
				const resolve = getResolveFunctionAsync({
					key,
					prefixOptions: overrides.resolve,
					context,
				});

				value = [];
				for await (const packageId of normalizedPluginValue) {
					const { module: plugin } = await requireFromStringAsync(
						packageId,
						resolve,
						dirname,
						api,
					);

					value.push(cloneDeep(plugin));
				}
			}

			if (overrides.validator) {
				await overrides.validator({
					value,
					current: previousValue,
					config: currentConfig,
					dirname,
					api,
				});
			}

			/**
			 * run processor on value
			 */
			const processor =
				context.overrides[key] && context.overrides[key].processor
					? getProcessorAsync(context.overrides[key].processor)
					: context.processor;

			const currentValue = currentConfig[key];

			const processedValue = await processor({
				value,
				current: currentValue,
				config,
				dirname,
				api,
			});

			currentConfig[key] = processedValue;
		} catch (unsafeError: unknown) {
			const error = unsafeError as Error;
			error.message += errorMessage;
			extendError({ error, pathname: packagePath });
			throw error;
		}
	}

	return currentConfig;
}

export { parseKeysAsync };
