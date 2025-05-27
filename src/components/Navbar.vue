<template>
  <nav class="navbar">
    <router-link
        v-for="route in routes"
        :key="route.name"
        :to="route.path"
        class="nav-link"
        active-class="active"
    >
      <span class="nav-icon">{{ route.meta.icon }}</span>
      <span class="nav-text">{{ route.meta.title }}</span>
    </router-link>
  </nav>
</template>

<script>
import {computed} from 'vue'
import {useRouter} from 'vue-router'

export default {
  name: "Navbar",
  setup() {
    const router = useRouter()
    const routes = computed(() =>
        router.getRoutes().filter(r => r.meta.icon)
    )

    return {routes}
  }
}
</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-around;
  align-items: center;
  background: var(--bg-primary);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  position: fixed;
  bottom: 0;
  padding-bottom: 35px;
  padding-top: 5px;
  left: 0;
  right: 0;
  z-index: 100;
}

.nav-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: #666;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.2s;
}

.nav-link.active {
  color: #007AFF;
  background: rgba(0, 122, 255, 0.1);
}

.nav-icon {
  font-size: 20px;
  margin-bottom: 2px;
}

.nav-text {
  font-size: 12px;
  font-weight: 500;
}
</style>