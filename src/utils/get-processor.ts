import { mergeWith, isPlainObject } from 'lodash';
import { LifecycleParams, Processor } from '../ex-config';

function arrayPush({ value, current = [] }: LifecycleParams) {
    const toArray = Array.isArray(value) ? value : [value];

    return [...current, ...toArray];
}

function arrayConcat({ value, current = [] }: LifecycleParams) {
    const toArray = Array.isArray(value) ? value : [value];

    return [...toArray, ...current];
}

function mergeDeep({ config, value, current = {}, dirname }: LifecycleParams) {
    const val = Array.isArray(value) ? value : [value];

    return mergeWith(current, ...val, <N, S>(objValue: N, srcValue: S) => {
        if (Array.isArray(objValue)) {
            return objValue.concat(srcValue);
        }

        if (isPlainObject(objValue)) {
            return mergeDeep({
                config,
                value: objValue,
                current: srcValue,
                dirname,
            });
        }

        return srcValue;
    });
}

function automatic({ config, value, current, dirname }: LifecycleParams) {
    if (current === undefined) {
        return value;
    }

    if (isPlainObject(current)) {
        return mergeDeep({ config, current, value, dirname });
    }

    if (Array.isArray(current)) {
        return arrayPush({ config, current, value, dirname });
    }

    return value;
}

const builtInProcessors = { automatic, arrayConcat, arrayPush, mergeDeep };
export type builtInProcessors =
    | 'automatic'
    | 'arrayConcat'
    | 'arrayPush'
    | 'mergeDeep';

function getProcessor(
    processor: Processor | builtInProcessors = 'automatic',
): Processor {
    if (typeof processor === 'function') {
        return processor;
    }

    const matched = builtInProcessors[processor];

    return matched;
}

export { getProcessor, automatic, arrayConcat, arrayPush, mergeDeep };
