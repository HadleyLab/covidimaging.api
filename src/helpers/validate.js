import Joi from "joi";
import config from "../config";
import {HttpUnprocessableEntityError} from "./errors";
import ReCaptcha from "recaptcha2";
import formidable from "formidable";
import logger from "./logger";
import _ from 'lodash';
import user from '../models/user';

const options = config.joi;

export const reduceDetails = (errors, detail) => {
  const {path, type, message, context} = detail;
  errors[path] = {type, message, ...context};

  return errors;
};


export const validator = (schema) => {
  return (req, res, next) => {
    if (!schema) {
      return next();
    }
    const value = Object.assign({}, req.query, req.body, req.params);
    return Joi.validate(value, schema, options, (err) => {
      if (err) {
        const errors = Array.from(err.details).reduce(reduceDetails, {});
        next(new HttpUnprocessableEntityError(err.message, errors));
      }
      next();
    });
  };
};

/*
export const validateCustomCaptcha = async (req, res, next) => {
    const details = {
      captcha: {
        key: 'captcha',
        value: req.body.captcha,
        message: "Captcha you entered is wrong or expired",
        type: "notvalidated"
      }
    };
    try{
      if(req.body && req.body.captcha){
        const response = await checkService.checkCaptcha(req.body.captcha);
        if(response && response.result && response.result.captcha === req.body.captcha){
          return next();
        }
      }
    }catch(e){
      console.log(e)
    }
    return next(new HttpUnprocessableEntityError('captcha', details));
};
*/
export const validateUnique = (model, field) => async (req, res, next) => {
  try {
    let where = {};
    where[field] = req.body[field].toLowerCase();
    let res = await model.find(where);

    const exists = res && res.length;
    const details = {};

    if (exists) {
      details[field] = {
        key: field,
        notUnique: 1,
        value: req.body[field],
        message: `is.already.in.use`,
        type: "notunique"
      }
    }

    return exists ? next(new HttpUnprocessableEntityError('emails', details)) : next();
  } catch (e) {
    logger.info(e);
    return next(true);
  }
};

export const validateUniqueEmailOnUpdateProfile = async (req, res, next) => {
  try {
    const exists = await user.findOne({
      email: req.body.email.toLowerCase(),
      _id: {
        $ne: req.user._id
      }
    });

    const details = {};
    if (exists) {
      details.email = {
        key: 'email',
        notUnique: 1,
        value: req.body.email,
        message: `"${req.body.email}" is already in use`,
        type: "notunique"
      }
    }

    return exists ? next(new HttpUnprocessableEntityError('emails', details)) : next();
  } catch (e) {
    logger.info(e);
    return next(true);
  }
};

export const validateRecaptcha = async (req, res, next) => {
  const details = {
    recaptcha: {
      key: 'recaptcha',
      value: req.body.recaptcha,
      message: "Captcha you entered is wrong or expired",
      type: "notvalidated"
    }
  };

  try {
    const result = await recaptcha(req.body.recaptcha);
    return result ? next() : next(new HttpUnprocessableEntityError('recaptcha', details));
  } catch (e) {
    logger.info(e);
  }
  return next(new HttpUnprocessableEntityError('recaptcha', details));
};

const recaptcha = async (key) => {
  const r = new ReCaptcha({
    siteKey: config.google.recaptcha.publicKey,
    secretKey: config.google.recaptcha.privateKey
  });
  return new Promise((resolve, reject) => {
    r.validate(key).then(resolve).catch(reject);
  })
};

export const multipartValidate = (schema, func) => async (req, res, next) => {
  const cValidator = func || validator;
  const form = new formidable.IncomingForm();
  return await new Promise(async (resolve, reject) => {
    const arrays = {};
    form.onPart = (part) => {
      if (!part.filename && part.name.indexOf('[]') !== -1) { /*only arrays of data, but not files and not deeper than first row*/
        let n = part.name.replace('[]', '');
        part.addListener('data', function (buffer) {
          if (!arrays[n]) {
            arrays[n] = [];
          }
          arrays[n].push(buffer.toString('utf8'));
        });
      } else form.handlePart(part);
    };

    form.parse(req, (err, fields, files) => {
      const newFields = Object.assign({}, fields, arrays);
      if (err) {
        reject(next(err));
      } else {
        try {
          req.body = newFields;
          cValidator(schema).apply(null, [Object.assign({}, req, {body: newFields}), res, next]);
          resolve();
        } catch (e) {
          resolve(next(e));
        }
      }
    });
  });
};

export const getMulterError = (field, message) => {
  return {
    [field]: {
      key: field,
      message: message,
      type: 'file'
    }
  }
};


export const filterParams = (params, whitelist) => {
  const filtered = {};
  for (const key in params) {
    if (whitelist.indexOf(key) > -1) {
      filtered[key] = params[key];
    }
  }
  return filtered;
};

/**
 * Find and collect data
 *
 * @param {object} params
 * @param {object} whitelist
 * @returns {Promise<{}>}
 */
export const multiFilterParams = async (params, whitelist) => {
  let filtered = {};
  for (const key in whitelist) {
      let path = whitelist[key];
      let arPath = path.split('.');
      let value = _.get(params, path);
      if (value) {
        if (arPath.length === 1) {
            filtered[path] = value;
        } else {
            let sub = normalizeStr(path, value, 1)
            filtered[arPath[0]] = Object.assign(sub, filtered[arPath[0]]);
        }
      }
  }

  return filtered;
};

/**
 * Convert str "ddd.aaa.sss" to object {ddd:{aaa:{sss}}}
 *
 * @param str
 * @param value
 * @param index
 * @returns {Promise<*>}
 */
export const normalizeStr = (str, value, index) => {
    let arPath = str.split('.');
    let arrt = {};
    if (arPath.hasOwnProperty(index)) {
        arrt[arPath[index]] = normalizeStr(str, value, (index + 1));
    }
    else {
        return value;
    }
    return arrt;
}
export default validator;

