import {OK} from 'http-status';
import fs from 'fs';
import {HttpBadRequestError} from '../../helpers/errors'
import {get as getRequest, getHeaders, getUrl, upload} from '../../helpers/request';
import request from 'request'
import dicomsProvider from '../../providers/dicoms'
import TransferProvider from '../../providers/transfer'
import success from '../../helpers/success'
import Joi from 'joi'
import {filterParams} from '../../helpers/validate'

export const getImage = async (req, res, next) => {
  try {
    const getReq = request.get({
      url: getUrl(`/api/v1/ipfs/files?hash=${req.query.hash}`),
      headers: getHeaders(),
    })

    res.header("Content-Type", "image/jpeg");
    return getReq.pipe(res);
  } catch (e) {
    return next(e);
  }
};
export const get = async (req, res, next) => {
  try {
    const file = await getRequest(`/api/v1/ipfs/files?hash=${req.query.hash}`);
    res.header("Content-Type", "text/plain");
    return res.status(OK).json({file});
  } catch (e) {
    return next(e);
  }
};

export const add = async (req, res, next) => {
  try {
    const result = await upload('/api/v1/ipfs/files', {file: fs.createReadStream(req.file.path)});
    fs.unlinkSync(req.file.path)

    return res.status(OK).json(result);
  } catch (e) {
    return next(new HttpBadRequestError(e));
  }
};

export const saveSchema = {
  canvas: Joi.string().required(),
  id: Joi.string().required(),
  src: Joi.string().required()
}
export const save = async (req, res, next) => {
  try {
    const params = ['canvas', 'id', 'src'];
    const fields = filterParams(req.body, params)
    await dicomsProvider.saveCanvas(fields);
    return success(res, {save: 'ok'})
  } catch (e) {
    return next(e)
  }
}

export const getSchema = {
  fileId: Joi.string().required(),
  stadyId: Joi.string(),
  dicomId: Joi.string(),
}

export const getDataFile = async (req, res, next) => {
  try {
    let file = null
    const params = ['fileId', 'stadyId'];
    const fields = filterParams(req.body, params)

    const transfer = await TransferProvider.getAllByPackageId(fields.stadyId)


    if (transfer && transfer.package && transfer.package.dicom && transfer.package.dicom.files) {
      for (let i in transfer.package.dicom.files) {
        if (transfer.package.dicom.files[i].id === fields.fileId) {
          file = transfer.package.dicom.files[i]
        }
      }
    }
    return success(res, {file: file})

  } catch (e) {
    return next(e)
  }
}

export const getDataFileDicomId = async (req, res, next) => {
  try {
    let file = null
    const params = ['fileId', 'dicomId'];
    const fields = filterParams(req.body, params)

    const transfer = await dicomsProvider.getList({_id: fields.dicomId})


    if (transfer && transfer[0].files) {
      for (let i in transfer[0].files) {
        if (transfer[0].files[i].id === fields.fileId) {
          file = transfer[0].files[i]
        }
      }
    }


    return success(res, {file: file})

  } catch (e) {
    return next(e)
  }
}
