<template>
  <div class="crypto-card" @click="handleClick">
    <div class="crypto-icon">
      <img
          :src="`${crypto.image}`"
          :alt="crypto.symbol"
          @error="handleImageError"
          v-if="showImage && !imageError"
      >
      <div class="icon-fallback" v-else>
        {{ crypto.symbol.toUpperCase().slice(0, 2) }}
      </div>
    </div>

    <div class="crypto-info">
      <span class="crypto-symbol">{{ crypto.symbol.toUpperCase() }}</span>
      <span class="crypto-name">{{ crypto.name }}</span>
    </div>

    <div class="crypto-price">
      <span class="price">
       $ {{ crypto.current_price.toLocaleString('ru-RU') }}
      </span>
      <span
          class="price-change"
          :class="{ positive: crypto.price_change_percentage_24h >= 0, negative: crypto.price_change_percentage_24h < 0 }"
      >
        {{crypto.price_change_percentage_24h >= 0 ? '↑' : '↓'
        }} {{ Math.abs(crypto.price_change_percentage_24h).toFixed(2) }}%
      </span>
    </div>
  </div>
</template>

<script setup>
import {ref} from 'vue'

const props = defineProps({
  crypto: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['click'])

const showImage = ref(true)
const imageError = ref(false)

const handleClick = () => {
  emit('click', props.crypto.id)
}

const handleImageError = () => {
  imageError.value = true
}
</script>

<style scoped>
.crypto-card {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: var(--bg-secondary);
  border-radius: 12px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: transform 0.2s;
  gap: 12px;
}

.crypto-card:active {
  transform: scale(0.98);
}

.crypto-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--bg-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.crypto-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.icon-fallback {
  font-weight: bold;
  font-size: 14px;
  color: var(--text-primary);
}

.crypto-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.crypto-symbol {
  font-weight: 600;
  font-size: 16px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.crypto-name {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.crypto-price {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.price {
  font-weight: 600;
  font-size: 16px;
  color: var(--text-primary);
}

.price-change {
  font-size: 12px;
  margin-top: 2px;
}

.positive {
  color: #34C759;
}

.negative {
  color: #FF3B30;
}
</style>