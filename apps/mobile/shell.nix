{ pkgs ? import <nixpkgs> {
    config = {
      allowUnfree = true;
      android_sdk.accept_license = true;
    };
  }
}:

let
  androidComposition = pkgs.androidenv.composeAndroidPackages {
    # React Native 0.81 (Expo SDK 54) pins compileSdk/targetSdk=36 and
    # buildTools=36.0.0 via node_modules/react-native/gradle/libs.versions.toml.
    # The Nix SDK store path is read-only so AGP cannot auto-download these;
    # provide 36 explicitly (34/35 kept for compatibility).
    platformVersions = [ "34" "35" "36" ];
    buildToolsVersions = [ "34.0.0" "35.0.0" "36.0.0" ];
    platformToolsVersion = "35.0.2";
    includeEmulator = true;
    includeSystemImages = true;
    systemImageTypes = [ "google_apis" ];
    abiVersions = [ "x86_64" ];
    includeNDK = true;
    ndkVersions = [ "27.1.12297006" ];
    cmakeVersions = [ "3.22.1" ];
    includeSources = false;
  };
  androidSdk = androidComposition.androidsdk;
  sdkRoot = "${androidSdk}/libexec/android-sdk";
in
pkgs.mkShell {
  buildInputs = [
    androidSdk
    pkgs.jdk17
    pkgs.nodejs_22
    pkgs.eas-cli
  ];

  ANDROID_SDK_ROOT = sdkRoot;
  ANDROID_HOME = sdkRoot;
  JAVA_HOME = "${pkgs.jdk17}";

  shellHook = ''
    export PATH="${sdkRoot}/emulator:${sdkRoot}/platform-tools:${sdkRoot}/cmdline-tools/latest/bin:$PATH"
    echo "Android SDK: $ANDROID_SDK_ROOT"
  '';
}
