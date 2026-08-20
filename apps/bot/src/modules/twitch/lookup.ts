import { UserError } from '../../errors';
import { getTwitchUser } from '../../services/twitch';
import { parseTwitchUsername } from '../../utils/twitch';

export function requireLogin(username: string) {
  const login = parseTwitchUsername(username);
  if (!login) {
    throw new UserError('twitch.invalidUser');
  }

  return login;
}

export async function requireTwitchUser(username: string) {
  const user = await getTwitchUser(requireLogin(username));
  if (!user) {
    throw new UserError('twitch.userNotFound');
  }

  return user;
}
