let originalImage;
let ctx;
let isDrawing = false;
let startX, startY;

function startRetouching() {
  const input = document.getElementById('imageInput');
  if (input.files.length === 0) {
    alert('Please select an image first');
    return;
  }
  const file = input.files[0];
  const reader = new FileReader();
  reader.onload = function (e) {
    originalImage = new Image();
    originalImage.src = e.target.result;
    originalImage.onload = function () {
      const canvas = document.getElementById('imageCanvas');
      canvas.width = originalImage.width;
      canvas.height = originalImage.height;
      ctx = canvas.getContext('2d');
      ctx.drawImage(originalImage, 0, 0);
    };
  };
  reader.readAsDataURL(file);

  const canvas = document.getElementById('imageCanvas');
  canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    startX = e.offsetX;
    startY = e.offsetY;
  });
  canvas.addEventListener('mousemove', (e) => {
    if (isDrawing) {
      ctx.beginPath();
      ctx.rect(startX, startY, e.offsetX - startX, e.offsetY - startY);
      ctx.stroke();
    }
  });
  canvas.addEventListener('mouseup', () => {
    isDrawing = false;
    applyRetouching();
  });
}

function applyRetouching() {
  const mode = document.getElementById('retouchMode').value;
  const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    switch (mode) {
      case "brightness":
        data[i] = Math.min(r + 50, 255);
        data[i + 1] = Math.min(g + 50, 255);
        data[i + 2] = Math.min(b + 50, 255);
        break;
      case "contrast":
        const avg = (r + g + b) / 3;
        const contrastFactor = 1.5;
        const newR = (r - avg) * contrastFactor + avg;
        const newG = (g - avg) * contrastFactor + avg;
        const newB = (b - avg) * contrastFactor + avg;
        data[i] = Math.min(Math.max(newR, 0), 255);
        data[i + 1] = Math.min(Math.max(newG, 0), 255);
        data[i + 2] = Math.min(Math.max(newB, 0), 255);
        break;
      case "sharpen":
        const kernel = [
          -1, -1, -1,
          -1,  9, -1,
          -1, -1, -1
        ];
        const width = imageData.width;
        const height = imageData.height;
        const newData = new Uint8ClampedArray(data.length);
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            let sumR = 0;
            let sumG = 0;
            let sumB = 0;
            for (let ky = 0; ky < 3; ky++) {
              for (let kx = 0; kx < 3; kx++) {
                const ni = x + kx - 1;
                const nj = y + ky - 1;
                if (ni >= 0 && ni < width && nj >= 0 && nj < height) {
                  const index = (nj * width + ni) * 4;
                  sumR += data[index] * kernel[ky * 3 + kx];
                  sumG += data[index + 1] * kernel[ky * 3 + kx];
                  sumB += data[index + 2] * kernel[ky * 3 + kx];
                }
              }
            }
            const newIndex = (y * width + x) * 4;
            newData[newIndex] = Math.min(Math.max(sumR, 0), 255);
            newData[newIndex + 1] = Math.min(Math.max(sumG, 0), 255);
            newData[newIndex + 2] = Math.min(Math.max(sumB, 0), 255);
            newData[newIndex + 3] = data[newIndex + 3];
          }
        }
        data.set(newData);
        break;
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

function resetCanvas() {
  const canvas = document.getElementById('imageCanvas');
  ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (originalImage) {
    ctx.drawImage(originalImage, 0, 0);
  }
}