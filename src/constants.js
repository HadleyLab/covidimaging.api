// proposal

export const ID = '_id';
export const USER_ID = 'id';

//languages

export const LANGUAGE_EN = 'en';

//array of languages

export const getLanguages = function () {
  return [
    LANGUAGE_EN,
  ];
};

export const ROLE_PATIENT = 'patient';
export const ROLE_ADMIN = 'admin';

export const USER_ACTION_NOACTION = 0;
export const USER_ACTION_RESET_PASSWORD = 1;
export const USER_ACTION_CONFIRM_EMAIL = 2;
export const USER_ACTION_CONFIRM_EMAIL_ATTEMPT = 3;

export const MAX_FILE_SIZE = 104857600; //20mb

export const PASSWORD_MIN_LENGTH = 6;

export const DB_MODEL_FILE = 'File';
export const DB_MODEL_USER = 'User';
export const DB_MODEL_USER_ACTION = 'UserAction';
export const DB_MODEL_SESSION = 'Session';
export const DB_MODEL_DICOM = 'Dicom';
export const DB_MODEL_CONTACT_PERSONS = 'ContactPersons';
export const DB_MODEL_HOSPITALS = 'Hospitals';
export const DB_MODEL_ANNOTATIONS = 'Annotations';
export const DB_MODEL_TRANSFERS = 'Transfers';
export const DB_MODEL_HASHHOSPITAL = 'HashHospital';
export const DB_MODEL_PACKAGE = 'Package';

export const RESET_PASSWORD_HOURS_LIMIT = 1;
export const RESET_PASSWORD_COUNT_LIMIT = 3;

export const CONFIRM_EMAIL_HOURS_LIMIT = 1;
export const CONFIRM_EMAIL_COUNT_LIMIT = 3;

export const REGISTRATION_FERST_STEP = 1;
export const REGISTRATION_SECOND_STEP = 2;
export const REGISTRATION_THIRD_STEP = 3;