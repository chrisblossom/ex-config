import { mergeWith, isPlainObject } from 'lodash';
import { LifecycleParams, ProcessorAsync, ProcessorSync } from '../types';

function arrayPush({ value, current = [] }: LifecycleParams) {
    const toArray = Array.isArray(value) ? value : [value];

    return [...current, ...toArray];
}

function arrayConcat({ value, current = [] }: LifecycleParams) {
    const toArray = Array.isArray(value) ? value : [value];

    return [...toArray, ...current];
}

function mergeDeep({ value, current = {}, ...rest }: LifecycleParams) {
    const val = Array.isArray(value) ? value : [value];

    return mergeWith(current, ...val, <N, S>(objValue: N, srcValue: S) => {
        if (Array.isArray(objValue)) {
            return objValue.concat(srcValue);
        }

        if (isPlainObject(objValue)) {
            return mergeDeep({
                value: objValue,
                current: srcValue,
                ...rest,
            });
        }

        return srcValue;
    });
}

function automatic(lifecycleParams: LifecycleParams) {
    const { current, value } = lifecycleParams;
    if (current === undefined) {
        return value;
    }

    if (isPlainObject(current)) {
        return mergeDeep(lifecycleParams);
    }

    if (Array.isArray(current)) {
        return arrayPush(lifecycleParams);
    }

    return value;
}

const builtInProcessors = { automatic, arrayConcat, arrayPush, mergeDeep };
export type BuiltInProcessors =
    | 'automatic'
    | 'arrayConcat'
    | 'arrayPush'
    | 'mergeDeep';

function getProcessor(
    processor: ProcessorAsync | ProcessorSync | BuiltInProcessors,
) {
    if (typeof processor === 'function') {
        return processor;
    }

    const matched = builtInProcessors[processor];

    return matched;
}

function getProcessorAsync(
    processor: ProcessorAsync | BuiltInProcessors = 'automatic',
): ProcessorAsync {
    const matchedProcessor: ProcessorAsync = getProcessor(processor);

    return matchedProcessor;
}

function getProcessorSync(
    processor: ProcessorSync | BuiltInProcessors = 'automatic',
): ProcessorSync {
    const matchedProcessor: ProcessorSync = getProcessor(processor);

    return matchedProcessor;
}

export {
    getProcessorSync,
    getProcessorAsync,
    automatic,
    arrayConcat,
    arrayPush,
    mergeDeep,
};
