import importDCM from '../providers/import-pack'

/*
  import something
  very important migration should return true
 */

export default async () => {
  await importDCM.run();
  return true;
}
