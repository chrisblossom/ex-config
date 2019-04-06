import path from 'path';
import { ResolveFunction } from './get-resolve-function';
import { extendError } from './extend-error';
import { ConfigFunctionParameters } from '../types';

function requireFromString(
    pkg: string | ReadonlyArray<string>,
    resolveFunction: ResolveFunction,
    dirname: string,
) {
    const [packageId, options = {}] = Array.isArray(pkg) ? pkg : [pkg];

    try {
        const packagePath = resolveFunction(packageId, { dirname });
        const { dir: updatedDirname } = path.parse(packagePath);

        let module = require(packagePath);

        /**
         * Handle ES Modules
         */
        if (typeof module === 'object' && module.__esModule) {
            if (module.default) {
                module = module.default;
            } else {
                throw new Error(
                    `${packagePath} must use export default with es modules`,
                );
            }
        }

        if (typeof module === 'function') {
            const context: ConfigFunctionParameters = {
                options,
                dirname,
            };

            module = module(context);
        }

        return {
            module,
            dirname: updatedDirname,
            pathname: packagePath,
        };
    } catch (error) {
        extendError({ error, pathname: dirname });
        throw error;
    }
}

export { requireFromString };
