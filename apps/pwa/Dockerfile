FROM node:22-alpine AS base
WORKDIR /repo

COPY package.json package-lock.json* ./
COPY apps/pwa/package.json apps/pwa/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
COPY packages/component-schema/package.json packages/component-schema/package.json
RUN npm install --workspace=apps/pwa --include-workspace-root

COPY packages ./packages
COPY apps/pwa ./apps/pwa

WORKDIR /repo/apps/pwa
RUN npm run build

EXPOSE 3001
CMD ["npm", "run", "start", "--", "-p", "3001"]
