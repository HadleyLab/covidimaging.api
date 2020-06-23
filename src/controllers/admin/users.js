import { OK } from 'http-status';
import Joi from 'joi';
import { filterParams } from '../../helpers/validate'
import UserProvider from '../../providers/user'

/**
 * Shem input from update status
 *
 * @type {{userId, status, userActionType}}
 */
export const updateStatusSchema = {
    userId: Joi.string().min(24).max(24).required(),
    status: Joi.number().required(),
}

/**
 * Update status
 *
 * @param req
 * @param res
 * @param next
 *
 * @returns {Promise<*>}
 */
export const updateStatus = async (req, res, next) => {
    const fieldsReq = [
        'userId',
        'status',
    ];
    try {
        const fields = filterParams(req.body, fieldsReq);
        let result = await UserProvider.updateStatus(fields);
        return res.status(OK).json(result);
    }
    catch (e) {
        return next(e);
    }
}

/**
 * Schema from get one user
 *
 * @type {{id}}
 */
export const getSchema = {
    id: Joi.string().min(24).max(24),
    page: Joi.number(),
    count: Joi.number(),
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
      const result = await UserProvider.get(Object.assign({},  req.params, req.body, req.query))
        return res.status(OK).json(result);
    } catch (e) {
        return next(e);
    }
}
