import { UserError } from '../../errors';
import { getYouTubeChannel, isYouTubeConfigured } from '../../services/youtube';
import { parseYouTubeChannel } from '../../utils/youtube';

export function requireYouTubeQuery(input: string) {
  const parsed = parseYouTubeChannel(input);
  if (!parsed) {
    throw new UserError('youtube.invalidChannel');
  }

  return parsed;
}

export async function requireYouTubeChannel(input: string) {
  if (!isYouTubeConfigured()) {
    throw new UserError('youtube.missingApiKey');
  }

  requireYouTubeQuery(input);
  const channel = await getYouTubeChannel(input);
  if (!channel) {
    throw new UserError('youtube.channelNotFound');
  }

  return channel;
}
