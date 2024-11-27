import { ref, computed } from 'vue';
import { processImage, splitImage } from '../utils/imageProcessing';

export function useImageState() {
  // 基本状态
  const originalImages = ref([]);
  const currentImageIndex = ref(0);
  const pieces = ref([]);
  const isLoading = ref(false);
  const error = ref(null);
  const processingOptions = ref({
    quality: 1.0,
    maxWidth: 3840,
    maxHeight: 2160,
    smoothing: true
  });

  // 计算属性
  const hasImages = computed(() => originalImages.value.length > 0);
  const currentImage = computed(() => originalImages.value[currentImageIndex.value]);

  // 文件处理
  const handleFileUpload = async (files) => {
    if (!files?.length) return;

    isLoading.value = true;
    error.value = null;

    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          console.warn(`跳过非图片文件: ${file.name}`);
          continue;
        }

        // 检查是否存在同名图片
        const existingImage = originalImages.value.find(img => img.name === file.name);
        if (existingImage) {
          error.value = `已存在同名图片: ${file.name}`;
          continue;
        }

        const processedImage = await processImage(file, processingOptions.value);
        if (processedImage) {
          processedImage.size = file.size; // 保存原始文件大小
          originalImages.value.push(processedImage);
        }
      }

      // 如果是第一次上传，自动显示第一张图片的切片
      if (originalImages.value.length && currentImageIndex.value === 0) {
        await updatePieces(3, 3);
      }
    } catch (err) {
      error.value = `处理图片时出错: ${err.message}`;
      console.error('图片处理错误:', err);
    } finally {
      isLoading.value = false;
    }
  };

  // 更新切片
  const updatePieces = async (gridX, gridY, options = {}) => {
    if (!currentImage.value) return;

    isLoading.value = true;
    error.value = null;

    try {
      // 确保图片已加载
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = () => {
          const currentImg = currentImage.value;
          currentImg.width = img.width;
          currentImg.height = img.height;
          resolve();
        };
        img.onerror = () => reject(new Error('加载图片失败'));
        img.src = currentImage.value.src;
      });

      const newPieces = await splitImage(currentImage.value, {
        gridX,
        gridY,
        ...processingOptions.value,
        ...options
      });

      pieces.value = newPieces;
    } catch (err) {
      error.value = `生成切片时出错: ${err.message}`;
      console.error('切片生成错误:', err);
      pieces.value = [];
    } finally {
      isLoading.value = false;
    }
  };

  // 图片管理
  const removeImage = (index = currentImageIndex.value) => {
    if (!hasImages.value) return;

    originalImages.value = originalImages.value.filter((_, i) => i !== index);
    if (originalImages.value.length === 0) {
      pieces.value = [];
      currentImageIndex.value = 0;
    } else {
      currentImageIndex.value = Math.min(currentImageIndex.value, originalImages.value.length - 1);
      updatePieces(3, 3);
    }
  };

  const removeAllImages = () => {
    originalImages.value = [];
    pieces.value = [];
    currentImageIndex.value = 0;
  };

  return {
    // 状态
    originalImages,
    currentImageIndex,
    pieces,
    isLoading,
    error,
    processingOptions,

    // 计算属性
    hasImages,
    currentImage,

    // 方法
    handleFileUpload,
    updatePieces,
    removeImage,
    removeAllImages
  };
}
