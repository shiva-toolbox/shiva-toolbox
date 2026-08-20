import { streamAlertCommand } from '../../modules/stream-alerts';
import {
  addAlert,
  getAlertMessage,
  listAlerts,
  previewLiveAlert,
  removeAlert,
  setAlertMessage,
} from '../../modules/twitch';

export default streamAlertCommand({
  platform: 'twitch',
  target: 'username',
  alerts: {
    addAlert,
    getAlertMessage,
    listAlerts,
    previewLiveAlert,
    removeAlert,
    setAlertMessage,
  },
});
