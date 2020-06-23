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
import bcrypt from "bcryptjs";
import md5 from "md5";
import mongoose from "../db";
import {isEmail} from "validator";
import uniqueValidator from "mongoose-unique-validator";
import {DB_MODEL_USER, DB_MODEL_HOSPITALS} from '../constants';


const SALT_WORK_FACTOR = 11;
export const encryptPassword = (password) => new Promise((resolve, reject) => {
  bcrypt.genSalt(SALT_WORK_FACTOR, (err, salt) => {
    if (err) {
      return reject(err);
    }
    bcrypt.hash(password, salt, (errHash, hash) => {
      if (errHash) {
        return reject(errHash);
      }
      resolve(hash);
    });
  });
});

export const UserSchema = new mongoose.Schema({
  password: {
    type: String,
    required: true,
  },
  firstName: String,
  lastName: String,
  dob: String,
  phone: String,
  email: {
    type: String,
    required: true,
    index: {
      unique: true
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date,
  deletedAt: Date,
  confirmed: Object,
  adminStatus: {
      type: Number,
      default: 0
  },
  stepRegistration: {
      type: Number,
      default: 1
  },
  roles: {
    type: Array,
    default: []
  },
  hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: DB_MODEL_HOSPITALS
  },
  hash:{
    type: String,
  },
  sign:{
    type: String
  },
  envelopeId: {
    type: String
  }
});

UserSchema.pre('save', async function (next) {
  const user = this;
  user.updatedAt = Date.now;
  if (user.isModified('password')) {
    user.password = await encryptPassword(user.password);
  }
  let hash = user.firstName + user.lastName + user.dob
  user.hash = md5(hash.toLowerCase());

  if (!user.id) {
    try {
      //user.id = await sequenceNext('user');
    } catch (exception) {
      return next(exception);
    }
  }
  next();

  return next();
});

UserSchema.methods.checkPassword = function (password) {
  return bcrypt.compareSync(password, this.password);
};

UserSchema.methods.generateToken = async () => {
  this.token = await crypto.randomBytes(64).toString('hex');
  await this.save();
};
//
// UserSchema.set('toJSON', {
//   transform: function (doc, ret, options) {
//     return {
//       _id: ret._id,
//       id: ret.id,
//       address: ret.address,
//       city: ret.city,
//       company_name: ret.company_name,
//       confirmed: ret.confirmed,
//       country: ret.country,
//       countryCode: ret.countryCode,
//       email: ret.email,
//       eth_wallet: ret.eth_wallet,
//       language: ret.language,
//       lat: ret.lat,
//       lng: ret.lng,
//       name: ret.name,
//       phone: ret.phone,
//       phoneSec: ret.phoneSec,
//       reputation_score: ret.reputation_score,
//       street: ret.street,
//       website: ret.website,
//       street_number: ret.street_number,
//       zip_code: ret.zip_code,
//       officeLocations: ret.officeLocations,
//       roles: ret.roles,
//       title: ret.title,
//       logo: ret.logo,
//       fullTimeEmployeesAmount: ret.fullTimeEmployeesAmount,
//       partTimeEmployeesAmount: ret.partTimeEmployeesAmount,
//       businessStartedAt: ret.businessStartedAt,
//       owners: ret.owners,
//     };
//   }
// });

UserSchema.plugin(uniqueValidator, {message: 'User with email is already exists'});

export default mongoose.db.model(DB_MODEL_USER, UserSchema);
