document.addEventListener('DOMContentLoaded', function() {
    const originalCanvas = document.getElementById('original-canvas');
    const filteredCanvas = document.getElementById('filtered-canvas');
    const originalCtx = originalCanvas.getContext('2d');
    const filteredCtx = filteredCanvas.getContext('2d');
    const imageUpload = document.getElementById('image-upload');
    const downloadBtn = document.getElementById('download-btn');
    const resetBtn = document.getElementById('reset-btn');
    
    const brightnessSlider = document.getElementById('brightness');
    const brightnessValue = document.getElementById('brightness-value');
    const contrastSlider = document.getElementById('contrast');
    const contrastValue = document.getElementById('contrast-value');
    const saturationSlider = document.getElementById('saturation');
    const saturationValue = document.getElementById('saturation-value');
    
    let originalImage = null;
    let currentFilter = null;
    let adjustments = {
        brightness: 0,
        contrast: 0,
        saturation: 0
    };
    
    function initCanvas() {
        originalCanvas.width = 500;
        originalCanvas.height = 400;
        filteredCanvas.width = 500;
        filteredCanvas.height = 400;
        
        drawPlaceholder(originalCtx, '原始图片');
        drawPlaceholder(filteredCtx, '效果预览');
    }
    
    function drawPlaceholder(ctx, text) {
        ctx.fillStyle = '#f9f9f9';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.fillStyle = '#999';
        ctx.font = '16px Microsoft YaHei';
        ctx.textAlign = 'center';
        ctx.fillText(text, ctx.canvas.width/2, ctx.canvas.height/2);
    }
    
    imageUpload.addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = function(event) {
                originalImage = new Image();
                originalImage.onload = function() {
                    const ratio = Math.min(
                        originalCanvas.width / originalImage.width,
                        originalCanvas.height / originalImage.height
                    );
                    const displayWidth = originalImage.width * ratio;
                    const displayHeight = originalImage.height * ratio;
                    
                    originalCanvas.width = displayWidth;
                    originalCanvas.height = displayHeight;
                    filteredCanvas.width = displayWidth;
                    filteredCanvas.height = displayHeight;
                    
                    originalCtx.drawImage(originalImage, 0, 0, displayWidth, displayHeight);
                    
                    filteredCtx.drawImage(originalImage, 0, 0, displayWidth, displayHeight);
                };
                originalImage.src = event.target.result;
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    });
    
    const filters = {
        grayscale: function(data) {
            for (let i = 0; i < data.length; i += 4) {
                const avg = data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11;
                data[i] = data[i + 1] = data[i + 2] = avg;
            }
        },
        
        sepia: function(data) {
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                
                data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
                data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
                data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
            }
        },
        
        invert: function(data) {
            for (let i = 0; i < data.length; i += 4) {
                data[i] = 255 - data[i];
                data[i + 1] = 255 - data[i + 1];
                data[i + 2] = 255 - data[i + 2];
            }
        },
        
        vintage: function(data) {
            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.min(255, data[i] * 1.1);
                data[i + 1] = data[i + 1] * 0.9;
                data[i + 2] = data[i + 2] * 0.5;
                
                const noise = Math.random() * 40 - 20;
                data[i] += noise;
                data[i + 1] += noise;
                data[i + 2] += noise;
                
                data[i] = Math.min(255, data[i] * 1.2);
                data[i + 1] = Math.min(255, data[i + 1] * 0.8);
            }
        },
        
        solarize: function(data) {
            for (let i = 0; i < data.length; i += 4) {
                const thresholdR = 150;
                const thresholdG = 100;
                const thresholdB = 200;
                
                data[i] = data[i] > thresholdR ? 255 - data[i] : data[i];
                data[i + 1] = data[i + 1] > thresholdG ? 255 - data[i + 1] : data[i + 1];
                data[i + 2] = data[i + 2] > thresholdB ? 255 - data[i + 2] : data[i + 2];
            }
        },
        
        edge: function(data) {
            const grayData = new Uint8ClampedArray(data.length);
            for (let i = 0; i < data.length; i += 4) {
                grayData[i] = grayData[i + 1] = grayData[i + 2] = 
                    data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11;
                grayData[i + 3] = data[i + 3];
            }
            
            const width = filteredCanvas.width;
            const height = filteredCanvas.height;
            
            for (let y = 1; y < height - 1; y++) {
                for (let x = 1; x < width - 1; x++) {
                    const i = (y * width + x) * 4;
                    
                    const top = grayData[i - width * 4];
                    const bottom = grayData[i + width * 4];
                    const left = grayData[i - 4];
                    const right = grayData[i + 4];
                    const topLeft = grayData[i - width * 4 - 4];
                    const topRight = grayData[i - width * 4 + 4];
                    const bottomLeft = grayData[i + width * 4 - 4];
                    const bottomRight = grayData[i + width * 4 + 4];
                    
                    const gx = -topLeft - 2 * left - bottomLeft + topRight + 2 * right + bottomRight;
                    const gy = -topLeft - 2 * top - topRight + bottomLeft + 2 * bottom + bottomRight;
                    
                    const magnitude = Math.min(255, Math.sqrt(gx * gx + gy * gy));
                    
                    data[i] = data[i + 1] = data[i + 2] = 255 - magnitude;
                }
            }
        }
    };
    
    function applyAdjustments(data) {
        const brightness = adjustments.brightness;
        const contrast = adjustments.contrast;
        const saturation = adjustments.saturation;
        
        if (brightness !== 0) {
            for (let i = 0; i < data.length; i += 4) {
                data[i] += brightness;
                data[i + 1] += brightness;
                data[i + 2] += brightness;
            }
        }
        
        if (contrast !== 0) {
            const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
            
            for (let i = 0; i < data.length; i += 4) {
                data[i] = factor * (data[i] - 128) + 128;
                data[i + 1] = factor * (data[i + 1] - 128) + 128;
                data[i + 2] = factor * (data[i + 2] - 128) + 128;
            }
        }
        
        if (saturation !== 0) {
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                
                const avg = (r + g + b) / 3;
                const factor = 1 + (saturation / 100);
                
                data[i] = avg + (r - avg) * factor;
                data[i + 1] = avg + (g - avg) * factor;
                data[i + 2] = avg + (b - avg) * factor;
            }
        }
    }
    
    function applyFilter() {
        if (!originalImage) return;
        
        filteredCtx.drawImage(originalImage, 0, 0, filteredCanvas.width, filteredCanvas.height);
        
        const imageData = filteredCtx.getImageData(0, 0, filteredCanvas.width, filteredCanvas.height);
        const data = imageData.data;
        
        if (currentFilter && filters[currentFilter]) {
            filters[currentFilter](data);
        }
        
        applyAdjustments(data);
        
        filteredCtx.putImageData(imageData, 0, 0);
    }
    
    document.querySelectorAll('.filter-buttons button').forEach(btn => {
        btn.addEventListener('click', function() {
            currentFilter = this.getAttribute('data-filter');
            applyFilter();
        });
    });
    
    brightnessSlider.addEventListener('input', function() {
        adjustments.brightness = parseInt(this.value);
        brightnessValue.textContent = this.value;
    });
    
    contrastSlider.addEventListener('input', function() {
        adjustments.contrast = parseInt(this.value);
        contrastValue.textContent = this.value;
    });
    
    saturationSlider.addEventListener('input', function() {
        adjustments.saturation = parseInt(this.value);
        saturationValue.textContent = this.value;
    });
    
    document.getElementById('apply-adjustments').addEventListener('click', applyFilter);
    
    downloadBtn.addEventListener('click', function() {
        if (!originalImage) {
            alert('请先上传图片');
            return;
        }
        
        const link = document.createElement('a');
        link.download = 'filtered-image.png';
        link.href = filteredCanvas.toDataURL('image/png');
        link.click();
    });
    
    resetBtn.addEventListener('click', function() {
        if (!originalImage) return;
        
        currentFilter = null;
        adjustments = { brightness: 0, contrast: 0, saturation: 0 };
        
        brightnessSlider.value = 0;
        brightnessValue.textContent = '0';
        contrastSlider.value = 0;
        contrastValue.textContent = '0';
        saturationSlider.value = 0;
        saturationValue.textContent = '0';
        
        filteredCtx.drawImage(originalImage, 0, 0, filteredCanvas.width, filteredCanvas.height);
    });
    
    initCanvas();
});