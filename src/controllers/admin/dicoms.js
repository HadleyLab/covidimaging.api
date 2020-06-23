import { OK } from 'http-status';
import Joi from 'joi';
import DicomsProvider from '../../providers/dicoms'
import { filterParams } from '../../helpers/validate'
/**
 * Schema from get one user
 *
 * @type {{id}}
 */
export const getSchema = {
  package: Joi.string().min(24).max(24).required(),
}

/**
 * Return list or one user
 *
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
export const get = async (req, res, next) => {
    try {
        const params = [
            'package',
        ];
        const fields = filterParams(req.query, params);
        const result = await DicomsProvider.getList(fields)
        return res.status(OK).json(result);
    } catch (e) {
        return next(e);
    }
}
