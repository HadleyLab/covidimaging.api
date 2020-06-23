import { OK } from 'http-status'
import importPackDCM from '../../providers/import-pack'
import { HttpUnprocessableEntityError } from '../../helpers/errors'

export const dcmImport = async (req, res, next) => {
  try {
      let result = await importPackDCM.run();
      return res.status(OK).json({
          result: 'ok'
      })
  } catch (e) {
    return next(e)
  }
}

