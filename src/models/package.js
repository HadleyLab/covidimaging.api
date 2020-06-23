/**
 * @typedef {Model} Dicom
 * @property {String} token
 * @property {String} deviceType
 */
import mongoose from '../db';
import {DB_MODEL_PACKAGE, DB_MODEL_HOSPITALS, DB_MODEL_TRANSFERS, DB_MODEL_DICOM} from '../constants';

export const Package = new mongoose.Schema({
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: DB_MODEL_HOSPITALS
  },
  hospitalId: {
    type: String
  },
  packageId: {
    type: String,
  },
  patient: {
    type: Object
  },
  xml: {
    type: Object
  },
  transfer:{
    type: mongoose.Schema.Types.ObjectId,
    ref: DB_MODEL_TRANSFERS
  },
  dicom:{
    type: mongoose.Schema.Types.ObjectId,
    ref: DB_MODEL_DICOM
  },
  createdAt: {
      type: Date,
      default: Date.now
  },
});

export default mongoose.db.model(DB_MODEL_PACKAGE, Package);
