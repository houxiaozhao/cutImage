import { IMAGE_PROCESSING } from '../config/constants';
import JSZip from 'jszip';

export const validateFile = (file) => {
  if (!IMAGE_PROCESSING.supportedFormats.includes(file.type)) {
    throw new Error(`不支持的文件格式: ${file.type}`);
  }
  if (file.size > IMAGE_PROCESSING.maxFileSize) {
    throw new Error(`文件大小超出限制: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
  }
  return true;
};

/**
 * 处理图片文件
 * @param {File} file - 图片文件
 * @param {Object} options - 处理选项
 * @returns {Promise<Object>} - 处理后的图片信息
 */
export async function processImage(file, options = {}) {
  const {
    quality = 1.0,
    maxWidth = 3840,
    maxHeight = 2160,
    smoothing = true
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      // 计算尺寸
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }

      // 创建画布
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = width;
      canvas.height = height;

      // 设置图像平滑
      if (smoothing) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
      }

      // 绘制图像
      ctx.drawImage(img, 0, 0, width, height);

      // 转换为数据URL
      resolve({
        src: canvas.toDataURL('image/jpeg', quality),
        width,
        height,
        name: file.name,
        size: file.size, // 添加原始文件大小
        id: Date.now()
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`无法加载图片: ${file.name}`));
    };

    img.src = objectUrl;
  });
}

/**
 * 将图片切分为网格
 * @param {Object} image - 图片信息对象
 * @param {Object} options - 切分选项
 * @returns {Promise<Array>} - 切片数组
 */
export async function splitImage(image, options = {}) {
  const {
    gridX = 3,
    gridY = 3,
    quality = 1.0,
    smoothing = true
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const pieces = [];
      const pieceWidth = Math.floor(img.width / gridX);
      const pieceHeight = Math.floor(img.height / gridY);

      // 创建临时画布用于绘制完整图片
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      tempCtx.drawImage(img, 0, 0);

      for (let y = 0; y < gridY; y++) {
        for (let x = 0; x < gridX; x++) {
          // 创建切片画布
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = pieceWidth;
          canvas.height = pieceHeight;

          // 设置图像平滑
          if (smoothing) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
          }

          // 绘制切片
          ctx.drawImage(
            tempCanvas,
            x * pieceWidth,
            y * pieceHeight,
            pieceWidth,
            pieceHeight,
            0,
            0,
            pieceWidth,
            pieceHeight
          );

          // 添加到切片数组
          pieces.push({
            id: `${image.id}_${x}_${y}`,
            src: canvas.toDataURL('image/jpeg', quality),
            name: `${image.name.split('.')[0]}_${x + 1}_${y + 1}.jpg`,
            width: pieceWidth,
            height: pieceHeight,
            position: { x, y }
          });
        }
      }

      resolve(pieces);
    };

    img.onerror = () => {
      reject(new Error('切片处理失败：无法加载图片'));
    };

    // 确保使用的是已经处理过的图片源
    img.src = image.src;
  });
}

/**
 * 导出图片为zip文件
 * @param {Array} pieces - 切片数组
 * @param {Object} options - 导出选项
 * @returns {Promise<Blob>} - zip文件blob
 */
export async function exportImages(pieces, options = {}) {
  const {
    useFolder = true,
    onProgress = null
  } = options;

  const zip = new JSZip();
  const total = pieces.length;
  let completed = 0;

  // 创建所有切片的Promise数组
  const promises = pieces.map(async (piece) => {
    try {
      const response = await fetch(piece.src);
      const blob = await response.blob();
      const path = useFolder
        ? `${piece.name.split('_')[0]}/${piece.name}`
        : piece.name;

      zip.file(path, blob);
      completed++;

      if (onProgress) {
        onProgress(completed / total);
      }
    } catch (err) {
      console.error(`导出切片失败: ${piece.name}`, err);
    }
  });

  // 等待所有切片处理完成
  await Promise.all(promises);

  // 生成zip文件
  return zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 6
    }
  });
}
