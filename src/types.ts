import { PrefixOptions } from 'resolve-with-prefix';
import { builtInProcessors } from './utils/get-processor';
import { Preprocessor, Processor, Validator } from './ex-config';

export type ConfigFunctionParameters = {
    options: any;
    dirname: string;
};

export type Overrides = {
    resolve?: PrefixOptions;
    processor?: Processor | builtInProcessors;
    validator?: Validator;
    preprocessor?: Preprocessor;
};
