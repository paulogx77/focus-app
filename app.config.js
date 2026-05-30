const appJson = require('./app.json');

const configuredSyncApiUrl = process.env.EXPO_SYNC_API_URL?.trim();

module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      ...appJson.expo.extra,
      syncApiUrl: configuredSyncApiUrl || appJson.expo.extra?.syncApiUrl || '',
    },
  },
};
