document.addEventListener('DOMContentLoaded', function() {
    const originalCanvas = document.getElementById('original-canvas');
    const scaledCanvas = document.getElementById('scaled-canvas');
    const originalCtx = originalCanvas.getContext('2d');
    const scaledCtx = scaledCanvas.getContext('2d');
    const imageUpload = document.getElementById('image-upload');
    const scalePercent = document.getElementById('scale-percent');
    const antiAliasCheckbox = document.getElementById('anti-alias');
    const originalDimensions = document.getElementById('original-dimensions');
    const scaledDimensions = document.getElementById('scaled-dimensions');
    const downloadBtn = document.getElementById('download-btn');
    
    let originalImage = null;
    let originalWidth = 0;
    let originalHeight = 0;
    
    function initCanvas() {
        originalCanvas.width = 500;
        originalCanvas.height = 400;
        scaledCanvas.width = 500;
        scaledCanvas.height = 400;
        
        originalCtx.fillStyle = '#f9f9f9';
        originalCtx.fillRect(0, 0, originalCanvas.width, originalCanvas.height);
        scaledCtx.fillStyle = '#f9f9f9';
        scaledCtx.fillRect(0, 0, scaledCanvas.width, scaledCanvas.height);
        
        originalCtx.fillStyle = '#999';
        originalCtx.font = '16px Arial';
        originalCtx.textAlign = 'center';
        originalCtx.fillText('Original Image', originalCanvas.width/2, originalCanvas.height/2);
        
        scaledCtx.fillStyle = '#999';
        scaledCtx.font = '16px Arial';
        scaledCtx.textAlign = 'center';
        scaledCtx.fillText('Scaled Image', scaledCanvas.width/2, scaledCanvas.height/2);
        
        updateDimensionDisplays();
    }
    
    imageUpload.addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = function(event) {
                originalImage = new Image();
                originalImage.onload = function() {
                    originalWidth = originalImage.width;
                    originalHeight = originalImage.height;
                    
                    const ratio = Math.min(
                        originalCanvas.width / originalWidth,
                        originalCanvas.height / originalHeight
                    );
                    const displayWidth = originalWidth * ratio;
                    const displayHeight = originalHeight * ratio;
                    
                    originalCanvas.width = displayWidth;
                    originalCanvas.height = displayHeight;
                    originalCtx.drawImage(originalImage, 0, 0, displayWidth, displayHeight);
                    
                    scalePercent.value = 100;
                    applyScaling();
                };
                originalImage.src = event.target.result;
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    });
    
    function applyScaling() {
        if (!originalImage) return;
        
        const scale = parseInt(scalePercent.value) / 100;
        const useAntiAlias = antiAliasCheckbox.checked;
  
        const newWidth = Math.round(originalWidth * scale);
        const newHeight = Math.round(originalHeight * scale);
        
        scaledCanvas.width = newWidth;
        scaledCanvas.height = newHeight;
        
        if (useAntiAlias && scale > 1) {
            scaleImageHighQuality(originalImage, scaledCtx, newWidth, newHeight);
        } else {
            scaledCtx.imageSmoothingEnabled = useAntiAlias;
            scaledCtx.drawImage(originalImage, 0, 0, newWidth, newHeight);
        }
        
        updateDimensionDisplays();
    }
    
    function scaleImageHighQuality(source, targetCtx, targetWidth, targetHeight) {
        const steps = Math.ceil(Math.log2(Math.max(
            targetWidth / source.width,
            targetHeight / source.height
        )));
        
        let currentWidth = source.width;
        let currentHeight = source.height;
        let currentCanvas = document.createElement('canvas');
        let currentCtx = currentCanvas.getContext('2d');
        
        currentCanvas.width = currentWidth;
        currentCanvas.height = currentHeight;
        currentCtx.drawImage(source, 0, 0);
        
        for (let i = 0; i < steps; i++) {
            const nextWidth = Math.min(currentWidth * 2, targetWidth);
            const nextHeight = Math.min(currentHeight * 2, targetHeight);
            
            const nextCanvas = document.createElement('canvas');
            const nextCtx = nextCanvas.getContext('2d');
            
            nextCanvas.width = nextWidth;
            nextCanvas.height = nextHeight;
            nextCtx.imageSmoothingEnabled = true;
            nextCtx.drawImage(currentCanvas, 0, 0, nextWidth, nextHeight);
            
            currentCanvas = nextCanvas;
            currentCtx = nextCtx;
            currentWidth = nextWidth;
            currentHeight = nextHeight;
        }
        
        targetCtx.imageSmoothingEnabled = true;
        targetCtx.drawImage(currentCanvas, 0, 0, targetWidth, targetHeight);
    }
    
    function updateDimensionDisplays() {
        originalDimensions.textContent = originalImage ? 
            `${originalWidth} × ${originalHeight}` : '';
        
        scaledDimensions.textContent = originalImage ? 
            `${scaledCanvas.width} × ${scaledCanvas.height}` : '';
    }
    
    document.getElementById('apply-scale').addEventListener('click', applyScaling);
    
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            scalePercent.value = this.getAttribute('data-scale');
            applyScaling();
        });
    });
    
    downloadBtn.addEventListener('click', function() {
        if (!originalImage) return;
        
        const link = document.createElement('a');
        link.download = `scaled-image-${scalePercent.value}percent.png`;
        link.href = scaledCanvas.toDataURL('image/png');
        link.click();
    });
    
    initCanvas();
});