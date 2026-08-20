import { getYouTubeLiveStreams } from '../../services/youtube';
import { createStreamWatcher } from '../stream-alerts';
import { CHECK_EVERY_MS, PLATFORM } from './constants';
import { buildLiveAlert, getAlertMessage } from './message';

export const startYouTubeLiveChecks = createStreamWatcher({
  platform: PLATFORM,
  checkEveryMs: CHECK_EVERY_MS,
  fetchLive: getYouTubeLiveStreams,
  platformIdOf: (stream) => stream.channelId,
  buildAlert: buildLiveAlert,
  getAlertMessage,
});
