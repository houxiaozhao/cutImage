<template>
  <div class="space-y-4">
    <h2 class="text-lg font-semibold transition-colors duration-300" :class="isDarkMode ? 'text-white' : 'text-gray-900'">网格设置</h2>

    <!-- 预设选项 -->
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
      <button v-for="preset in gridPresets" :key="preset.name" @click="selectPreset(preset)" :class="['px-2 sm:px-3 py-2 rounded text-xs sm:text-sm transition-all duration-300 transform hover:scale-105 shadow-sm', isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900']">
        {{ preset.name }}
      </button>
    </div>

    <!-- 自定义设置 -->
    <div class="grid grid-cols-2 gap-3 sm:gap-4">
      <label class="block">
        <span :class="['text-sm sm:text-base transition-colors duration-300', isDarkMode ? 'text-gray-300' : 'text-gray-700']">X轴格数:</span>
        <input type="number" v-model="localGridX" min="1" @input="updateGrid" :class="['mt-1 w-full rounded px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50', isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' : 'border border-gray-300 text-gray-900 focus:border-blue-500']" />
      </label>

      <label class="block">
        <span :class="['text-sm sm:text-base transition-colors duration-300', isDarkMode ? 'text-gray-300' : 'text-gray-700']">Y轴格数:</span>
        <input type="number" v-model="localGridY" min="1" @input="updateGrid" :class="['mt-1 w-full rounded px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50', isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' : 'border border-gray-300 text-gray-900 focus:border-blue-500']" />
      </label>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { GRID_PRESETS } from "../config/constants";

const props = defineProps({
  gridX: {
    type: Number,
    required: true,
  },
  gridY: {
    type: Number,
    required: true,
  },
  isDarkMode: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:gridX", "update:gridY", "update"]);

const localGridX = ref(props.gridX);
const localGridY = ref(props.gridY);
const gridPresets = GRID_PRESETS;

watch(
  () => props.gridX,
  newVal => {
    localGridX.value = newVal;
  }
);

watch(
  () => props.gridY,
  newVal => {
    localGridY.value = newVal;
  }
);

const selectPreset = preset => {
  localGridX.value = preset.x;
  localGridY.value = preset.y;
  updateGrid();
};

const updateGrid = () => {
  emit("update:gridX", parseInt(localGridX.value));
  emit("update:gridY", parseInt(localGridY.value));
  emit("update", {
    gridX: parseInt(localGridX.value),
    gridY: parseInt(localGridY.value),
  });
};
</script>
