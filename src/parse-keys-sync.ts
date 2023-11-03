import cloneDeep from 'lodash.clonedeep';
import { requireFromStringSync } from './utils/require-from-string';
import { getResolveFunctionSync } from './utils/get-resolve-function';
import { validateResolveKeys } from './utils/validation-utils';
import { extendError } from './utils/extend-error';
import { BasicConfig, OverridesSync } from './types';
import { ContextSync } from './utils/get-context';
import { extendConfigSync } from './extend-config-sync';
import { getProcessorSync } from './utils/get-processor';

interface Args {
	baseConfig: BasicConfig;
	config: BasicConfig;
	dirname: string;
	packagePath?: string;
	context: ContextSync;
}

function parseKeysSync({
	baseConfig,
	config,
	dirname,
	packagePath,
	context,
}: Args): BasicConfig {
	validateResolveKeys(config, context.resolveSchema, packagePath);

	let currentConfig = baseConfig;

	const api = context.api;

	/**
	 * Handle presets first so object-key order does not matter
	 */
	if (context.presets && config[context.presets]) {
		const presets: string | ReadonlyArray<string> = config[context.presets];

		// eslint-disable-next-line @typescript-eslint/no-dynamic-delete,no-param-reassign
		delete config[context.presets];

		const overrides: OverridesSync =
			context.overrides[context.presets] || {};
		const resolveFunction = getResolveFunctionSync({
			key: context.presets,
			prefixOptions: overrides.resolve,
			context,
		});

		currentConfig = extendConfigSync({
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
				const resolve = getResolveFunctionSync({
					key,
					prefixOptions: overrides.resolve,
					context,
				});

				value = [];
				for (const packageId of normalizedPluginValue) {
					const { module: plugin } = requireFromStringSync({
						pkg: packageId,
						resolveFunction: resolve,
						dirname,
						api,
					});

					// eslint-disable-next-line @typescript-eslint/no-unsafe-call
					value.push(cloneDeep(plugin));
				}
			}

			if (overrides.validator) {
				overrides.validator({
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
			const processor = context.overrides[key]?.processor
				? getProcessorSync(context.overrides[key].processor)
				: context.processor;

			const currentValue = currentConfig[key];
			const processedValue = processor({
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

export { parseKeysSync };
