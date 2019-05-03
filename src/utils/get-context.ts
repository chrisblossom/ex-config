/* eslint-disable no-nested-ternary */

import {
    OptionsSync,
    PreprocessorSync,
    ProcessorSync,
    PostProcessorSync,
    ValidatorSync,
    OverridesSync,
    ProcessorAsync,
    ValidatorAsync,
    PreprocessorAsync,
    PostProcessorAsync,
    OverridesAsync,
    OptionsAsync,
    Api,
} from '../types';
import {
    ResolveFunctionAsync,
    ResolveFunctionSync,
} from './get-resolve-function';
import { generateResolveValidator, ResolveSchema } from './validation-utils';
import { getProcessorAsync, getProcessorSync } from './get-processor';

export interface ContextAsync {
    api: Api;
    readonly presets: string | false;
    readonly plugins: string | false;
    readonly resolve: { [key: string]: ResolveFunctionAsync };
    readonly processor: ProcessorAsync;
    readonly validator?: ValidatorAsync;
    readonly preprocessor?: PreprocessorAsync;
    readonly postProcessor?: PostProcessorAsync;
    readonly overrides: { readonly [key: string]: OverridesAsync };
    readonly resolveSchema: ResolveSchema;
}

export interface ContextSync {
    api: Api;
    readonly presets: string | false;
    readonly plugins: string | false;
    readonly resolve: { [key: string]: ResolveFunctionSync };
    readonly processor: ProcessorSync;
    readonly validator?: ValidatorSync;
    readonly preprocessor?: PreprocessorSync;
    readonly postProcessor?: PostProcessorSync;
    readonly overrides: { readonly [key: string]: OverridesSync };
    readonly resolveSchema: ResolveSchema;
}

interface GetContextParameters {
    options: any;
    sync: boolean;
}

function getContext({ options, sync }: GetContextParameters) {
    // prettier-ignore
    const presets = options.presets
        ? options.presets
        : options.presets === undefined
            ? 'presets'
            : false;

    // prettier-ignore
    const plugins = options.plugins
        ? options.plugins
        : options.plugins === undefined
            ? 'plugins'
            : false;

    const processor =
        sync === true
            ? getProcessorSync(options.processor)
            : getProcessorAsync(options.processor);

    const api = options.api || {};

    const context = {
        api,
        presets,
        plugins,
        processor,
        overrides: options.overrides || {},
        validator: options.validator,
        preprocessor: options.preprocessor,
        postProcessor: options.postProcessor,
        resolve: {},
        resolveSchema: generateResolveValidator(presets, plugins),
    };

    return context;
}

function getContextAsync(options: OptionsAsync): ContextAsync {
    const context: ContextAsync = getContext({ options, sync: false });

    return context;
}

function getContextSync(options: OptionsSync): ContextSync {
    const context: ContextSync = getContext({ options, sync: true });

    return context;
}

export { getContextAsync, getContextSync };
