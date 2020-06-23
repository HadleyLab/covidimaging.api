import User from '../models/user';

/*
  import something
  very important migration should return true
 */

export default async () => {
    const user = new User({
        email: "admin@superadmin.com",
        password: "qwerty123456",
        roles: ['admin']
    });
    await user.save();
    return true;
}