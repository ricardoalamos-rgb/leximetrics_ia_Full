#!/bin/sh
echo "Railway tried to run: $@"
echo "Forcing correct start command..."
exec pnpm --filter web start
