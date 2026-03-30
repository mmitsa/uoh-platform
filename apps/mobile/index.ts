import { I18nManager } from 'react-native';
import { registerRootComponent } from 'expo';

import App from './App';

// Force RTL before first render — Arabic is the default locale
if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

registerRootComponent(App);
