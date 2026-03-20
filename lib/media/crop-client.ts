export type PixelCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image could not be loaded for cropping."));
    image.src = src;
  });
}

function getOutputType(type: string) {
  if (type === "image/png" || type === "image/webp") {
    return type;
  }

  return "image/jpeg";
}

function replaceFileExtension(fileName: string, outputType: string) {
  const baseName = fileName.replace(/\.[^/.]+$/, "");

  if (outputType === "image/png") {
    return `${baseName}.png`;
  }

  if (outputType === "image/webp") {
    return `${baseName}.webp`;
  }

  return `${baseName}.jpg`;
}

export async function createCroppedImageFile(input: {
  src: string;
  crop: PixelCrop;
  fileName: string;
  fileType: string;
}) {
  const image = await loadImage(input.src);
  const outputType = getOutputType(input.fileType);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas is unavailable for image cropping.");
  }

  const width = Math.max(1, Math.round(input.crop.width));
  const height = Math.max(1, Math.round(input.crop.height));

  canvas.width = width;
  canvas.height = height;

  context.drawImage(
    image,
    Math.round(input.crop.x),
    Math.round(input.crop.y),
    width,
    height,
    0,
    0,
    width,
    height,
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) {
        resolve(result);
        return;
      }

      reject(new Error("Cropped image could not be created."));
    }, outputType, outputType === "image/jpeg" ? 0.92 : undefined);
  });

  return new File([blob], replaceFileExtension(input.fileName, outputType), {
    type: outputType,
    lastModified: Date.now(),
  });
}
