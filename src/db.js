import mongoose from 'mongoose';
import config from './config';

const {uri, user, pass, options} = config.db;

mongoose.Promise = Promise;
console.log('#############################################')
console.log('mongoose options: ', options)
console.log('#############################################')

mongoose.db = mongoose.createConnection(uri, {...options, user, pass});

export default mongoose;
