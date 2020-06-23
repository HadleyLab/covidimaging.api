/**
 * @typedef {Model} User
 * @property {String} password
 * @property {String} name
 * @property {String} email
 * @property {String} createdAt
 * @property {String} updatedAt
 * @property {String} deletedAt
 * @property {String} token
 */
import mongoose from "../db";
import {DB_MODEL_HOSPITALS, DB_MODEL_HASHHOSPITAL, DB_MODEL_TRANSFERS} from '../constants';


export const HashHospitalSchema = new mongoose.Schema({
  createdAt: {
    type: Date,
    default: Date.now
  },
  hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: DB_MODEL_HOSPITALS
  },
  transfer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: DB_MODEL_TRANSFERS
  },

});

export default mongoose.db.model(DB_MODEL_HASHHOSPITAL, HashHospitalSchema);
