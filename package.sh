#!/bin/bash

# Stop the script if any command fails
set -e

# --- Configuration ---
# The browser target (e.g., "firefox" or "chrome") is the first argument
TARGET_BROWSER=$1
DIST_DIR="dist"
# List of top-level directories and files to copy into the package
# This is now much simpler with your new structure.
SOURCE_ASSETS=("src" "lib")

# --- Validation ---
if [ -z "$TARGET_BROWSER" ]; then
  echo "❌ Error: No browser specified."
  echo "Usage: ./package.sh [firefox|chrome]"
  exit 1
fi

if [ "$TARGET_BROWSER" != "firefox" ] && [ "$TARGET_BROWSER" != "chrome" ]; then
  echo "❌ Error: Invalid browser specified. Use 'firefox' or 'chrome'."
  exit 1
fi

MANIFEST_SOURCE="manifest.${TARGET_BROWSER}.json"

if [ ! -f "$MANIFEST_SOURCE" ]; then
  echo "❌ Error: Manifest file not found at '${MANIFEST_SOURCE}'"
  exit 1
fi

BUILD_DIR="${DIST_DIR}/${TARGET_BROWSER}"

# --- Build Process ---
echo "📦 Starting packaging process for ${TARGET_BROWSER}..."

# 1. Clean up previous build
echo "   -> Cleaning up old build directory..."
rm -rf "$BUILD_DIR"

# 2. Create the build directory
echo "   -> Creating new build directory at '${BUILD_DIR}'"
mkdir -p "$BUILD_DIR"

# 3. Copy source assets (src, lib, etc.)
echo "   -> Copying source assets..."
for asset in "${SOURCE_ASSETS[@]}"; do
  cp -r "$asset" "$BUILD_DIR/"
done

# 4. Copy and rename the manifest
echo "   -> Copying and renaming manifest file..."
cp "$MANIFEST_SOURCE" "${BUILD_DIR}/manifest.json"

echo "✅ Successfully packaged for ${TARGET_BROWSER}!"
echo "   Build available at: ${BUILD_DIR}"

# --- (Optional) Create a Zip File for Submission ---
echo "   -> Creating ZIP archive for store submission..."
ARCHIVE_NAME="scriven_${TARGET_BROWSER}.zip"

# Navigate into the build directory to zip its contents
(cd "$BUILD_DIR" && zip -r "../${ARCHIVE_NAME}" .)

echo "🎉 Done! ZIP archive created at: ${DIST_DIR}/${ARCHIVE_NAME}"