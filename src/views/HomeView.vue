<template>
  <div class="home-view">
    <h1 class="title">Курс криптовалют</h1>
    <div v-if="loading" class="status-message">Загрузка...</div>
    <div v-else-if="error" class="status-message error">{{ error }}</div>
    <div v-else class="crypto-list">
      <CryptoCard
          v-for="crypto in cryptoList"
          :key="crypto.id"
          :crypto="crypto"
      />
    </div>
    <div class="last-updated">
      Обновлено: {{ lastUpdated }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import axios from 'axios'
import CryptoCard from '@/components/CryptoCard.vue'

const cryptoList = ref([
  { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', current_price: 0, price_change_percentage_24h: 0 },
  { id: 'ethereum', symbol: 'eth', name: 'Ethereum', current_price: 0, price_change_percentage_24h: 0 },
  { id: 'tether', symbol: 'usdt', name: 'Tether', current_price: 0, price_change_percentage_24h: 0 },
  { id: 'solana', symbol: 'sol', name: 'Solana', current_price: 0, price_change_percentage_24h: 0 },
  { id: 'tron', symbol: 'trx', name: 'Tron', current_price: 0, price_change_percentage_24h: 0 }
])
const loading = ref(true)
const error = ref(null)
const lastUpdated = ref('')
let intervalId = null
const chatId = ref(localStorage.getItem('telegram_chat_id'))

const API_KEY = 'CG-ra6LAH5Q5iNJRqdZ5d5sSoQT'
const API_URL = 'https://api.coingecko.com/api/v3/coins/markets'

const fetchData = async () => {
  try {
    loading.value = true
    error.value = null

    const response = await axios.get(API_URL, {
      params: {
        vs_currency: 'usd',
        ids: cryptoList.value.map(c => c.id).join(','),
        price_change_percentage: '24h',
        x_cg_demo_api_key: API_KEY
      }
    })

    cryptoList.value = cryptoList.value.map(coin => {
      const updatedData = response.data.find(c => c.id === coin.id) || {}
      return {
        ...coin,
        current_price: updatedData.current_price || 0,
        price_change_percentage_24h: updatedData.price_change_percentage_24h || 0,
        image: updatedData.image,

      }
    })


    const now = new Date()
    lastUpdated.value = now.toLocaleTimeString()

  } catch (err) {
    error.value = 'Failed to load data from API. Please try again later.'
    console.error('API error:', err)
  } finally {
    loading.value = false
  }
}

const startPolling = () => {
  fetchData()
  intervalId = setInterval(fetchData, 60000)
}

onMounted(startPolling)

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
})
</script>

<style scoped>
.home-view {
  padding: 16px;
  min-height: calc(100vh - 99.5px);
  background: var(--bg-primary);
}

.title {
  color: var(--text-primary);
  text-align: center;
  margin-bottom: 20px;
}

.status-message {
  text-align: center;
  padding: 20px;
  color: var(--text-secondary);
}

.status-message.error {
  color: #ff3b30;
}

.crypto-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.last-updated {
  text-align: center;
  margin-top: 20px;
  color: var(--text-secondary);
  font-size: 0.8rem;
}
</style>