import path from 'path';
import {
	ResolveFunctionAsync,
	ResolveFunctionSync,
} from './get-resolve-function';
import { extendError } from './extend-error';
import { Api, ConfigFunctionParameters } from '../types';
import {
	runFunctionWithContextAsync,
	runFunctionWithContextSync,
} from './run-function-with-context';

type RequireFromString = {
	module: any;
	dirname: string;
	pathname: string;
};

function interopRequireDefault(packagePath: string) {
	const module = require(packagePath);

	/**
	 * Handle ES Modules
	 */
	if (typeof module === 'object' && module.__esModule) {
		if (module.default) {
			return module.default;
		}

		throw new Error(
			`${packagePath} must use export default with es modules`,
		);
	}

	return module;
}

async function requireFromStringAsync(
	pkg: string | ReadonlyArray<string>,
	resolveFunction: ResolveFunctionAsync,
	dirname: string,
	api: Api,
): Promise<RequireFromString> {
	const [
		packageId,
		options = {},
	] = Array.isArray(pkg) ? pkg : [pkg];

	try {
		const packagePath = await resolveFunction(packageId, { dirname });
		const { dir: updatedDirname } = path.parse(packagePath);

		const module = interopRequireDefault(packagePath);

		const context: ConfigFunctionParameters = {
			options,
			dirname,
			api,
		};

		const config = await runFunctionWithContextAsync(module, context);

		const result: RequireFromString = {
			module: config,
			dirname: updatedDirname,
			pathname: packagePath,
		};

		return result;
	} catch (unsafeError: unknown) {
		const error = unsafeError as Error;
		extendError({ error, pathname: dirname });
		throw error;
	}
}

interface RequireFromStringSyncParameters {
	pkg: string | ReadonlyArray<string>;
	resolveFunction: ResolveFunctionSync;
	dirname: string;
	api: Api;
}

function requireFromStringSync({
	pkg,
	resolveFunction,
	dirname,
	api,
}: RequireFromStringSyncParameters): RequireFromString {
	const [
		packageId,
		options = {},
	] = Array.isArray(pkg) ? pkg : [pkg];

	try {
		const packagePath = resolveFunction(packageId, { dirname });
		const { dir: updatedDirname } = path.parse(packagePath);

		const module = interopRequireDefault(packagePath);

		const context: ConfigFunctionParameters = {
			options,
			dirname,
			api,
		};

		const config = runFunctionWithContextSync(module, context);

		const result: RequireFromString = {
			module: config,
			dirname: updatedDirname,
			pathname: packagePath,
		};

		return result;
	} catch (unsafeError) {
		const error = unsafeError as Error;
		extendError({ error, pathname: dirname });
		throw error;
	}
}

export { requireFromStringAsync, requireFromStringSync };
