<template>
  <div class="flex flex-col h-full">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold" :class="isDarkMode ? 'text-white' : 'text-gray-900'">
        图片列表
      </h3>
      <div class="flex space-x-2">
        <button
          @click="$emit('removeAll')"
          :disabled="!hasImages"
          :class="[
            'px-2 py-1 rounded text-sm transition-colors',
            isDarkMode
              ? 'bg-red-600 hover:bg-red-700 text-white disabled:bg-red-800'
              : 'bg-red-500 hover:bg-red-600 text-white disabled:bg-red-300'
          ]"
        >
          清空
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-auto min-h-0">
      <div v-if="hasImages" class="space-y-2">
        <div
          v-for="(img, index) in images"
          :key="img.id"
          :class="[
            'group p-2 rounded flex items-center space-x-2 cursor-pointer transition-colors',
            currentIndex === index
              ? isDarkMode
                ? 'bg-gray-700'
                : 'bg-blue-50'
              : isDarkMode
              ? 'hover:bg-gray-800'
              : 'hover:bg-gray-50'
          ]"
          @click="$emit('select', index)"
        >
          <!-- 缩略图 -->
          <div class="w-12 h-12 shrink-0">
            <img
              :src="img.src"
              :alt="img.name"
              class="w-full h-full object-cover rounded"
              @load="updateImageDimensions(img, $event)"
            />
          </div>

          <!-- 图片信息 -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center space-x-2">
              <span
                class="text-sm font-medium truncate"
                :class="isDarkMode ? 'text-white' : 'text-gray-900'"
              >
                {{ img.name }}
              </span>
            </div>
            <div class="text-xs" :class="isDarkMode ? 'text-gray-400' : 'text-gray-500'">
              {{ formatSize(img.size) }} |
              {{ img.width }}x{{ img.height }}
            </div>
          </div>

          <!-- 操作按钮 -->
          <button
            @click.stop="$emit('remove', index)"
            class="p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
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
        class="h-full flex items-center justify-center"
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

const emit = defineEmits(['select', 'remove', 'removeAll']);

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
