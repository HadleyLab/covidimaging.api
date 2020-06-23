import {HttpUnprocessableEntityError} from './errors';
import multer from 'multer';
import path from 'path';
import {MAX_FILE_SIZE} from '../constants';

const MULTER_LIMIT_PART_COUNT = 'LIMIT_PART_COUNT';
const MULTER_LIMIT_FILE_SIZE = 'LIMIT_FILE_SIZE';
const MULTER_LIMIT_FILE_COUNT = 'LIMIT_FILE_COUNT';
const MULTER_LIMIT_FIELD_KEY = 'LIMIT_FIELD_KEY';
const MULTER_LIMIT_FIELD_VALUE = 'LIMIT_FIELD_VALUE';
const MULTER_LIMIT_FIELD_COUNT = 'LIMIT_FIELD_COUNT';
const MULTER_LIMIT_UNEXPECTED_FILE = 'LIMIT_UNEXPECTED_FILE';



export const upload = (rules) => async (req, res, next) => {
  try {
    /*filtering extension type*/
    const fileFilter = (req, file, cb) => {
      const rule = rules.find((rule) => file.fieldname === rule.name);
      const extension = path.extname(file.originalname).toLowerCase();
      if (rule && rule.extensions && false === (rule.extensions.test(file.mimetype) && rule.extensions.test(extension))) { /*validating extensions*/
        cb(getMulterError(file.fieldname,MULTER_LIMIT_UNEXPECTED_FILE))
      }
      return cb(null, true);
    };
    await new Promise(async (resolve, reject) => {
      /*rules validate filename and files count
      *
      * MAX_FILE_SIZE - global limit for file upload
      *
      * */
      multer({limits: {fileSize: MAX_FILE_SIZE}, fileFilter}).fields(rules)
      .apply(null, [req, res, (error) => {
            if (error) {
              return reject(error instanceof HttpUnprocessableEntityError
                ? error
                : getMulterError(error.field,error.code));
            }
            resolve();
          }]);
    });

    /*multer cannot validate file size in `filter` function, so here we validate filesize*/
    const overSizedFile = getOverSizedFile(rules, req.files);
    if (overSizedFile) {
      return next(getMulterError(overSizedFile.fieldname,MULTER_LIMIT_FILE_SIZE));
    }
    next();
  } catch (e) {
    return next(e);
  }
};

const getOverSizedFile = (rules, files) => {
  for(const name in files){
    let overSizedFile = files[name].find((file) =>
      rules.find(
        (rule) => rule.name === file.fieldname && +rule.size < +file.size
      )
    );
    if(overSizedFile){
      return overSizedFile;
    }
  }
};

export const getMulterError = (field, code) => {
  const error = {
    [field]: {
      key: field,
      message: code.replace(/_/g, '.').toLowerCase(),
      type: 'file'
    }
  };
  return new HttpUnprocessableEntityError(field,error)
};
