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
            max="1e15"
            @input="handleInput"
        />

        <div class="custom-select" @click="toggleDropdown('from')">
          <span>{{ getSymbol(fromCurrency) }}</span>
          <svg class="arrow" :class="{ open: dropdownOpen.from }" viewBox="0 0 24 24" width="16" height="16">
            <path d="M7 10l5 5 5-5z" fill="currentColor"/>
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
            <path d="M7 10l5 5 5-5z" fill="currentColor"/>
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
import {ref, onMounted, watch} from 'vue'
import axios from 'axios'

const API_URL = 'https://api.coingecko.com/api/v3/simple/price'

const amount = ref(1)
const fromCurrency = ref('bitcoin')
const toCurrency = ref('usd')
const convertedAmount = ref('0.00')
const conversionRate = ref(null)
const error = ref(null)
const loading = ref(false)
const dropdownOpen = ref({from: false, to: false})
const rates = ref({})

// Валюты для выбора
const currencyOptions = [
  {id: 'bitcoin', symbol: 'BTC'},
  {id: 'ethereum', symbol: 'ETH'},
  {id: 'usd', symbol: 'USD'},
  {id: 'solana', symbol: 'SOL'},
  {id: 'tron', symbol: 'TRX'},
]

const getSymbol = (id) => {
  const coin = currencyOptions.find(c => c.id === id)
  return coin ? coin.symbol : id
}

const handleInput = (e) => {
  const value = parseFloat(e.target.value)
  if (isNaN(value) || value < 0) {
    amount.value = 0
  } else if (value > 1e15) {
    amount.value = 1e15
    error.value = 'Введено максимально допустимое значение'
  } else {
    amount.value = value
    error.value = null
  }
  convertCurrency()
}

const formatNumber = (num) => {
  if (num === 0) return '0.00'

  // Для очень больших чисел
  if (num >= 1e6) {
    return num.toExponential(4)
  }

  // Определяем количество знаков после запятой
  if (num >= 1000) {
    return num.toLocaleString(undefined, {maximumFractionDigits: 2})
  } else if (num >= 1) {
    return num.toLocaleString(undefined, {maximumFractionDigits: 4})
  } else if (num >= 0.01) {
    return num.toLocaleString(undefined, {maximumFractionDigits: 6})
  } else {
    return num.toLocaleString(undefined, {maximumFractionDigits: 8})
  }
}

const fetchRates = async () => {
  try {
    loading.value = true
    error.value = null

    const ids = currencyOptions.map(c => c.id).join(',')
    const response = await axios.get(API_URL, {
      params: {
        ids,
        vs_currencies: 'usd'
      }
    })

    const pricesUSD = response.data
    rates.value = {}

    currencyOptions.forEach(c1 => {
      rates.value[c1.id] = {}
      currencyOptions.forEach(c2 => {
        if (c1.id === c2.id) {
          rates.value[c1.id][c2.id] = 1
        } else if (c1.id === 'usd') {
          rates.value[c1.id][c2.id] = 1 / (pricesUSD[c2.id]?.usd || 1)
        } else if (c2.id === 'usd') {
          rates.value[c1.id][c2.id] = pricesUSD[c1.id]?.usd || 1
        } else {
          rates.value[c1.id][c2.id] = (pricesUSD[c1.id]?.usd || 1) / (pricesUSD[c2.id]?.usd || 1)
        }
      })
    })

  } catch (err) {
    error.value = 'Ошибка загрузки данных. Попробуйте позже.'
    console.error('API error:', err)
  } finally {
    loading.value = false
  }
}

const convertCurrency = () => {
  try {
    error.value = null

    if (amount.value > Number.MAX_SAFE_INTEGER) {
      error.value = 'Слишком большое число'
      convertedAmount.value = '∞'
      conversionRate.value = null
      return
    }

    if (!rates.value[fromCurrency.value] || !rates.value[fromCurrency.value][toCurrency.value]) {
      convertedAmount.value = '0.00'
      conversionRate.value = null
      return
    }

    if (fromCurrency.value === toCurrency.value) {
      convertedAmount.value = formatNumber(amount.value)
      conversionRate.value = '1.000000'
      return
    }

    const rate = rates.value[fromCurrency.value][toCurrency.value]
    conversionRate.value = formatNumber(rate)
    const result = amount.value * rate

    convertedAmount.value = formatNumber(result)

  } catch (err) {
    error.value = 'Ошибка конвертации. Попробуйте позже.'
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
  max-width: 500px;
  margin: 0 auto;
  background: var(--bg-secondary);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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
  background: var(--bg-secondary);
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
  padding: 14px 16px;
  position: absolute;
  right: 10dvw;
  border-top-right-radius: 16px;
  border-bottom-right-radius: 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  cursor: pointer;
  user-select: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 700;
  font-size: 18px;
  color: var(--text-primary);
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  min-width: 90px;
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
  top: 100%;
  right: 0;
  width: 120px;
  background: var(--bg-secondary);
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.12);
  max-height: 160px;
  overflow-y: auto;
  z-index: 10;
  padding: 0;
  margin: 4px 0 0 0;
  list-style: none;
  font-weight: 600;
  font-size: 16px;
}

.dropdown-list li {
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  color: var(--text-primary);
}

.dropdown-list li:hover {
  background: var(--accent-color);
  color: white;
}

.dropdown-list li.selected {
  background: rgba(0, 122, 255, 0.1);
  color: var(--accent-color);
}

.swap-icon {
  text-align: center;
  margin: 8px 0 20px 0;
  cursor: pointer;
  font-size: 28px;
  user-select: none;
  transition: transform 0.3s ease, color 0.3s ease;
  color: var(--accent-color);
}

.swap-icon:hover {
  color: #0051a8;
  transform: rotate(180deg);
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