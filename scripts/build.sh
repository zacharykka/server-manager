#!/bin/bash

ARCH=$(uname -m)
OS=$(uname -s)

# check the architecture and os and set the build environment
if [ "$ARCH" == "x86_64" ]; then
  export GOARCH=amd64
elif [ "$ARCH" == "aarch64" ] || [ "$ARCH" == "arm64" ]; then
  export GOARCH=arm64
else
  echo "Unsupported architecture: $ARCH"
  exit 1
fi

if [ "$OS" == "Darwin" ]; then
  export GOOS=darwin
elif [ "$OS" == "Linux" ]; then
  export GOOS=linux
else
  echo "Unsupported OS: $OS"
  exit 1
fi

# build the application
go build -o ansible-api cmd/api/main.go
