import { PrefixOptions } from 'resolve-with-prefix';
import { BuiltInProcessors } from './utils/get-processor';

export type BasicConfig = { [key: string]: any };

type ConfigFnAsync = (
    args: ConfigFunctionParameters,
) => Promise<BasicConfig> | BasicConfig;
export type ConfigAsync = BasicConfig | ConfigFnAsync;

// Currently cannot disallow async functions.
// https://github.com/Microsoft/TypeScript/pull/29317
type ConfigFnSync = (args: ConfigFunctionParameters) => BasicConfig;
export type ConfigSync = BasicConfig | ConfigFnSync;

export type Api = { [key: string]: any };

export interface LifecycleParams {
    // actionable item
    value: any;
    // current value of actionable item
    current?: any;
    // current full config
    config: BasicConfig;
    // current config directory
    dirname: string;
    // user api
    api: Api;
}

export type ValidatorAsync = (
    lifecycleParams: LifecycleParams,
) => Promise<void> | void;
export type ValidatorSync = (lifecycleParams: LifecycleParams) => void;

export type PreprocessorAsync = (
    lifecycleParams: LifecycleParams,
) => Promise<BasicConfig> | BasicConfig;
export type PreprocessorSync = (
    lifecycleParams: LifecycleParams,
) => BasicConfig;

export type ProcessorAsync = (
    lifecycleParams: LifecycleParams,
) => Promise<unknown> | unknown;
export type ProcessorSync = (lifecycleParams: LifecycleParams) => unknown;

export type PostProcessorAsync = (
    lifecycleParams: LifecycleParams,
) => Promise<BasicConfig> | BasicConfig;
export type PostProcessorSync = (
    lifecycleParams: LifecycleParams,
) => BasicConfig;

export type ConfigFunctionParameters = {
    options: any;
    dirname: string;
    api: Api;
};

export type OverridesAsync = {
    resolve?: PrefixOptions;
    processor?: ProcessorAsync | BuiltInProcessors;
    validator?: ValidatorAsync;
    preprocessor?: PreprocessorAsync;
};

export type OverridesSync = {
    resolve?: PrefixOptions;
    processor?: ProcessorSync | BuiltInProcessors;
    validator?: ValidatorSync;
    preprocessor?: PreprocessorSync;
};

export interface OptionsAsync {
    api?: Api;
    baseDirectory?: string;
    presets?: string | false;
    plugins?: string | false;
    preprocessor?: PreprocessorAsync;
    processor?: ProcessorAsync | BuiltInProcessors;
    validator?: ValidatorAsync;
    postProcessor?: PostProcessorAsync;
    overrides?: { [key: string]: OverridesAsync };
}

export interface OptionsSync {
    api?: Api;
    baseDirectory?: string;
    presets?: string | false;
    plugins?: string | false;
    preprocessor?: PreprocessorSync;
    processor?: ProcessorSync | BuiltInProcessors;
    validator?: ValidatorSync;
    postProcessor?: PostProcessorSync;
    overrides?: { [key: string]: OverridesSync };
}
