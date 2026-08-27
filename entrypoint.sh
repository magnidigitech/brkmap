#!/bin/sh
mkdir -p /app/prisma

# If persistent database does not exist on host volume yet, copy initial dev.db
if [ ! -f /app/prisma/dev.db ]; then
  echo "Initializing new persistent SQLite database..."
  if [ -f /app/initial_dev.db ]; then
    cp /app/initial_dev.db /app/prisma/dev.db
  else
    npx prisma db push --skip-generate
  fi
fi

exec node server.js
