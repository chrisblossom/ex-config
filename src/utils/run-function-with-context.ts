import {
	BasicConfig,
	ConfigAsync,
	ConfigFunctionParameters,
	ConfigSync,
} from '../types';

async function runFunctionWithContextAsync(
	config: ConfigAsync,
	context: ConfigFunctionParameters,
): Promise<BasicConfig> {
	if (typeof config === 'function') {
		const basicConfig = await config(context);

		return basicConfig;
	}

	return config;
}

function runFunctionWithContextSync(
	config: ConfigSync,
	context: ConfigFunctionParameters,
): BasicConfig {
	if (typeof config === 'function') {
		const basicConfig = config(context);

		return basicConfig;
	}

	return config;
}

export { runFunctionWithContextAsync, runFunctionWithContextSync };
