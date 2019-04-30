import { exConfigSync } from './ex-config-sync';
import { exConfigAsync as exConfig } from './ex-config-async';
import {
    ConfigAsync as ConfigAsyncType,
    ConfigSync as ConfigSyncType,
    LifecycleParams as LifecycleParamsType,
    ValidatorAsync as ValidatorAsyncType,
    ValidatorSync as ValidatorSyncType,
    PreprocessorAsync as PreprocessorAsyncType,
    PreprocessorSync as PreprocessorSyncType,
    ProcessorAsync as ProcessorAsyncType,
    ProcessorSync as ProcessorSyncType,
    PostProcessorAsync as PostProcessorAsyncType,
    PostProcessorSync as PostProcessorSyncType,
    OptionsAsync as OptionsAsyncType,
    OptionsSync as OptionsSyncType,
    ConfigFunctionParameters as ConfigFunctionParametersType,
} from './types';

export type Config = ConfigAsyncType;
export type ConfigSync = ConfigSyncType;

export type ConfigFunctionParameters = ConfigFunctionParametersType;

export type LifecycleParams = LifecycleParamsType;

export type Validator = ValidatorAsyncType;
export type ValidatorSync = ValidatorSyncType;

export type Preprocessor = PreprocessorAsyncType;
export type PreprocessorSync = PreprocessorSyncType;

export type Processor = ProcessorAsyncType;
export type ProcessorSync = ProcessorSyncType;

export type PostProcessor = PostProcessorAsyncType;
export type PostProcessorSync = PostProcessorSyncType;

export type Options = OptionsAsyncType;
export type OptionsSync = OptionsSyncType;

export { exConfig, exConfigSync };
