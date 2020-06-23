import { OK } from 'http-status';
import Joi from 'joi';
import { filterParams } from '../../helpers/validate'
import TransferProvider from '../../providers/transfer'

/**
 * Shem input from update status
 *
 * @type {{transferId, status}}
 */
export const updateStatusSchema = {
    transferId: Joi.string().min(24).max(24).required(),
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
        'transferId',
        'status',
    ];
    try {
        const fields = filterParams(req.body, fieldsReq);
        let result = await TransferProvider.updateStatus(fields);
        return res.status(OK).json(result);
    }
    catch (e) {
        return next(e);
    }
}

/**
 * Schema from get one transfer
 *
 * @type {{id}}
 */
export const getSchema = {
    id: Joi.string().min(24).max(24),
    filter: Joi.string(),
    page: Joi.number(),
    count: Joi.number(),
}

/**
 * Return list or one transfer
 *
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
export const get = async (req, res, next) => {
    try {
        const params = [
            'filter',
            'page',
            'count'
        ];
        const fields = filterParams(req.query, params);

        const result = await TransferProvider.get(Object.assign({}, req.params, req.body,  fields))
        return res.status(OK).json(result);
    } catch (e) {
        return next(e);
    }
}
