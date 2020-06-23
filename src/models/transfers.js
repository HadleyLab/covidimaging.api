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
import {DB_MODEL_USER, DB_MODEL_HOSPITALS, DB_MODEL_TRANSFERS, DB_MODEL_DICOM, DB_MODEL_PACKAGE} from '../constants';


export const TransfersSchema = new mongoose.Schema({
  createdAt: {
    type: Date,
    default: Date.now
  },
  adminStatus: {
      type: Number,
      default: 0
  },
  hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: DB_MODEL_HOSPITALS
  },
  user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: DB_MODEL_USER
  },
  package:{
      type: mongoose.Schema.Types.ObjectId,
      ref: DB_MODEL_PACKAGE
  },
  MRN:{
      type: String
  },
  sign:{
    type: Boolean,
    default: false
  },
  envelopeId: {
    type: String
  }
});

export default mongoose.db.model(DB_MODEL_TRANSFERS, TransfersSchema);
