import { OK } from 'http-status';
import Joi from 'joi';
import PackagesProvider from '../../providers/packages'
import { filterParams } from '../../helpers/validate'

/**
 * Schema assigned user
 *
 * @type {{packagesID, userID}}
 */
export const assignTransferSchema = {
    packagesID: Joi.string().min(24).max(24),
    transferId: Joi.string().min(24).max(24)
}

/**
 * Assigned user from dicom
 *
 * @param req
 * @param res
 * @param next
 *
 * @returns {Promise<*>}
 */
export const assignTransfer = async (req, res, next) => {
    try {
        const params = [
            'packagesID',
            'transferId'
        ];
        console.log(req.body);
        const fields = filterParams(req.body, params);
        const result = await PackagesProvider.assignTransfer(fields)
        return res.status(OK).json(result);
    } catch (e) {
        return next(e);
    }
}


/**
 * Schema from get one user
 *
 * @type {{id}}
 */
export const getSchema = {
    filter: Joi.string(),
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
        const params = [
            'filter',
            'page',
            'count',

        ];
        const fields = filterParams(req.query, params);
        const result = await PackagesProvider.getList(fields)
        return res.status(OK).json(result);
    } catch (e) {
        return next(e);
    }
}
