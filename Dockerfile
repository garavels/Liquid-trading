# Use the Docker Official Node image mirrored on ECR Public to avoid Docker Hub auth/rate issues.
FROM public.ecr.aws/docker/library/node:22-alpine
RUN npm install -g bun
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build
EXPOSE 3000
CMD ["bun", "run", "start"]
