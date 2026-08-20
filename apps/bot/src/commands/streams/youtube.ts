import { streamAlertCommand } from '../../modules/stream-alerts';
import {
  addAlert,
  getAlertMessage,
  listAlerts,
  previewLiveAlert,
  removeAlert,
  setAlertMessage,
} from '../../modules/youtube';

export default streamAlertCommand({
  platform: 'youtube',
  target: 'name',
  alerts: {
    addAlert,
    getAlertMessage,
    listAlerts,
    previewLiveAlert,
    removeAlert,
    setAlertMessage,
  },
});
