import {
	resolveWithPrefixSync,
	createResolverSync,
	resolveWithPrefix,
	createResolver,
	PrefixOptions,
} from 'resolve-with-prefix';
import { ContextSync, ContextAsync } from './get-context';

interface ArgsAsync {
	key: string;
	prefixOptions?: PrefixOptions;
	context: ContextAsync;
}

function getResolveFunctionAsync({
	key,
	prefixOptions,
	context,
}: ArgsAsync): typeof resolveWithPrefix {
	let resolve = context.resolve[key];

	if (resolve === undefined) {
		// eslint-disable-next-line no-param-reassign
		context.resolve[key] = createResolver(prefixOptions);

		resolve = context.resolve[key];
	}

	return resolve;
}

export type ResolveFunctionAsync = ReturnType<typeof getResolveFunctionAsync>;

interface ArgsSync {
	key: string;
	prefixOptions?: PrefixOptions;
	context: ContextSync;
}

function getResolveFunctionSync({
	key,
	prefixOptions,
	context,
}: ArgsSync): typeof resolveWithPrefixSync {
	let resolve = context.resolve[key];

	if (resolve === undefined) {
		// eslint-disable-next-line no-param-reassign
		context.resolve[key] = createResolverSync(prefixOptions);

		resolve = context.resolve[key];
	}

	return resolve;
}

export type ResolveFunctionSync = ReturnType<typeof getResolveFunctionSync>;

export { getResolveFunctionAsync, getResolveFunctionSync };
