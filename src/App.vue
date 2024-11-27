<template>
  <div class="min-h-screen transition-colors duration-300" :class="isDarkMode ? 'bg-gray-900' : 'bg-gray-50'">
    <div class="container mx-auto p-4">
      <!-- 标题栏 -->
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold transition-colors duration-300" :class="isDarkMode ? 'text-white' : 'text-gray-900'">图片切片工具</h1>
        <button @click="toggleDarkMode" class="p-2 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-sm" :class="isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'">
          <svg class="w-5 h-5 transition-colors duration-300" :class="isDarkMode ? 'text-yellow-500' : 'text-gray-500'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path v-if="isDarkMode" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        </button>
      </div>

      <div class="mb-6 text-center">
        <p class="text-sm mb-2 transition-colors duration-300" :class="isDarkMode ? 'text-gray-300' : 'text-gray-600'">完全免费的在线图片切片工具，无需安装任何软件</p>
        <div class="flex flex-wrap justify-center gap-4 text-xs">
          <span class="px-3 py-1 rounded-full transition-colors duration-300" :class="isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'"><span class="mr-1">✨</span>永久免费使用</span>
          <span class="px-3 py-1 rounded-full transition-colors duration-300" :class="isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'"><span class="mr-1">🔒</span>纯前端处理，保护隐私</span>
          <span class="px-3 py-1 rounded-full transition-colors duration-300" :class="isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'"><span class="mr-1">📦</span>无文件大小限制</span>
          <span class="px-3 py-1 rounded-full transition-colors duration-300" :class="isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'"><span class="mr-1">🔄</span>批量处理无数量限制</span>
        </div>
      </div>

      <!-- 主要内容 -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
        <!-- 左侧面板 -->
        <div class="md:col-span-1 flex flex-col h-auto md:h-[calc(100vh-12rem)] space-y-4">
          <!-- 图片上传区域 -->
          <div :class="['p-3 rounded-lg border-2 border-dashed transition-all duration-300 shadow-sm hover:shadow-md', isDarkMode ? 'bg-gray-800 border-gray-700 hover:border-gray-600' : 'bg-white border-gray-300 hover:border-blue-500']" @drop.prevent="handleFileDrop" @dragover.prevent>
            <div class="space-y-1">
              <div class="flex items-center justify-between mb-1">
                <h3 class="font-medium" :class="isDarkMode ? 'text-white' : 'text-gray-900'">上传图片</h3>
                <button v-if="hasImages" @click="removeAllImages" class="text-xs px-2 py-0.5 rounded" :class="isDarkMode ? 'text-gray-400 hover:text-red-400' : 'text-gray-500 hover:text-red-500'">清空</button>
              </div>

              <label class="block cursor-pointer">
                <div class="py-2 text-center">
                  <div class="mb-1">
                    <svg class="mx-auto h-6 w-6" :class="isDarkMode ? 'text-gray-400' : 'text-gray-400'" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v24a4 4 0 004 4h24a4 4 0 004-4V20m-8-12v12m0-12l-8-8m8 8l8-8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </div>
                  <span :class="isDarkMode ? 'text-gray-400' : 'text-gray-500'" class="text-xs">拖拽图片到此处或点击上传</span>
                </div>
                <input type="file" @change="handleFileSelect" multiple accept="image/*" class="hidden" :disabled="isLoading" />
              </label>
            </div>
          </div>

          <!-- 网格设置 -->
          <div :class="['p-3 rounded-lg border transition-all duration-300 shadow-sm hover:shadow-md', isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200']">
            <GridSettings v-model:gridX="gridX" v-model:gridY="gridY" :is-dark-mode="isDarkMode" @update="updatePiecesWithOptions" />
            <div class="mt-4">
              <button @click="exportAllImagesSlices" :disabled="!hasImages || isLoading" :class="['w-full px-4 py-2 rounded transition-all duration-300 transform hover:scale-105 shadow-sm text-white', isDarkMode ? 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800' : 'bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300']">
                {{ isLoading ? "导出中..." : "导出全部切片" }}
              </button>
            </div>
          </div>

          <!-- 图片列表 -->
          <div :class="['flex-1 p-3 rounded-lg border transition-all duration-300 shadow-sm hover:shadow-md overflow-hidden flex flex-col', isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200']">
            <div class="flex-1 overflow-auto">
              <ImageList :images="originalImages" :current-index="currentImageIndex" :is-dark-mode="isDarkMode" @select="selectImage" @remove="removeImage" @clearAll="removeAllImages" />
            </div>
          </div>
        </div>

        <!-- 右侧内容：切片预览 -->
        <div class="md:col-span-3">
          <div :class="['p-2 md:p-4 rounded-lg border transition-all duration-300 shadow-sm hover:shadow-md min-h-[50vh] md:h-[calc(100vh-12rem)] overflow-auto', isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200']">
            <div class="space-y-4">
              <div v-if="pieces.length > 0" class="relative">
                <div class="grid gap-1" :style="{ gridTemplateColumns: `repeat(${Math.min(gridX, 4)}, minmax(0, 1fr))` }">
                  <div v-for="piece in pieces" :key="piece.id" class="relative aspect-square group overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <img :src="piece.src" :alt="piece.name" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  </div>
                </div>
              </div>
              <div v-else class="flex items-center justify-center h-[calc(100vh-15rem)]" :class="isDarkMode ? 'text-gray-400' : 'text-gray-500'">
                <div class="text-center">
                  <svg class="mx-auto h-12 w-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {{ hasImages ? "请选择一张图片" : "请上传图片开始" }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载动画 -->
    <div v-if="isLoading" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300">
      <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 shadow-lg"></div>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="fixed bottom-4 right-4 max-w-sm p-4 rounded-lg bg-red-500 text-white shadow-lg transform transition-all duration-300 animate-slideIn">
      {{ error }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useImageState } from "./composables/useImageState";
import ImageList from "./components/ImageList.vue";
import GridSettings from "./components/GridSettings.vue";
import { exportImages } from "./utils/imageProcessing";

// 状态管理
const { originalImages, currentImageIndex, pieces, isLoading, error, processingOptions, hasImages, currentImage, handleFileUpload: handleFiles, updatePieces, removeImage, removeAllImages } = useImageState();

// 网格设置
const gridX = ref(3);
const gridY = ref(3);
const isDarkMode = ref(false);

// 方法
const handleFileSelect = event => {
  const files = Array.from(event.target.files);
  handleFiles(files);
};

const handleFileDrop = event => {
  const files = Array.from(event.dataTransfer.files);
  handleFiles(files);
};

const selectImage = index => {
  currentImageIndex.value = index;
  updatePiecesWithOptions();
};

const updatePiecesWithOptions = (options = {}) => {
  updatePieces(gridX.value, gridY.value, {
    ...processingOptions.value,
    ...options,
  });
};

const exportAllImagesSlices = async () => {
  if (!originalImages.value.length) return;

  isLoading.value = true;
  error.value = "";

  try {
    // 创建一个数组来存储所有图片的切片
    const allPieces = [];

    // 遍历所有图片
    for (let i = 0; i < originalImages.value.length; i++) {
      // 选择当前图片
      currentImageIndex.value = i;
      // 更新切片
      await updatePieces(gridX.value, gridY.value, processingOptions.value);
      // 将当前图片的切片添加到数组中，并添加图片名称前缀
      const imageName = originalImages.value[i].name.split(".")[0];
      pieces.value.forEach((piece, index) => {
        allPieces.push({
          ...piece,
          name: `${imageName}_${index + 1}.${piece.name.split(".").pop()}`,
        });
      });
    }

    // 导出所有切片
    const blob = await exportImages(allPieces, {
      useFolder: true,
      onProgress: progress => {
        console.log(`导出进度: ${(progress * 100).toFixed(1)}%`);
      },
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "all_images_split.zip";
    link.click();
    URL.revokeObjectURL(link.href);
  } catch (err) {
    error.value = "导出失败: " + err.message;
  } finally {
    isLoading.value = false;
  }
};

const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value;
  localStorage.setItem("darkMode", isDarkMode.value);
};

// 初始化
onMounted(() => {
  isDarkMode.value = localStorage.getItem("darkMode") === "true";
  const savedGridX = localStorage.getItem("gridX");
  const savedGridY = localStorage.getItem("gridY");
  if (savedGridX) gridX.value = parseInt(savedGridX);
  if (savedGridY) gridY.value = parseInt(savedGridY);
});
</script>
