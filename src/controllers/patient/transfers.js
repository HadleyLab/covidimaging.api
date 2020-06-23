import { OK } from 'http-status';
import _ from 'lodash';
import Joi from 'joi';
import TransferProvider from '../../providers/transfer'
import { filterParams } from '../../helpers/validate'
import PackagesProvider from '../../providers/packages'
import DicomsProvider from '../../providers/dicoms'

/**
 * Schema from get one user
 *
 * @type {{id}}
 */
export const getSchema = {
    filter: Joi.string()
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
        ];
        const fields = filterParams(req.query, params);
        fields.filter = {...fields.filter, user:req.user._id}
        const packageList = await TransferProvider.getArrayListID(fields);
        return res.status(OK).json(packageList);
    } catch (e) {
        return next(e);
    }
}

/**
 * Schema from get one user
 *
 * @type {{id}}
 */
export const createSchema = {
  hospitalIds: Joi.object().required(),
  addTransfer: Joi.boolean(),
  MRN: Joi.string().max(20)
}

/**
 * Return list or one user
 *
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
export const create = async (req, res, next) => {
    try {
        const params = [
            'hospitalIds',
            'addTransfer',
            'MRN'
        ];
      const fields = filterParams(req.body, params);
      const result = await TransferProvider.createTransfers(fields.hospitalIds, req.user)
      return res.status(OK).json(result);
    } catch (e) {
        return next(e);
    }
}
