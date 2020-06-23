/**
 * @typedef {Model} contact persons Hospitals
 */
import mongoose from '../db';
import { DB_MODEL_CONTACT_PERSONS } from '../constants'

export const contactPersonSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
});

contactPersonSchema.pre('save', async function (next) {
  return next();
});

export default mongoose.db.model(DB_MODEL_CONTACT_PERSONS, contactPersonSchema);