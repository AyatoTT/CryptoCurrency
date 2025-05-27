<template>
  <div class="converter-view">
    <h1 class="title">Конвертер валют</h1>
    <div class="converter-card">
      <div class="input-group">
        <input
            v-model.number="amount"
            type="number"
            placeholder="0.00"
            class="amount-input"
            min="0"
            @input="convertCurrency"
        />

        <div class="custom-select" @click="toggleDropdown('from')">
          <span>{{ getSymbol(fromCurrency) }}</span>
          <svg class="arrow" :class="{ open: dropdownOpen.from }" viewBox="0 0 24 24" width="16" height="16">
            <path d="M7 10l5 5 5-5z" fill="currentColor" />
          </svg>

          <ul v-if="dropdownOpen.from" class="dropdown-list">
            <li
                v-for="coin in currencyOptions"
                :key="coin.id"
                @click.stop="selectCurrency('from', coin.id)"
                :class="{ selected: fromCurrency === coin.id }"
            >
              {{ coin.symbol.toUpperCase() }}
            </li>
          </ul>
        </div>
      </div>

      <div class="swap-icon" @click="swapCurrencies" title="Поменять местами">🔄</div>

      <div class="input-group">
        <input
            :value="convertedAmount"
            type="text"
            placeholder="0.00"
            class="amount-input"
            readonly
        />

        <div class="custom-select" @click="toggleDropdown('to')">
          <span>{{ getSymbol(toCurrency) }}</span>
          <svg class="arrow" :class="{ open: dropdownOpen.to }" viewBox="0 0 24 24" width="16" height="16">
            <path d="M7 10l5 5 5-5z" fill="currentColor" />
          </svg>

          <ul v-if="dropdownOpen.to" class="dropdown-list">
            <li
                v-for="coin in currencyOptions"
                :key="coin.id"
                @click.stop="selectCurrency('to', coin.id)"
                :class="{ selected: toCurrency === coin.id }"
            >
              {{ coin.symbol.toUpperCase() }}
            </li>
          </ul>
        </div>
      </div>

      <div class="conversion-info">
        <div v-if="conversionRate" class="rate">
          1 {{ getSymbol(fromCurrency).toUpperCase() }} = {{ conversionRate }} {{ getSymbol(toCurrency).toUpperCase() }}
        </div>
        <div v-if="error" class="error-message">{{ error }}</div>
        <div v-if="loading" class="loading-message">Загрузка...</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import axios from 'axios'

const API_URL = 'https://api.coingecko.com/api/v3/simple/price'

const amount = ref(1)
const fromCurrency = ref('bitcoin')
const toCurrency = ref('usd')
const convertedAmount = ref('0.00')
const conversionRate = ref(null)
const error = ref(null)
const loading = ref(false)
const dropdownOpen = ref({ from: false, to: false })

// Валюты для выбора — можно расширять
const currencyOptions = [
  { id: 'bitcoin', symbol: 'BTC' },
  { id: 'ethereum', symbol: 'ETH' },
  { id: 'usd', symbol: 'USD' },
]

const getSymbol = (id) => {
  const coin = currencyOptions.find(c => c.id === id)
  return coin ? coin.symbol : id
}

const fetchRates = async () => {
  try {
    loading.value = true
    error.value = null

    const ids = currencyOptions.map(c => c.id).join(',')
    // Запрашиваем цены по всем валютам относительно USD
    // API вернет объект { bitcoin: { usd: 50000 }, ethereum: { usd: 3000 }, ... }
    const response = await axios.get(API_URL, {
      params: {
        ids,
        vs_currencies: 'usd'
      }
    })

    // Соберём курс конвертации из API данных
    // В итоге нам нужно уметь конвертировать любую валюту в любую,
    // так что считаем их курс через USD
    const pricesUSD = response.data

    // Добавим удобство — кэшируем курсы в объекте:
    // ex: rates['bitcoin']['ethereum'] = ...
    rates.value = {}

    currencyOptions.forEach(c1 => {
      rates.value[c1.id] = {}
      currencyOptions.forEach(c2 => {
        if (c1.id === c2.id) {
          rates.value[c1.id][c2.id] = 1
        } else if (c1.id === 'usd') {
          // usd к другим валютам — 1 / цена той валюты в usd
          rates.value[c1.id][c2.id] = 1 / (pricesUSD[c2.id]?.usd || 1)
        } else if (c2.id === 'usd') {
          rates.value[c1.id][c2.id] = pricesUSD[c1.id]?.usd || 1
        } else {
          // Для конвертации из одной крипты в другую:
          // c1 -> usd, usd -> c2
          rates.value[c1.id][c2.id] = (pricesUSD[c1.id]?.usd || 1) / (pricesUSD[c2.id]?.usd || 1)
        }
      })
    })

  } catch (err) {
    error.value = 'Failed to load data from API. Please try again later.'
    console.error('API error:', err)
  } finally {
    loading.value = false
  }
}

const rates = ref({})

const convertCurrency = () => {
  try {
    error.value = null
    if (!rates.value[fromCurrency.value] || !rates.value[fromCurrency.value][toCurrency.value]) {
      convertedAmount.value = '0.00'
      conversionRate.value = null
      return
    }

    if (fromCurrency.value === toCurrency.value) {
      convertedAmount.value = amount.value.toFixed(6)
      conversionRate.value = '1.000000'
      return
    }

    const rate = rates.value[fromCurrency.value][toCurrency.value]
    conversionRate.value = rate.toFixed(6)
    convertedAmount.value = (amount.value * rate).toFixed(6)

  } catch (err) {
    error.value = 'Conversion failed. Try again later.'
    console.error('Conversion error:', err)
  }
}

const swapCurrencies = () => {
  const temp = fromCurrency.value
  fromCurrency.value = toCurrency.value
  toCurrency.value = temp
  convertCurrency()
}

const toggleDropdown = (which) => {
  dropdownOpen.value[which] = !dropdownOpen.value[which]
  if (which === 'from') dropdownOpen.value.to = false
  if (which === 'to') dropdownOpen.value.from = false
}

const selectCurrency = (which, id) => {
  if (which === 'from') fromCurrency.value = id
  else toCurrency.value = id

  dropdownOpen.value[which] = false
  convertCurrency()
}

// Закрыть дропдауны при клике вне компонента
const closeDropdowns = (e) => {
  if (!e.target.closest('.custom-select')) {
    dropdownOpen.value.from = false
    dropdownOpen.value.to = false
  }
}

onMounted(async () => {
  document.addEventListener('click', closeDropdowns)
  await fetchRates()
  convertCurrency()
})

// Автоматически пересчитываем при изменении валют
watch([fromCurrency, toCurrency], convertCurrency)
</script>

<style scoped>
:root {
  --bg-primary: #f9f9f9;
  --bg-secondary: #fff;
  --border-color: #ddd;
  --text-primary: #111;
  --text-secondary: #555;
  --accent-color: #007aff;
}

.converter-view {
  padding: 16px;
  background: var(--bg-primary);
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
  Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
}

.title {
  color: var(--text-primary);
  text-align: center;
  margin-bottom: 20px;
  font-weight: 600;
  font-size: 28px;
}

.converter-card {
  border-radius: 20px;
  padding: 24px;
  margin: 0 auto;
}

.input-group {
  display: flex;
  margin-bottom: 20px;
  border: 1px solid var(--border-color);
  border-radius: 16px;
  overflow: hidden;
  align-items: center;
}

.amount-input {
  flex: 1;
  padding: 14px 16px;
  border: none;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 18px;
  font-weight: 600;
  outline-offset: 2px;
  outline-color: transparent;
  transition: outline-color 0.2s ease;
}

.amount-input:focus {
  outline-color: var(--accent-color);
}

.custom-select {
  position: absolute;
  right: 5dvw;
  width: 90px;

  padding: 14px 16px;
  background: var(--bg-primary);
  border-radius: 0;
  border: 1px solid var(--border-color);
  border-top-right-radius: 16px;
  border-bottom-right-radius: 16px;
  cursor: pointer;
  user-select: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 700;
  font-size: 18px;
  color: var(--text-primary);
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.arrow {
  transition: transform 0.3s ease;
  fill: var(--accent-color);
  margin-left: 8px;
}

.arrow.open {
  transform: rotate(180deg);
}

.dropdown-list {
  position: absolute;
  top: 110%;
  left: 0;
  width: 100%;
  background: var(--bg-secondary);
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.12);
  max-height: 160px;
  overflow-y: auto;
  z-index: 10;
  padding: 0;
  margin: 8px 0 0 0;
  list-style: none;
  font-weight: 600;
  font-size: 16px;
}

.dropdown-list li {
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  color: var(--text-primary);
  border-radius: 16px;
}

.dropdown-list li:hover {
  background: var(--accent-color);
  color: white;
}

.dropdown-list li.selected {
  background: var(--accent-color);
  color: #007AFFFF;
  font-weight: 700;
}

.swap-icon {
  text-align: center;
  margin: 8px 0 20px 0;
  cursor: pointer;
  font-size: 28px;
  user-select: none;
  transition: color 0.3s ease;
  color: var(--accent-color);
}

.swap-icon:hover {
  color: #0051a8;
}

.conversion-info {
  margin-top: 16px;
  text-align: center;
  font-weight: 600;
  font-size: 16px;
  color: var(--text-secondary);
}

.rate {
  margin-bottom: 8px;
}

.error-message {
  color: #ff3b30;
  margin-top: 8px;
}

.loading-message {
  color: var(--accent-color);
  margin-top: 8px;
}
</style>
