import { OK } from 'http-status';
import Joi from 'joi';
import HospitalsProvider from '../../providers/hospitals';
import TransferProvider from '../../providers/transfer';
import HashHospitalProvider from '../../providers/hashHospital';
import { filterParams, multiFilterParams } from '../../helpers/validate';
import { HttpBadRequestError } from '../../helpers/errors'
import {REGISTRATION_THIRD_STEP, ROLE_PATIENT, ROLE_ADMIN } from '../../constants'
import { allowOnly } from '../../helpers/authorization'
import sessionProvider from '../../providers/session'
import userProvider from "../../providers/user";

export const createSchema = {
    name: Joi.string().required(),
    address: Joi.string().required(),
    state: Joi.string(),
    city: Joi.string(),
    contactPerson_firstName: Joi.string(),
    contactPerson_lastName: Joi.string(),
    contactPerson_email: Joi.string()
};

export const create = async (req, res, next) => {
    const hospitalsFields = [
        'state',
        'createTransfer',
        'city',
        'zip',
        'phone',
        'phone2',
        'name',
        'address',
        'MRN',
        'active',
        'hospitalID',
        'contactPerson_firstName',
        'contactPerson_lastName',
        'contactPerson_email',
    ];
    try {
        const fields = await filterParams(req.body, hospitalsFields);
        let result = await HospitalsProvider.create(fields);

        if (fields.createTransfer) {
          await TransferProvider.createTransfers({id:result._id, MRN:fields.MRN || ''}, req.user);
          await HospitalsProvider.sendEmailForModerationHospital({hospital: result, user: req.user});
        }

        if (req.user && req.user.stepRegistration < 3) {
          const user = await userProvider.updateStep(req.user._id, REGISTRATION_THIRD_STEP);
          result = await sessionProvider.getOrCreate(user._id);
          return res.status(OK).json(result);
        } else {
          return res.status(OK).json(result);
        }


    } catch (e) {
        return next(e);
    }
};

export const delSchema = {
    id: Joi.string().required(),
};
export const del = async (req, res, next) => {
    const hospitalsFields = [
        'id'
    ];
    try {
        const fields = filterParams(req.body, hospitalsFields);
        let result = await HospitalsProvider.delete(fields.id);
        return res.status(OK).json(result);
    } catch (e) {
        return next(e);
    }
};

export const updateSchema = {
    _id: Joi.string().min(24).max(24).required(),
    name: Joi.string().required(),
    address: Joi.string().required(),
    state: Joi.string(),
    city: Joi.string(),
    contactPerson_id: Joi.string().min(24).max(24),
    contactPerson_firstName: Joi.string(),
    contactPerson_lastName: Joi.string(),
    contactPerson_email: Joi.string()
};
export const update = async (req, res, next) => {
    const hospitalsFields = [
        '_id',
        'state',
        'city',
        'zip',
        'phone',
        'name',
        'address',
        'active',
        'hospitalID',
        'contactPerson_id',
        'contactPerson_firstName',
        'contactPerson_lastName',
        'contactPerson_email',
    ];
    try {
        const fields = await multiFilterParams(req.body, hospitalsFields);
        let result = await HospitalsProvider.update(fields);
        return res.status(OK).json(result);
    } catch (e) {
        return next(e);
    }
}
export const redefinitionSchema = {
  newHospital: Joi.string().min(24).max(24).required(),
  oldHospital: Joi.string().min(24).max(24).required()

};
export const redefinition = async (req, res, next) => {
    const hospitalsFields = [
        'newHospital',
        'oldHospital',
    ];
    try {
        const fields = await filterParams(req.body, hospitalsFields);
        const result = {};

        const transfer = await TransferProvider.redefinitionHospitals(fields);
        await HospitalsProvider.delete(fields.oldHospital);
        await HospitalsProvider.sendEmailUserAfterSuccessfulModeration({transfer:transfer, hospitalID:fields.newHospital});

        return res.status(OK).json(result);
    } catch (e) {
        return next(e);
    }
}

export const getSchema = {
    id: Joi.string().min(24).max(24),
    page: Joi.number(),
    count: Joi.number(),
    noCalcCount: Joi.boolean(),
    type: Joi.string()
}

export const get = async (req, res, next) => {
    try {
        let patientQuery = {};

        if (allowOnly(ROLE_PATIENT) && req.user) {
          const packageList = await TransferProvider.getListHospitalIDByFilter({filter:{user:req.user._id}});
          patientQuery = {_id: {$nin : packageList}}
        }

        let result = await HospitalsProvider.get(Object.assign({}, req.params, req.body, req.query, {patientQuery:patientQuery}))

        if (allowOnly(ROLE_ADMIN) && result.hospitals) {
          result.hospitals = await TransferProvider.lookupTransfers(result.hospitals);
        }

        return res.status(OK).json(result);
    } catch (e) {
        return next(e);
    }
}

export const findSchema = {};

export const find = async (req, res, next) => {
    try {
        const filterFields = [
            "state",
            "city",
            "needUpdateCity",
            "search",
            "page",
            "count",
        ];
        let fields = filterParams(req.body, filterFields);

        fields.sort = (allowOnly(ROLE_PATIENT)) ? {name: 1} : {createdAt: -1};

        const result = await HospitalsProvider.list(fields);
        return res.status(OK).json(result);
    } catch (e) {
        return next(e);
    }
}

export const getEditSchema = {
  hash: Joi.string().min(24).max(24),
}

export const edit = async (req, res, next) => {
  try {
    const hash = await HashHospitalProvider.byID(req.params.hash)
    if (hash) {
      const result = await HospitalsProvider.get({id:hash.hospital})
      return res.status(OK).json(result);
    } else {
      return next(new HttpBadRequestError(e));
    }
  } catch (e) {
    return next(e);
  }
}
