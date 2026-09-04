const appJson = require('./app.json');

const configuredSyncApiUrl = process.env.EXPO_SYNC_API_URL?.trim();

module.exports = {
  expo: {
    ...appJson.expo,
    plugins: [
      ...(appJson.expo.plugins ?? []),
      'expo-secure-store',
      ['react-native-google-mobile-ads', {
        androidAppId: 'ca-app-pub-3940256099942544~3347511713',
        iosAppId: 'ca-app-pub-3940256099942544~1458002511',
      }],
    ],
    extra: {
      ...appJson.expo.extra,
      syncApiUrl: configuredSyncApiUrl || appJson.expo.extra?.syncApiUrl || '',
    },
  },
};
