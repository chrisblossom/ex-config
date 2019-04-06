/* eslint-disable no-nested-ternary */

import {
    Options,
    PostProcessor,
    Preprocessor,
    Processor,
    Validator,
} from '../ex-config';
import { Overrides } from '../types';
import { ResolveFunction } from './get-resolve-function';
import { generateResolveValidator, ResolveSchema } from './validation-utils';
import { getProcessor } from './get-processor';

export interface Context {
    readonly presets: string | false;
    readonly plugins: string | false;
    readonly resolve: { [key: string]: ResolveFunction };
    readonly processor: Processor;
    readonly validator?: Validator;
    readonly preprocessor?: Preprocessor;
    readonly postProcessor?: PostProcessor;
    readonly overrides: { readonly [key: string]: Overrides };
    readonly resolveSchema: ResolveSchema;
}

function getContext(options: Options): Context {
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

    const context: Context = {
        presets,
        plugins,
        overrides: options.overrides || {},
        processor: getProcessor(options.processor),
        validator: options.validator,
        preprocessor: options.preprocessor,
        postProcessor: options.postProcessor,
        resolve: {},
        resolveSchema: generateResolveValidator(presets, plugins),
    };

    return context;
}

export { getContext };
