import Joi from 'joi';
import { BasicConfig } from '../types';
import { extendError } from './extend-error';

function generateResolveValidator(
	presets?: string | false,
	plugins?: string | false,
): Joi.ObjectSchema | null {
	const schema = Joi.array().items(
		Joi.string(),
		Joi.array().ordered(Joi.string().required(), Joi.any()).max(2),
	);

	const obj: BasicConfig = {};
	if (presets) {
		obj[presets] = schema.label(presets);
	}

	if (plugins) {
		obj[plugins] = schema.label(plugins);
	}

	if (Object.keys(obj).length === 0) {
		return null;
	}

	return Joi.object(obj);
}

export type ResolveSchema = ReturnType<typeof generateResolveValidator>;

function validateResolveKeys(
	config: BasicConfig,
	schema: ResolveSchema,
	packagePath?: string,
): void {
	if (schema === null) {
		return;
	}

	const isValid = schema.validate(config, {
		allowUnknown: true,
	});

	if (isValid.error) {
		let message = isValid.error.annotate();

		// eslint-disable-next-line no-useless-concat
		message += '\n' + 'extends key must be a module expressed as a string';

		const error = new Error(message);

		extendError({ error, pathname: packagePath });

		throw error;
	}
}

export { generateResolveValidator, validateResolveKeys };
