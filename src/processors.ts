import { mergeWith, isPlainObject } from 'lodash';
import { Context, Processor } from './ex-config';

function arrayPush({ value, current = [] }: Context) {
    const toArray = Array.isArray(value) ? value : [value];

    return [...current, ...toArray];
}

function arrayConcat({ value, current = [] }: Context) {
    const toArray = Array.isArray(value) ? value : [value];

    return [...toArray, ...current];
}

function mergeDeep({ value, current = {}, dirname }: Context) {
    const val = Array.isArray(value) ? value : [value];

    return mergeWith(current, ...val, <N, S>(objValue: N, srcValue: S) => {
        if (Array.isArray(objValue)) {
            return objValue.concat(srcValue);
        }

        if (isPlainObject(objValue)) {
            return mergeDeep({
                value: objValue,
                current: srcValue,
                dirname,
            });
        }

        return srcValue;
    });
}

function automatic({ value, current, dirname }: Context) {
    if (current === undefined) {
        return value;
    }

    if (isPlainObject(current)) {
        return mergeDeep({ current, value, dirname });
    }

    if (Array.isArray(current)) {
        return arrayPush({ current, value, dirname });
    }

    return value;
}

const parsers = { automatic, arrayConcat, arrayPush, mergeDeep };
export type Parsers = 'automatic' | 'arrayConcat' | 'arrayPush' | 'mergeDeep';

function getProcessor(parser: Processor | Parsers = 'automatic'): Processor {
    if (typeof parser === 'function') {
        return parser;
    }

    const matched = parsers[parser];

    return matched;
}

export { getProcessor, automatic, arrayConcat, arrayPush, mergeDeep };
