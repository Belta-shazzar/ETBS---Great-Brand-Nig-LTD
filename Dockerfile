# Base image to ensure other images are using the same base image and provide common config for all stages
FROM node:20-alpine AS base
WORKDIR /usr/src/app

COPY package*.json yarn.lock ./

RUN yarn install --frozen-lockfile

COPY . .


FROM base AS development

ENV NODE_ENV=development

CMD yarn prisma:migrate && yarn dev

FROM base AS test

ENV NODE_ENV=test

CMD ["yarn", "test"]


FROM base AS builder

RUN yarn build

FROM node:20-alpine AS production
ENV NODE_ENV=production
WORKDIR /usr/src/app

COPY package*.json yarn.lock ./
RUN yarn install --production --frozen-lockfile

# COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/src/prisma ./dist
# COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/.env ./

# RUN yarn prisma:migrate
# RUN yarn prisma:generate

EXPOSE 3000

# CMD ["sh", "entrypoint.sh"]
CMD ["yarn", "start"]