import { DevicePreset } from '../constants/storeAssets';

export const roundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
};

export const createCanvasGradient = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  colors: string[],
): CanvasGradient => {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  colors.forEach((color, i) => {
    gradient.addColorStop(i / (colors.length - 1), color);
  });
  return gradient;
};

export const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

export interface ExportOptions {
  device: DevicePreset;
  title: string;
  subtitle: string;
  imageData: string;
  gradientColors: string[];
  textColor: string;
}

export const generateAssetImage = async (options: ExportOptions): Promise<Blob> => {
  const { device, title, subtitle, imageData, gradientColors, textColor } = options;
  const { width, height, platform, isTablet } = device;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const gradient = createCanvasGradient(ctx, width, height, gradientColors);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const titleFontSize = Math.round(width * 0.055);
  const subtitleFontSize = Math.round(width * 0.032);
  const titleY = Math.round(height * 0.08);
  const subtitleY = titleY + titleFontSize + 10;

  ctx.fillStyle = textColor;
  ctx.font = `bold ${titleFontSize}px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  if (textColor === '#ffffff' || textColor === '#fff') {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;
  }

  ctx.fillText(title, width / 2, titleY);

  ctx.font = `${subtitleFontSize}px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif`;
  ctx.globalAlpha = 0.85;
  ctx.fillText(subtitle, width / 2, subtitleY);
  ctx.globalAlpha = 1;
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  const frameWidth = Math.round(width * (isTablet ? 0.75 : 0.65));
  const frameHeight = Math.round(height * 0.72);
  const frameX = (width - frameWidth) / 2;
  const frameY = height - frameHeight - Math.round(height * 0.04);

  const isIOS = platform === 'ios';
  const frameRadius = isTablet
    ? Math.round(frameWidth * 0.03)
    : isIOS
      ? Math.round(frameWidth * 0.12)
      : Math.round(frameWidth * 0.08);
  const framePadding = Math.round(frameWidth * 0.02);
  const screenRadius = frameRadius - framePadding;

  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 20;

  ctx.fillStyle = isIOS ? '#1c1c1e' : '#202124';
  roundRect(ctx, frameX, frameY, frameWidth, frameHeight, frameRadius);
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  const screenX = frameX + framePadding;
  const screenY = frameY + framePadding;
  const screenWidth = frameWidth - framePadding * 2;
  const screenHeight = frameHeight - framePadding * 2;

  ctx.save();
  roundRect(ctx, screenX, screenY, screenWidth, screenHeight, screenRadius);
  ctx.clip();

  try {
    const img = await loadImage(imageData);
    const imgRatio = img.width / img.height;
    const screenRatio = screenWidth / screenHeight;

    let drawWidth, drawHeight, drawX, drawY;

    if (imgRatio > screenRatio) {
      drawHeight = screenHeight;
      drawWidth = drawHeight * imgRatio;
      drawX = screenX - (drawWidth - screenWidth) / 2;
      drawY = screenY;
    } else {
      drawWidth = screenWidth;
      drawHeight = drawWidth / imgRatio;
      drawX = screenX;
      drawY = screenY - (drawHeight - screenHeight) / 2;
    }

    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
  } catch (e) {
    ctx.fillStyle = '#333';
    ctx.fillRect(screenX, screenY, screenWidth, screenHeight);
  }

  ctx.restore();

  if (isIOS && !isTablet) {
    const diWidth = Math.round(screenWidth * 0.28);
    const diHeight = Math.round(diWidth * 0.3);
    const diX = screenX + (screenWidth - diWidth) / 2;
    const diY = screenY + Math.round(screenHeight * 0.015);

    ctx.fillStyle = '#000';
    roundRect(ctx, diX, diY, diWidth, diHeight, diHeight / 2);
    ctx.fill();
  }

  if (!isIOS && !isTablet) {
    const cameraSize = Math.round(screenWidth * 0.035);
    const cameraX = screenX + screenWidth / 2 - cameraSize / 2;
    const cameraY = screenY + Math.round(screenHeight * 0.015);

    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(cameraX + cameraSize / 2, cameraY + cameraSize / 2, cameraSize / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  if (isIOS) {
    const indicatorWidth = Math.round(screenWidth * (isTablet ? 0.12 : 0.35));
    const indicatorHeight = isTablet ? 6 : 5;
    const indicatorX = screenX + (screenWidth - indicatorWidth) / 2;
    const indicatorY = screenY + screenHeight - Math.round(screenHeight * 0.02);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    roundRect(ctx, indicatorX, indicatorY, indicatorWidth, indicatorHeight, indicatorHeight / 2);
    ctx.fill();
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create blob'));
      },
      'image/png',
      1.0,
    );
  });
};
