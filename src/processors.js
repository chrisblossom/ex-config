/* @flow */

import mergeWith from 'lodash.mergewith';
import isPlainObject from 'lodash.isplainobject';

import type { Args, Processor } from './ex-config';

function arrayPush(args: Args) {
    const { value, current = [] } = args;

    const toArray = Array.isArray(value) ? value : [value];

    return [...current, ...toArray];
}

function arrayConcat(args: Args) {
    const { value, current = [] } = args;
    const toArray = Array.isArray(value) ? value : [value];

    return [...toArray, ...current];
}

function mergeDeep(args: Args) {
    const { value, current = {}, dirname } = args;
    const val = Array.isArray(value) ? value : [value];

    return mergeWith(current, ...val, (objValue, srcValue) => {
        if (Array.isArray(objValue)) {
            return objValue.concat(srcValue);
        }

        if (isPlainObject(objValue)) {
            return mergeDeep({ value: objValue, current: srcValue, dirname });
        }

        return srcValue;
    });
}

function automatic(args: Args) {
    const { value, current, dirname } = args;
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

function getProcessor(parser: Processor | string = 'automatic'): Processor {
    if (typeof parser === 'function') {
        return parser;
    }

    const matched = parsers[parser];

    return matched;
}

export { getProcessor, automatic, arrayConcat, arrayPush, mergeDeep };
