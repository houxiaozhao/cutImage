<template>
  <div class="flex flex-col h-full">
    <div class="flex items-center justify-between mb-3 sm:mb-4">
      <h3 class="text-base sm:text-lg font-semibold transition-colors duration-300" :class="isDarkMode ? 'text-white' : 'text-gray-900'">
        图片列表
      </h3>
      <div class="flex space-x-2">
        <button
          @click="$emit('clearAll')"
          :disabled="!hasImages"
          :class="[
            'px-2 py-1 rounded text-xs sm:text-sm transition-all duration-300 transform hover:scale-105 shadow-sm',
            isDarkMode
              ? 'bg-red-600 hover:bg-red-700 text-white disabled:bg-red-800'
              : 'bg-red-500 hover:bg-red-600 text-white disabled:bg-red-300'
          ]"
        >
          清空
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-auto min-h-0 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent hover:scrollbar-thumb-gray-500">
      <div v-if="hasImages" class="space-y-1.5 sm:space-y-2">
        <div
          v-for="(img, index) in images"
          :key="img.id"
          :class="[
            'group p-1.5 sm:p-2 rounded-lg flex items-center space-x-2 cursor-pointer transition-all duration-300 transform hover:translate-x-1 shadow-sm hover:shadow-md animate-slideIn',
            currentIndex === index
              ? isDarkMode
                ? 'bg-gray-700 shadow-md'
                : 'bg-blue-50 shadow-md'
              : isDarkMode
              ? 'hover:bg-gray-800'
              : 'hover:bg-gray-50'
          ]"
          @click="$emit('select', index)"
        >
          <!-- 缩略图 -->
          <div class="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-lg overflow-hidden shadow-sm transition-transform duration-300 group-hover:scale-105">
            <img
              :src="img.src"
              :alt="img.name"
              class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              @load="updateImageDimensions(img, $event)"
            />
          </div>

          <!-- 图片信息 -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center space-x-2">
              <span
                class="text-xs sm:text-sm font-medium truncate transition-colors duration-300"
                :class="isDarkMode ? 'text-white' : 'text-gray-900'"
              >
                {{ img.name }}
              </span>
            </div>
            <div class="text-xs transition-colors duration-300" :class="isDarkMode ? 'text-gray-400' : 'text-gray-500'">
              {{ formatSize(img.size) }} |
              {{ img.width }}x{{ img.height }}
            </div>
          </div>

          <!-- 操作按钮 -->
          <button
            @click.stop="$emit('remove', index)"
            class="p-1 rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300 transform hover:scale-110 hover:rotate-90"
            :class="isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'"
          >
            <svg
              class="w-4 h-4"
              :class="isDarkMode ? 'text-gray-400' : 'text-gray-500'"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
      <div
        v-else
        class="h-full flex items-center justify-center transition-colors duration-300"
        :class="isDarkMode ? 'text-gray-400' : 'text-gray-500'"
      >
        暂无图片
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  images: {
    type: Array,
    required: true
  },
  currentIndex: {
    type: Number,
    required: true
  },
  isDarkMode: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['select', 'remove', 'clearAll']);

const hasImages = computed(() => props.images.length > 0);

// 格式化文件大小
const formatSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

// 更新图片尺寸信息
const updateImageDimensions = (img, event) => {
  if (event.target) {
    img.width = event.target.naturalWidth;
    img.height = event.target.naturalHeight;
  }
};
</script>

<style>
/* 自定义滚动条样式 */
.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background: currentColor;
  border-radius: 3px;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: currentColor;
}

/* 添加列表项动画 */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-slideIn {
  animation: slideIn 0.3s ease-out forwards;
}
</style>
