#Базовый образ Node.js
FROM node:16

# Устанавливаем рабочую директорию в контейнере
WORKDIR /usr/src/app

# Копируем package.json и package-lock.json в рабочую директорию
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем остальные файлы проекта в рабочую директорию
COPY . .

# Копируем db.json в рабочую директорию
COPY db.json ./

# Открываем порт 3000
EXPOSE 3000

# Команда для запуска приложения
CMD [ "node", "./index.js" ]
