import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ConverterView from '../views/ConverterView.vue'
import NotificationsView from '../views/NotificationsView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { title: 'Курсы валют', icon: '📊' }
  },
  {
    path: '/converter',
    name: 'converter',
    component: ConverterView,
    meta: { title: 'Конвертер', icon: '🔄' }
  },
  {
    path: '/notifications',
    name: 'notifications',
    component: NotificationsView,
    meta: { title: 'Уведомления', icon: '🔔' }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach((to) => {
  document.title = to.meta.title + ' | Crypto Tracker'
})

export default router