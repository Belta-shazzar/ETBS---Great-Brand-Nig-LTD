# Base image to ensure other images are using the same base image and provide common config for all stages
FROM node:20-alpine AS base
WORKDIR /usr/src/app

COPY package*.json yarn.lock ./

RUN yarn install --frozen-lockfile

COPY . .


FROM base AS development

ENV NODE_ENV=development

# Run prisma migrate then start the app
CMD yarn prisma:migrate && yarn dev 

FROM base AS test

ENV NODE_ENV=test
# RUN yarn prisma:generate

# Run prisma migrate and generate for test environment then start the app
CMD yarn prisma:migrate:test && yarn prisma:generate && yarn test

FROM base AS builder

RUN yarn prisma:generate

RUN yarn build

FROM node:20-alpine AS production
ENV NODE_ENV=production
WORKDIR /usr/src/app

COPY package*.json yarn.lock ./
RUN yarn install --production --frozen-lockfile

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/.env ./
COPY --from=builder /usr/src/app/entrypoint.sh ./
COPY --from=builder /usr/src/app/prisma ./

RUN chmod +x entrypoint.sh

EXPOSE 3000

CMD ["sh", "entrypoint.sh"]