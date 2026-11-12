> Historical reference: application code was removed on 4 November 2026. Commands and verification results below describe the previous prototype.

# LoadMastr native prototype

This Expo SDK 58 project currently launches the MapLibre foundation screen. The complete customer/driver web prototype is at the repository root; native route screens are being built separately.

## Run locally

From this directory:

```sh
npx expo install --check
npm run ios
```

Use the same project directory for Metro and the native build. If Metro is already running for this project, build with `npx expo run:ios --no-bundler`.

## Missing native Gesture Handler module

`RNGestureHandlerModule could not be found` means the running native binary does not provide the module expected by JavaScript. Installing a package or refreshing Metro alone does not update the binary.

- Keep `react-native-gesture-handler` as a direct dependency at the Expo SDK-compatible version.
- `index.ts` imports Gesture Handler before loading the app.
- `App.tsx` wraps the navigation tree in `GestureHandlerRootView` with `flex: 1`.
- Rebuild and reinstall the development app after changing native dependencies. Do not delete the simulator app or its data merely to rebuild it.

[Gesture Handler setup](https://docs.swmansion.com/react-native-gesture-handler/docs/fundamentals/getting-started/) · [Expo SDK 58 package reference](https://docs.expo.dev/versions/v58.0.0/sdk/gesture-handler/)

## Checks

```sh
npx tsc --noEmit
../node_modules/.bin/oxlint App.tsx index.ts src
```

3 November 2026: local iOS simulator build succeeded with zero errors; rebuilt app launched on iPhone 17 / iOS 27.0 to the MapLibre foundation screen without the reported startup exception. Typecheck passes; lint has one advisory Fast Refresh export warning in AuthContext.tsx.
