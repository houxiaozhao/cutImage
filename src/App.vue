<script setup>
import { ref, computed, onMounted } from "vue";
import JSZip from 'jszip/dist/jszip.min.js';

// 状态管理
const originalImages = ref([]); // 存储原始图片
const currentImageIndex = ref(0); // 当前显示的图片索引
const pieces = ref([]); // 当前显示图片的切片
const images = ref([]);
const gridX = ref(3);
const gridY = ref(3);
const isDarkMode = ref(false);
const showPreview = ref(false);
const currentPreview = ref(null);
const isLoading = ref(false);
const draggedImage = ref(null);
const history = ref([]);
const historyIndex = ref(-1);

// 从本地存储加载设置
onMounted(() => {
  const savedSettings = localStorage.getItem("gridSettings");
  if (savedSettings) {
    const { x, y, darkMode } = JSON.parse(savedSettings);
    gridX.value = x;
    gridY.value = y;
    isDarkMode.value = darkMode;
  }
});

// 保存设置到本地存储
const saveSettings = () => {
  localStorage.setItem(
    "gridSettings",
    JSON.stringify({
      x: gridX.value,
      y: gridY.value,
      darkMode: isDarkMode.value,
    })
  );
};

// 计算属性
const hasImages = computed(() => originalImages.value.length > 0);
const currentImage = computed(() => originalImages.value[currentImageIndex.value]);
const canSwitchPrev = computed(() => currentImageIndex.value > 0);
const canSwitchNext = computed(() => currentImageIndex.value < originalImages.value.length - 1);
const canUndo = computed(() => historyIndex.value > 0);
const canRedo = computed(() => historyIndex.value < history.value.length - 1);

// 切换图片
const switchToPrev = async () => {
  if (canSwitchPrev.value) {
    currentImageIndex.value--;
    await updatePieces();
  }
};

const switchToNext = async () => {
  if (canSwitchNext.value) {
    currentImageIndex.value++;
    await updatePieces();
  }
};

// 更新当前图片的切片
const updatePieces = async () => {
  if (currentImage.value) {
    isLoading.value = true;
    try {
      pieces.value = await splitImage(currentImage.value);
    } finally {
      isLoading.value = false;
    }
  }
};

// 文件上传处理
const handleFileUpload = async event => {
  const files = event.target.files || event.dataTransfer?.files;
  if (!files) return;

  isLoading.value = true;
  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith("image/")) {
        const compressedImage = await compressImage(file);
        const reader = new FileReader();
        reader.onload = async e => {
          const newImage = {
            id: Date.now() + i,
            src: e.target.result,
            name: file.name,
            originalFile: file,
          };
          originalImages.value.push(newImage);

          // 如果是第一张图片，立即显示其切片
          if (originalImages.value.length === 1) {
            await updatePieces();
          }
        };
        reader.readAsDataURL(compressedImage);
      }
    }
  } finally {
    isLoading.value = false;
  }
};

// 图片压缩
const compressImage = async file => {
  return new Promise(resolve => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      // 增加最大尺寸限制
      const maxWidth = 3840;  // 4K
      const maxHeight = 2160; // 4K
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        blob => {
          resolve(new File([blob], file.name, { type: "image/jpeg" }));
        },
        "image/jpeg",
        1.0  // 提高压缩质量到最高
      );
    };
  });
};

// 图片切分功能
const splitImage = async img => {
  return new Promise(resolve => {
    const image = new Image();
    image.src = img.src;
    image.onload = () => {
      const pieces = [];
      const pieceWidth = image.width / gridX.value;
      const pieceHeight = image.height / gridY.value;

      for (let y = 0; y < gridY.value; y++) {
        for (let x = 0; x < gridX.value; x++) {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          
          // 使用原始尺寸
          canvas.width = pieceWidth;
          canvas.height = pieceHeight;
          
          // 使用高质量的图像平滑
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          ctx.drawImage(image, x * pieceWidth, y * pieceHeight, pieceWidth, pieceHeight, 0, 0, pieceWidth, pieceHeight);

          pieces.push({
            id: `${img.id}_${x}_${y}`,
            src: canvas.toDataURL("image/jpeg", 1.0),  // 提高导出质量到最高
            name: `${img.name.split(".")[0]}_${x + 1}_${y + 1}.jpg`,
            originalImage: img,
          });
        }
      }
      resolve(pieces);
    };
  });
};

// 历史记录管理
const addToHistory = () => {
  historyIndex.value++;
  history.value = history.value.slice(0, historyIndex.value);
  history.value.push([...images.value]);
};

const undo = () => {
  if (historyIndex.value > 0) {
    historyIndex.value--;
    images.value = [...history.value[historyIndex.value]];
  }
};

const redo = () => {
  if (historyIndex.value < history.value.length - 1) {
    historyIndex.value++;
    images.value = [...history.value[historyIndex.value]];
  }
};

// 图片操作
const removeImage = async () => {
  if (hasImages.value) {
    originalImages.value = originalImages.value.filter((_, index) => index !== currentImageIndex.value);
    if (originalImages.value.length === 0) {
      pieces.value = [];
      currentImageIndex.value = 0;
    } else {
      currentImageIndex.value = Math.min(currentImageIndex.value, originalImages.value.length - 1);
      await updatePieces();
    }
  }
};

const removeAllImages = () => {
  originalImages.value = [];
  pieces.value = [];
  currentImageIndex.value = 0;
};

const handleDragStart = image => {
  draggedImage.value = image;
};

const handleDrop = targetImage => {
  if (!draggedImage.value || draggedImage.value.id === targetImage.id) return;

  const draggedIndex = images.value.findIndex(img => img.id === draggedImage.value.id);
  const targetIndex = images.value.findIndex(img => img.id === targetImage.id);

  const newImages = [...images.value];
  newImages.splice(draggedIndex, 1);
  newImages.splice(targetIndex, 0, draggedImage.value);

  images.value = newImages;
  addToHistory();
  draggedImage.value = null;
};

// 导出功能
const exportImages = async () => {
  if (!originalImages.value.length) return;

  isLoading.value = true;
  try {
    const zip = new JSZip();
    const allPieces = [];

    // 获取所有图片的切片
    for (const img of originalImages.value) {
      const pieces = await splitImage(img);
      allPieces.push(...pieces);
    }

    // 创建每个图片的文件夹并添加切片
    const promises = allPieces.map(piece => {
      const folderName = piece.originalImage.name.split('.')[0];
      return fetch(piece.src)
        .then(response => response.blob())
        .then(blob => {
          zip.folder(folderName).file(piece.name, blob);
        });
    });

    await Promise.all(promises);
    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(content);
    link.download = "all_images_split.zip";
    link.click();
  } finally {
    isLoading.value = false;
  }
};

// 计算属性
const getGridStyle = img => {
  const width = `${100 / gridX.value}%`;
  const height = `${100 / gridY.value}%`;
  return {
    width,
    height,
    position: "relative",
    aspectRatio: "1",
    padding: "4px",
  };
};
</script>

<template>
  <div :class="['min-h-screen transition-colors duration-300', isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900']">
    <div class="p-4 h-screen flex flex-col">
      <!-- 顶部标题栏 -->
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">图片宫格分割工具</h1>
        <button @click="isDarkMode = !isDarkMode" class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" @change="saveSettings">
          <svg v-if="isDarkMode" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        </button>
      </div>

      <!-- 主要内容区域 - 左右布局 -->
      <div class="flex-1 flex gap-4 min-h-0">
        <!-- 左侧面板 - 控制区域 -->
        <div class="w-80 flex flex-col gap-4">
          <!-- 网格设置 -->
          <div :class="['p-4 rounded-lg border transition-colors', isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200']">
            <h2 class="text-lg font-semibold mb-4">网格设置</h2>
            <div class="space-y-4">
              <label class="block">
                <span :class="isDarkMode ? 'text-gray-300' : 'text-gray-700'">X轴格数:</span>
                <input 
                  type="number" 
                  v-model="gridX" 
                  min="1" 
                  @input="updatePieces"
                  @change="saveSettings"
                  :class="['mt-1 w-full rounded px-3 py-2', isDarkMode ? 'bg-gray-700 border-gray-600' : 'border border-gray-300']"
                />
              </label>
              <label class="block">
                <span :class="isDarkMode ? 'text-gray-300' : 'text-gray-700'">Y轴格数:</span>
                <input 
                  type="number" 
                  v-model="gridY" 
                  min="1" 
                  @input="updatePieces"
                  @change="saveSettings"
                  :class="['mt-1 w-full rounded px-3 py-2', isDarkMode ? 'bg-gray-700 border-gray-600' : 'border border-gray-300']"
                />
              </label>
            </div>
          </div>

          <!-- 图片上传区域 -->
          <div :class="['flex-1 p-4 rounded-lg border transition-colors overflow-hidden flex flex-col', isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200']" @drop.prevent="handleFileUpload" @dragover.prevent>
            <h2 class="text-lg font-semibold mb-4">图片上传</h2>
            <div class="space-y-4 flex-1 min-h-0 flex flex-col">
              <label :class="['block w-full py-4 text-center rounded-lg border-2 border-dashed cursor-pointer transition-colors shrink-0', isDarkMode ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-blue-500', { 'opacity-50 cursor-not-allowed': isLoading }]">
                <span :class="isDarkMode ? 'text-gray-400' : 'text-gray-500'"> 拖拽图片到此处或点击上传 </span>
                <input type="file" @change="handleFileUpload" multiple accept="image/*" class="hidden" :disabled="isLoading" />
              </label>

              <!-- 已上传图片列表 -->
              <div v-if="hasImages" class="space-y-2 overflow-auto flex-1">
                <div
                  v-for="(img, index) in originalImages"
                  :key="img.id"
                  :class="['p-2 rounded flex items-center justify-between cursor-pointer', currentImageIndex === index ? (isDarkMode ? 'bg-gray-700' : 'bg-blue-50') : '']"
                  @click="
                    currentImageIndex = index;
                    updatePieces();
                  ">
                  <span class="truncate flex-1">{{ img.name }}</span>
                  <button
                    @click.stop="
                      currentPreview = originalImages[index];
                      showPreview = true;
                    "
                    class="ml-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧面板 - 显示区域 -->
        <div class="flex-1 flex flex-col gap-4">
          <!-- 工具栏 -->
          <div :class="['p-4 rounded-lg border transition-colors', isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200']">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <button @click="switchToPrev" :disabled="!canSwitchPrev" :class="['p-2 rounded', canSwitchPrev ? 'hover:bg-gray-200 dark:hover:bg-gray-700' : 'opacity-50 cursor-not-allowed']">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <button @click="switchToNext" :disabled="!canSwitchNext" :class="['p-2 rounded', canSwitchNext ? 'hover:bg-gray-200 dark:hover:bg-gray-700' : 'opacity-50 cursor-not-allowed']">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <span v-if="currentImage" class="text-sm"> {{ currentImage.name }} ({{ currentImageIndex + 1 }}/{{ originalImages.length }}) </span>
              </div>

              <div class="flex items-center space-x-2">
                <button v-if="pieces.length" @click="exportImages" class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors" :disabled="isLoading">导出切片</button>

                <button v-if="hasImages" @click="removeImage" class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors">删除当前图片</button>

                <button v-if="hasImages" @click="removeAllImages" class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors">清空全部</button>
              </div>
            </div>
          </div>

          <!-- 切片显示区域 -->
          <div :class="['flex-1 rounded-lg border transition-colors overflow-auto', isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200']">
            <div v-if="pieces.length" class="p-4">
              <div
                class="grid gap-1"
                :style="{
                  gridTemplateColumns: `repeat(${gridX}, 1fr)`,
                  gridTemplateRows: `repeat(${gridY}, 1fr)`,
                }">
                <div v-for="piece in pieces" :key="piece.id" class="relative aspect-square">
                  <img
                    :src="piece.src"
                    :alt="piece.name"
                    class="w-full h-full object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                  />
                </div>
              </div>
            </div>
            <div v-else class="h-full flex items-center justify-center">
              <p :class="isDarkMode ? 'text-gray-400' : 'text-gray-500'">
                {{ hasImages ? "请选择一张图片" : "请上传图片" }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- 加载动画 -->
      <div v-if="isLoading" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>

      <!-- 图片预览模态框 -->
      <div v-if="showPreview && currentPreview" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" @click="showPreview = false">
        <div class="max-w-4xl max-h-[90vh] p-4" @click.stop>
          <img :src="currentPreview.src" :alt="currentPreview.name" class="max-w-full max-h-[80vh] object-contain rounded shadow-lg" />
          <div class="mt-4 text-center text-white">
            <p>{{ currentPreview.name }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
