/**
 * @typedef {Model} Hospitals
 */
import mongoose from '../db';
import { DB_MODEL_HOSPITALS, DB_MODEL_CONTACT_PERSONS } from '../constants'
import uniqueValidator from "mongoose-unique-validator";

export const HospitalsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    address: {
        type: String,
    },
    city: {
        type: String,
    },
    state: {
        type: String,
    },
    zip: {
        type: String,
    },
    phone: {
        type: String,
    },
    hospitalID:{
      type: String,
    },
    contactPerson: {
        type: mongoose.Schema.Types.ObjectId,
        ref: DB_MODEL_CONTACT_PERSONS
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    active: {
      type: Boolean,
      default: false
    }
});

HospitalsSchema.pre('save', async function (next) {
  return next();
});

HospitalsSchema.plugin(uniqueValidator, {message: 'Hospital with name is already exists'});
export default mongoose.db.model(DB_MODEL_HOSPITALS, HospitalsSchema);
