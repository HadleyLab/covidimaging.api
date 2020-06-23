process.env.NODE_ENV = process.env.NODE_ENV || 'dev';
process.env.PORT = process.env.PORT || 8091;

require('babel-register');
require('./src');
