FROM node:22-alpine AS base
WORKDIR /repo

COPY package.json package-lock.json* ./
COPY apps/cms/package.json apps/cms/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
COPY packages/component-schema/package.json packages/component-schema/package.json
RUN npm install --workspace=apps/cms --include-workspace-root

COPY packages ./packages
COPY apps/cms ./apps/cms

WORKDIR /repo/apps/cms
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start", "--", "-p", "3000"]
