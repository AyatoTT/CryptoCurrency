<template>
  <div class="notification-settings">
    <h1 class="title">Уведомления</h1>

    <div class="section">
      <h2 class="section-title">Отслеживаемые монеты</h2>
      <div class="coin-list">
        <div
            v-for="coin in availableCoins"
            :key="coin.id"
            class="coin-item"
            @click="toggleCoinNotification(coin.id)"
        >
          <span class="coin-name">{{ coin.name }} ({{ coin.symbol.toUpperCase() }})</span>
          <span class="toggle" :class="{ active: isCoinTracked(coin.id) }">
            <span class="toggle-handle"></span>
          </span>
        </div>
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">Настройки уведомлений</h2>
      <div class="frequency-options">
        <div
            v-for="option in frequencyOptions"
            :key="option.value"
            class="frequency-option"
            :class="{ active: frequency === option.value }"
            @click="frequency = option.value"
        >
          <span class="option-label">{{ option.label }}</span>
        </div>
      </div>
    </div>

    <button class="save-button" @click="saveSettings">
      Сохранить настройки
    </button>
    <div v-if="message" class="message" :class="{ error: isError }">
      {{ message }}
    </div>
  </div>
</template>

<script setup>
import {onMounted, ref} from 'vue'

const domain = import.meta.env.VITE_API_BASE_URL

const availableCoins = ref([
  {id: 'bitcoin', symbol: 'btc', name: 'Bitcoin'},
  {id: 'ethereum', symbol: 'eth', name: 'Ethereum'},
  {id: 'tether', symbol: 'usdt', name: 'Tether'},
  {id: 'solana', symbol: 'sol', name: 'Solana'},
  {id: 'tron', symbol: 'trx', name: 'Tron'},
])

const frequencyOptions = ref([
  {value: 'm', label: 'Каждую минуту'},
  {value: 'h', label: 'Каждый час'},
  {value: 'd', label: 'Раз в день'}
])

const trackedCoins = ref([])
const frequency = ref('h')
const message = ref('')
const isError = ref(false)
const chatId = ref('')

const parseParams = (params) => {
  if (params.period && frequencyOptions.value.find(o => o.value === params.period)) {
    frequency.value = params.period
  }
  if (Array.isArray(params.coins)) {
    const validCoins = params.coins.filter(c =>
        availableCoins.value.some(ac => ac.id === c)
    )
    trackedCoins.value = validCoins
  }
  if (params.chatId) {
    chatId.value = String(params.chatId)
  }
}


const loadSettings = async () => {
  if (!chatId.value) return

  try {
    const response = await fetch(`${domain}/track/${chatId.value}`)

    if (response.status === 404) {
      console.warn('Настройки не найдены (404), используем параметры из GET или дефолты')
      return
    }

    if (!response.ok) {
      throw new Error(`Ошибка загрузки настроек: ${response.status}`)
    }

    const data = await response.json()

    if (data.period && frequencyOptions.value.find(o => o.value === data.period)) {
      frequency.value = data.period
    }

    if (Array.isArray(data.coins)) {
      trackedCoins.value = data.coins.filter(c =>
          availableCoins.value.some(ac => ac.id === c)
      )
    }
  } catch (error) {
    console.error('Ошибка при загрузке настроек:', error)
    isError.value = true
    setTimeout(() => {
      message.value = '';
      isError.value = false
    }, 3000)
  }
}

const isCoinTracked = (coinId) => {
  return trackedCoins.value.includes(coinId)
}

const toggleCoinNotification = (coinId) => {
  if (isCoinTracked(coinId)) {
    trackedCoins.value = trackedCoins.value.filter(id => id !== coinId)
  } else {
    trackedCoins.value.push(coinId)
  }
}

const saveSettings = async () => {
  if (!chatId.value) {
    message.value = 'Не удалось определить ID чата'
    isError.value = true
    setTimeout(() => {
      message.value = '';
      isError.value = false
    }, 3000)
    return
  }

  try {
    const response = await fetch(`${domain}/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        period: frequency.value,
        chatId: chatId.value,
        coins: trackedCoins.value
      })
    })

    message.value = 'Настройки успешно сохранены!'
    isError.value = false
  } catch (error) {
    console.error('Ошибка сохранения:', error)
    message.value = 'Произошла ошибка: ' + error.message
    isError.value = true
  } finally {
    setTimeout(() => {
      message.value = '';
      isError.value = false
    }, 3000)
  }
}

onMounted(async () => {
  try {

    chatId.value = localStorage.getItem('telegram_user_id') || ''

    const incomingParams = {}

    parseParams(incomingParams)

    if (chatId.value) {
      await loadSettings()
    }
  } catch (error) {
    console.error('Ошибка инициализации:', error)
    message.value = 'Ошибка инициализации'
    isError.value = true
    setTimeout(() => {
      message.value = '';
      isError.value = false
    }, 3000)
  }
})
</script>


<style scoped>
/* Стили остаются такими же, как в предыдущем примере */
.notification-settings {
  background: var(--bg-primary);
  padding: 20px;
  height: calc(100vh - 99.5px);
  overflow: auto;
  max-width: 500px;
  margin: 0 auto;
}

.title {
  color: var(--text-primary);
  text-align: center;
  margin-bottom: 24px;
  margin-top: 0;
  font-size: 24px;
}

.section {
  margin-bottom: 24px;
}

.section-title {
  color: var(--text-primary);
  font-size: 18px;
  margin-bottom: 16px;
  font-weight: 500;
}

.coin-list {
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
}

.coin-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: background-color 0.2s;
}

.coin-item:hover {
  background-color: var(--bg-hover);
}

.coin-item:last-child {
  border-bottom: none;
}

.coin-name {
  color: var(--text-primary);
  font-size: 15px;
}

.toggle {
  position: relative;
  width: 44px;
  height: 24px;
  border-radius: 12px;
  background-color: var(--bg-secondary);;
  transition: background-color 0.2s;
}

.toggle.active {
  background-color: #007AFF;
}

.toggle-handle {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: white;
  transition: transform 0.2s;
}

.toggle.active .toggle-handle {
  transform: translateX(20px);
}

.frequency-options {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 12px;
}

.frequency-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 8px;
  border-radius: 12px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s;
}

.frequency-option:hover {
  background: var(--bg-hover);
}

.frequency-option.active {
  border-color: #007AFF;
  background: rgba(0, 122, 255, 0.1);
}

.option-label {
  font-size: 13px;
  text-align: center;
  color: var(--text-primary);
}

.save-button {
  width: 100%;
  padding: 14px;
  background: #007AFF;
  color: white;
  border: none;
  border-radius: 12px;
  margin-top: 24px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: opacity 0.2s;
}

.save-button:hover {
  opacity: 0.9;
}

.message {
  text-align: center;
  margin-top: 16px;
  font-size: 14px;
}

.message.error {
  color: #FF3B30;
}

.message:not(.error) {
  color: #34C759;
}
</style>