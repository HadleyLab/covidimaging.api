import importHospitals from '../providers/importHospitals'

/*
  import something
  very important migration should return true
 */

export default async () => {
  await importHospitals.run();
  return true;
}
