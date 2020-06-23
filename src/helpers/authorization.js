import SessionProvider from "../providers/session";
import {HttpForbiddenError} from "./errors";
import logger from "./logger";
const BEARER = 'Bearer';

export const headerToken = (headers) => {
  if (headers && headers.authorization) {
    const [key, token] = String(headers.authorization).split(' ');
    return (key === BEARER) ? token : null;
  }

  return null;
};

export const  tokenAuthorization = () => {
  return async (req, res, next) => {

    req.accessToken = headerToken(req.headers);
    if(!req.accessToken){
      req.accessToken = req.query.token
    }
    console.log(req.accessToken)
    if (req.accessToken) {
      try {
        const session = await SessionProvider.byToken(req.accessToken);
        req.user = session.user;
        req.user.token = session.token;
      } catch (exception) {
        logger.info(exception.message);
      }
    }
    return next();
  };
};

export const authOnly = () => {
  return async (req, res, next) => {
    if (Boolean(req.user && req.user.token)) {
      return next();
    }
    return next(new HttpForbiddenError());
  };
};


export const allowOnly = (...args) => {
  const roles = Array.prototype.slice.call(args, 0);
  return async (req, res, next) => {
    const result = Array.isArray(req.user.roles) && Boolean(req.user.roles.find((role)=>{
      return Boolean(~roles.indexOf(role))
    }));
    return result ? next() : next(new HttpForbiddenError());
  };
};

export const onlyFullRegistration = (...args) => {
  const roles = Array.prototype.slice.call(args, 0);
  return async (req, res, next) => {
    allowOnly(roles)
    return (req.user.stepRegistration === 3) ? next() : next(new HttpForbiddenError());
  };
};

