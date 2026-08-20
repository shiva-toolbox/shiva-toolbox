import { getLiveStreams } from '../../services/twitch';
import { createStreamWatcher } from '../stream-alerts';
import { CHECK_EVERY_MS, PLATFORM } from './constants';
import { buildLiveAlert, getAlertMessage } from './message';

export const startTwitchLiveChecks = createStreamWatcher({
  platform: PLATFORM,
  checkEveryMs: CHECK_EVERY_MS,
  fetchLive: getLiveStreams,
  platformIdOf: (stream) => stream.userId,
  buildAlert: buildLiveAlert,
  getAlertMessage,
});
