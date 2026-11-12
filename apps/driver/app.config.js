module.exports = {
  expo: {
    name: "LoadMaster Driver",
    slug: "loadmaster-driver",
    version: "2.0.0",
    scheme: "loadmaster-driver",
    orientation: "portrait",
    userInterfaceStyle: "light",
    ios: {
      bundleIdentifier: "ug.co.loadmaster.v2.driver",
      supportsTablet: true,
      infoPlist: {
        NSAppTransportSecurity: { NSAllowsLocalNetworking: true },
        NSLocalNetworkUsageDescription:
          "Connect to the LoadMaster demo service on your computer.",
      },
    },
    android: { package: "ug.co.loadmaster.v2.driver" },
    plugins: [
      "expo-dev-client",
      "expo-font",
      "expo-secure-store",
      [
        "expo-contacts",
        {
          contactsPermission:
            "Choose a sender or recipient from your contacts. You can enter details manually.",
        },
      ],
      "@maplibre/maplibre-react-native",
      [
        "expo-image-picker",
        {
          photosPermission:
            "Choose a demo document photo to submit for driver verification.",
          cameraPermission:
            "Take a demo document photo for driver verification.",
          microphonePermission: false,
        },
      ],
      [
        "expo-location",
        {
          locationWhenInUsePermission:
            "Use your location to help choose a pickup. You can also enter it manually.",
        },
      ],
      "@react-native-community/datetimepicker",
      ["expo-build-properties", { android: { usesCleartextTraffic: true } }],
    ],
  },
};
