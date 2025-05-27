## 🚀 Запуск проекта через Docker Compose

Этот проект использует двухэтапную сборку Docker для минимального размера образа и оптимальной производительности на продакшене.

### 📦 Требования

- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)

### 🧾Запуск
На сервере порт 5173 считывает команда запуска 
контейнера — то есть внутри контейнера serve 
запускает сервер, который отдаёт статические
файлы Vue-приложения на порту 5173.



```bash
git clone https://github.com/AyatoTT/CryptoCurrency.git
cd your-repo
docker compose up --build -d
```

🛑 Остановка
```bash

docker compose down

```


Настройка nginx на сервере
```bash 
sudo nano /etc/nginx/sites-available/vue-app.conf
```

Вставь туда такой конфиг:
````
nginx
Copy
Edit
server {
    listen 80;
    server_name your.domain.com;  # <-- замени на свой домен или IP

    location / {
        proxy_pass http://localhost:5173/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
````