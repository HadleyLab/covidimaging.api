/**
 * @typedef {Model} Annotations
 */
import mongoose from '../db';
import { DB_MODEL_ANNOTATIONS } from '../constants'
import uniqueValidator from "mongoose-unique-validator";

export const AnnotationsSchema = new mongoose.Schema({
    tag: {
        type: String,
        required: true,
    },
    annotation: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
});

AnnotationsSchema.pre('save', async function (next) {
  return next();
});

AnnotationsSchema.plugin(uniqueValidator, {message: 'Annotation with name is already exists'});
export default mongoose.db.model(DB_MODEL_ANNOTATIONS, AnnotationsSchema);
