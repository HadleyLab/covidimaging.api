import { OK } from 'http-status';
import Joi from 'joi';
import AnnotationsProvider from '../../providers/annotations';
import { filterParams, multiFilterParams } from '../../helpers/validate';

export const createSchema = {
    tag: Joi.string().required(),
    annotation: Joi.string().required(),
}

export const create = async (req, res, next) => {
    const annotationsFields = [
        'tag',
        'annotation',
    ];
    try {
        const fields = filterParams(req.body, annotationsFields);
        let result = await AnnotationsProvider.create(fields);
        return res.status(OK).json(result);
    } catch (e) {
        return next(e);
    }
}

export const delSchema = {
    id: Joi.string().required(),
}
export const del = async (req, res, next) => {
    const annotationsFields = [
        'id'
    ];
    try {
        const fields = filterParams(req.body, annotationsFields);
        let result = await AnnotationsProvider.delete(fields.id);
        return res.status(OK).json(result);
    } catch (e) {
        return next(e);
    }
}

export const updateSchema = {
    _id: Joi.string().min(24).max(24).required(),
    tag: Joi.string().required(),
    annotation: Joi.string().required(),
}
export const update = async (req, res, next) => {
    const annotationsFields = [
        '_id',
        'tag',
        'annotation',
    ];
    try {
        const fields = await filterParams(req.body, annotationsFields);
        let result = await AnnotationsProvider.update(fields);
        return res.status(OK).json(result);
    } catch (e) {
        return next(e);
    }
}

export const getSchema = {
    id: Joi.string().min(24).max(24)
}

export const get = async (req, res, next) => {
    try {
        const result = await AnnotationsProvider.get(Object.assign({}, req.params, req.body, req.query))
        return res.status(OK).json(result);
    } catch (e) {
        return next(e);
    }
}
