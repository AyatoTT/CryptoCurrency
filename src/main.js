import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import axios from 'axios'
import './assets/main.css'

const app = createApp(App)

// Инициализация Telegram WebApp
if (window.Telegram?.WebApp) {
    try {
        window.Telegram.WebApp.ready()
        window.Telegram.WebApp.expand()

        // Для тестирования в браузере
        if (!window.Telegram.WebApp.initDataUnsafe?.user) {
            window.Telegram.WebApp.initDataUnsafe = {
                user: { id: 123456789 } // Тестовый ID для разработки
            }
        }
    } catch (e) {
        console.error('Telegram WebApp init error:', e)
    }
}

app.use(router)
app.mount('#app')