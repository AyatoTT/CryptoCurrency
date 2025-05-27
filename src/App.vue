<template>
  <div class="app-container">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component"/>
      </transition>
    </router-view>

    <Navbar/>
  </div>
</template>

<script>
import Navbar from './components/Navbar.vue'

export default {
  name: 'App',
  components: {Navbar},

  mounted() {
    if (window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp;
      const user = tg.initDataUnsafe?.user;

      if (user) {
        localStorage.setItem('telegram_user_id', user.id);
      } else {
        localStorage.setItem('telegram_user_id', '730072130');
      }
    }
  }


}


</script>

<style>
.app-container {
  max-width: 100%;
  margin: 0 auto;
  min-height: 100vh;
  background: #f8f8f8;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>