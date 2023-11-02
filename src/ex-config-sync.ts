import { cloneDeep } from 'lodash';
import {
	ConfigSync,
	BasicConfig,
	ConfigFunctionParameters,
	OptionsSync,
} from './types';
import { getContextSync } from './utils/get-context';
import { extendError } from './utils/extend-error';
import { parseKeysSync } from './parse-keys-sync';
import { runFunctionWithContextSync } from './utils/run-function-with-context';

function exConfigSync(
	config: ConfigSync,
	options: OptionsSync = {},
): BasicConfig {
	if (config === undefined) {
		throw new Error('config is required');
	}

	const { baseDirectory = process.cwd(), ...opts } = options;

	const dirname = baseDirectory;

	const context = getContextSync(opts);
	const api = context.api;

	const args: ConfigFunctionParameters = {
		options: {},
		dirname,
		api,
	};

	let cfg = runFunctionWithContextSync(config, args);

	/**
	 * Prevent original config from being mutated to guard against external caching issues
	 */
	cfg = cloneDeep(cfg);

	if (context.preprocessor) {
		try {
			cfg = context.preprocessor({
				value: cfg,
				config: cfg,
				dirname,
				api,
			});
		} catch (unsafeError: unknown) {
			const error = unsafeError as Error;
			extendError({ error, pathname: dirname });
			throw error;
		}
	}

	/**
	 * Validate base config
	 */
	if (context.validator) {
		context.validator({ value: cfg, config: cfg, dirname, api });
	}

	cfg = parseKeysSync({ baseConfig: {}, config: cfg, dirname, context });

	if (opts.postProcessor) {
		try {
			cfg = opts.postProcessor({
				value: cfg,
				config: cfg,
				dirname,
				api,
			});
		} catch (unsafeError: unknown) {
			const error = unsafeError as Error;
			extendError({ error, pathname: dirname });
			throw error;
		}
	}

	return cfg;
}

export { exConfigSync };
