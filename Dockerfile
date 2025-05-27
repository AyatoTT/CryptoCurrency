# Этап сборки
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Этап запуска
FROM node:18-alpine
WORKDIR /app

# Копируем только необходимое
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Устанавливаем serve глобально (важно добавить --unsafe-perm для Alpine)
RUN npm install -g serve --unsafe-perm

# Указываем правильную команду запуска
CMD ["serve", "-s", "dist", "-l", "5173"]

# Альтернативный вариант, если глобальная установка не работает:
# CMD ["npx", "serve", "-s", "dist", "-l", "3000"]