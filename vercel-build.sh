#!/bin/bash

# Force npm to use legacy peer deps
export npm_config_legacy_peer_deps=true

# Install dependencies with legacy peer deps
npm install --legacy-peer-deps

# Build the application
npm run build
