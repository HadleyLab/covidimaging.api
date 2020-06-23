import {OK} from 'http-status';

export default (res, data) => {
  return res.status(OK).json({
    success: true,
    ...(data && typeof data.toJSON === 'function' && data.toJSON() || data),
  });
}
