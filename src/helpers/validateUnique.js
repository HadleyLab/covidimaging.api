import Joi from 'joi';
import config from '../config';
import { HttpUnprocessableEntityError } from './errors';
import {ID, USER_ID} from '../constants';
const options = config.joi;
// TODO: create error body like JOI returned
export const validateUnique =  (model, field) => async (req, res, next) => {

  try {

    let where = {};
    where[field] = req.body[field];
    if(req.params.id || req.body[ID]){
      where[ID] = {$not: req.body[ID]};
    }

    let res = await model.find({
      where: where
    });
    const details = {};
    if(!!res){
      details[field] = {key: field, notUnique:1, value:req.body[field], message: `is.already.in.use`, type: "any.empty"}
    }
    return !!res ? next(new HttpUnprocessableEntityError('emails', details)) : next();
  } catch (e) {
    console.log(e);
    return next(true);
  }
};


export const validateUniqueSub = (model, submodel, field) => async (req, res, next) => {
  try {
    let where = {};
    where[ID] = req.params.id;
    let res = await submodel.find({
      where: where
    }).then((result)=>{
      let userId = result[USER_ID];
      let where = {};
      where[ID] = {$not: userId};
      where[field] = req.body[field];
      return model.find({
        where: where
      })
    });
    return !!res ? next(new HttpUnprocessableEntityError('emails', {})) : next();
  } catch (e) {
    console.log(e);
    return next(true);
  }
};
