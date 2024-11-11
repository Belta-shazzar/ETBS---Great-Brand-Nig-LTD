#!bin/sh
yarn prisma:migrate:prod
yarn prisma:generate
yarn start