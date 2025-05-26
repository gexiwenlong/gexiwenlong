document.addEventListener('DOMContentLoaded', function() {
    const originalCanvas = document.getElementById('originalCanvas');
    const processedCanvas = document.getElementById('processedCanvas');
    const amountSlider = document.getElementById('amountSlider');
    const radiusSlider = document.getElementById('radiusSlider');
    const thresholdSlider = document.getElementById('thresholdSlider');
    const amountValue = document.getElementById('amountValue');
    const radiusValue = document.getElementById('radiusValue');
    const thresholdValue = document.getElementById('thresholdValue');
    const applyBtn = document.getElementById('applyBtn');
    const resetBtn = document.getElementById('resetBtn');
    const imageUpload = document.getElementById('imageUpload');

    const originalCtx = originalCanvas.getContext('2d');
    const processedCtx = processedCanvas.getContext('2d');

    let originalImageData = null;

    amountSlider.addEventListener('input', () => amountValue.textContent = amountSlider.value);
    radiusSlider.addEventListener('input', () => radiusValue.textContent = radiusSlider.value);
    thresholdSlider.addEventListener('input', () => thresholdValue.textContent = thresholdSlider.value);

    imageUpload.addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = new Image();
                img.onload = function() {
                    originalCanvas.width = img.width;
                    originalCanvas.height = img.height;
                    processedCanvas.width = img.width;
                    processedCanvas.height = img.height;

                    originalCtx.drawImage(img, 0, 0);

                    originalImageData = originalCtx.getImageData(0, 0, originalCanvas.width, originalCanvas.height);

                    processedCtx.putImageData(originalImageData, 0, 0);
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    });

    applyBtn.addEventListener('click', function() {
        if (!originalImageData) {
            alert('Please upload an image first');
            return;
        }

        const amount = parseFloat(amountSlider.value);
        const radius = parseFloat(radiusSlider.value);
        const threshold = parseInt(thresholdSlider.value);

        const originalData = originalCtx.getImageData(0, 0, originalCanvas.width, originalCanvas.height);
        const processedData = processedCtx.getImageData(0, 0, processedCanvas.width, processedCanvas.height);

        unsharpMask(
            originalData.data,
            processedData.data,
            originalCanvas.width,
            originalCanvas.height,
            radius,
            amount,
            threshold
        );

        processedCtx.putImageData(processedData, 0, 0);
    });

    resetBtn.addEventListener('click', function() {
        if (originalImageData) {
            processedCtx.putImageData(originalImageData, 0, 0);
        }
    });

    function unsharpMask(src, dst, width, height, radius, amount, threshold) {
        const blurred = new Uint8ClampedArray(src.length);

        applyGaussianBlur(src, blurred, width, height, radius);

        for (let i = 0; i < src.length; i += 4) {
            for (let c = 0; c < 3; c++) {
                const srcVal = src[i + c];
                const blurredVal = blurred[i + c];
                const diff = srcVal - blurredVal;

                if (Math.abs(diff) > threshold) {
                    dst[i + c] = Math.max(0, Math.min(255, srcVal + amount * diff));
                } else {
                    dst[i + c] = srcVal;
                }
            }
            dst[i + 3] = src[i + 3];
        }
    }

    function applyGaussianBlur(src, dst, width, height, radius) {
        const kernelSize = Math.max(3, Math.floor(radius * 2 + 1));
        const halfSize = Math.floor(kernelSize / 2);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let r = 0, g = 0, b = 0, count = 0;
                
                for (let kx = -halfSize; kx <= halfSize; kx++) {
                    const px = Math.max(0, Math.min(width - 1, x + kx));
                    const idx = (y * width + px) * 4;
                    
                    r += src[idx];
                    g += src[idx + 1];
                    b += src[idx + 2];
                    count++;
                }
                
                const idx = (y * width + x) * 4;
                dst[idx] = r / count;
                dst[idx + 1] = g / count;
                dst[idx + 2] = b / count;
                dst[idx + 3] = src[idx + 3];
            }
        }

        const temp = new Uint8ClampedArray(dst);
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                let r = 0, g = 0, b = 0, count = 0;
                
                for (let ky = -halfSize; ky <= halfSize; ky++) {
                    const py = Math.max(0, Math.min(height - 1, y + ky));
                    const idx = (py * width + x) * 4;
                    
                    r += temp[idx];
                    g += temp[idx + 1];
                    b += temp[idx + 2];
                    count++;
                }
                
                const idx = (y * width + x) * 4;
                dst[idx] = r / count;
                dst[idx + 1] = g / count;
                dst[idx + 2] = b / count;
                dst[idx + 3] = temp[idx + 3];
            }
        }
    }
});