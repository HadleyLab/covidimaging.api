import ContactPersonsProvider from '../providers/contact-persons'

/*
  import something
  very important migration should return true
 */

export default async () => {

  const  data = {
    email: 'marc@nautilusmedical.com'
  };
  const filter = {
    email: {
      $exists: true
    }
  };
  await ContactPersonsProvider.updateByFilter(data, filter);

  return true;
}
