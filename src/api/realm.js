import * as Realm from 'realm-web';

const APP_ID = import.meta.env.VITE_REALM_APP_ID;
if (!APP_ID) console.warn('VITE_REALM_APP_ID is not set. Create .env and set it.');

export const app = new Realm.App({ id: APP_ID });

export async function registerEmailPassword(email, password) {
  await app.emailPasswordAuth.registerUser({ email, password });
}

export async function loginEmailPassword(email, password) {
  const creds = Realm.Credentials.emailPassword(email, password);
  const user = await app.logIn(creds);
  return user;
}

export function currentUser() {
  return app.currentUser;
}

export async function logout() {
  if (app.currentUser) await app.currentUser.logOut();
}

export async function fn(name, ...args) {
  const user = app.currentUser;
  if (!user) throw new Error('Not authenticated');
  return await user.callFunction(name, ...args);
}
