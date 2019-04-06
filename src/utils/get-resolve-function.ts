import {
    resolveWithPrefixSync,
    createResolverSync,
    PrefixOptions,
} from 'resolve-with-prefix';
import { Context } from './get-context';

interface Args {
    key: string;
    prefixOptions?: PrefixOptions;
    context: Context;
}

function getResolveFunction({
    key,
    prefixOptions,
    context,
}: Args): typeof resolveWithPrefixSync {
    let resolve = context.resolve[key];

    if (resolve === undefined) {
        // eslint-disable-next-line no-param-reassign
        context.resolve[key] = createResolverSync(prefixOptions);

        resolve = context.resolve[key];
    }

    return resolve;
}

export type ResolveFunction = ReturnType<typeof getResolveFunction>;

export { getResolveFunction };
