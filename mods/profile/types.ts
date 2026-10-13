import { declareClientType } from '@treenx/core/comp/client-declaration';
import { declareClientModule } from '@treenx/react/context/client-registry';

export class Profile {
  label = 'Profile';
}
const declaredProfile = declareClientType('profile', Profile);

export const clientModules = [declareClientModule('starter/profile/types', [], undefined, [declaredProfile])];
