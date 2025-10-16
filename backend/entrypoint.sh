#!/bin/sh

# This tells the script to exit immediately if any command fails.
set -e

# Step 1: Run the database migrations.
# We use 'python -m alembic' to be sure we're using the one we installed.
echo "Running database migrations..."
python -m alembic upgrade head

# Step 2: Start the web server.
# 'exec "$@"' runs the command that was passed to this script
# (which is the 'uvicorn' command from our Dockerfile's CMD).
echo "Starting the web server..."
exec "$@"