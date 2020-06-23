/**
 * @typedef {Model} Dicom
 * @property {String} token
 * @property {String} deviceType
 */
import mongoose from '../db';
import {DB_MODEL_DICOM, DB_MODEL_PACKAGE} from '../constants';

export const Dicom = new mongoose.Schema({
  package: {
    type: mongoose.Schema.Types.ObjectId,
    ref: DB_MODEL_PACKAGE
  },
  patientsName: {
    type: String
  },
  hospitalName: {
    type: String,
    default: '-'
  },
  patientId: {
    type: String,
    default: '-'
  },
  studyID: {
    type: String,
    default: '-'
  },
  dob: {
    type: String,
    default: '-'
  },
  files: {
    type: Array,
    default: []
  },
  more:{
    type: Object
  },
  createdAt: {
      type: Date,
      default: Date.now
  },
});

export default mongoose.db.model(DB_MODEL_DICOM, Dicom);
