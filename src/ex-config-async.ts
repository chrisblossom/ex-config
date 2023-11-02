import { cloneDeep } from 'lodash';
import {
	ConfigAsync,
	BasicConfig,
	ConfigFunctionParameters,
	OptionsAsync,
} from './types';
import { getContextAsync } from './utils/get-context';
import { extendError } from './utils/extend-error';
import { parseKeysAsync } from './parse-keys-async';
import { runFunctionWithContextAsync } from './utils/run-function-with-context';

async function exConfigAsync(
	config: ConfigAsync,
	options: OptionsAsync = {},
): Promise<BasicConfig> {
	if (config === undefined) {
		throw new Error('config is required');
	}

	const { baseDirectory = process.cwd(), ...opts } = options;

	const dirname = baseDirectory;

	const context = getContextAsync(opts);

	const api = context.api;

	const args: ConfigFunctionParameters = {
		options: {},
		dirname,
		api,
	};

	let cfg = await runFunctionWithContextAsync(config, args);

	/**
	 * Prevent original config from being mutated to guard against external caching issues
	 */
	cfg = cloneDeep(cfg);

	if (context.preprocessor) {
		try {
			cfg = await context.preprocessor({
				value: cfg,
				config: cfg,
				dirname,
				api,
			});
		} catch (error) {
			extendError({ error, pathname: dirname });
			throw error;
		}
	}

	/**
	 * Validate base config
	 */
	if (context.validator) {
		await context.validator({ value: cfg, config: cfg, dirname, api });
	}

	cfg = await parseKeysAsync({
		baseConfig: {},
		config: cfg,
		dirname,
		context,
	});

	if (opts.postProcessor) {
		try {
			cfg = await opts.postProcessor({
				value: cfg,
				config: cfg,
				dirname,
				api,
			});
		} catch (error) {
			extendError({ error, pathname: dirname });
			throw error;
		}
	}

	return cfg;
}

export { exConfigAsync };
