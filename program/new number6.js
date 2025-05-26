// script.js
document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const imageUpload = document.getElementById('image-upload');
    const retouchModeBtn = document.getElementById('retouch-mode-btn');
    const applyRetouchBtn = document.getElementById('apply-retouch-btn');
    const resetBtn = document.getElementById('reset-btn');
    const downloadBtn = document.getElementById('download-btn');
    const brushSize = document.getElementById('brush-size');
    const brushOpacity = document.getElementById('brush-opacity');
    const originalCanvas = document.getElementById('original-canvas');
    const retouchCanvas = document.getElementById('retouch-canvas');
    const resultCanvas = document.getElementById('result-canvas');
    const selectionOverlay = document.getElementById('selection-overlay');
    
    // Canvas contexts
    const originalCtx = originalCanvas.getContext('2d');
    const retouchCtx = retouchCanvas.getContext('2d');
    const resultCtx = resultCanvas.getContext('2d');
    
    // State variables
    let isRetouchMode = false;
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    let originalImage = null;
    
    // Event listeners
    imageUpload.addEventListener('change', handleImageUpload);
    retouchModeBtn.addEventListener('click', toggleRetouchMode);
    applyRetouchBtn.addEventListener('click', applyRetouch);
    resetBtn.addEventListener('click', resetTool);
    downloadBtn.addEventListener('click', downloadResult);
    
    // Canvas event listeners
    retouchCanvas.addEventListener('mousedown', startDrawing);
    retouchCanvas.addEventListener('mousemove', draw);
    retouchCanvas.addEventListener('mouseup', stopDrawing);
    retouchCanvas.addEventListener('mouseout', stopDrawing);
    
    // Handle image upload
    function handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                originalImage = img;
                
                // Set canvas dimensions
                originalCanvas.width = img.width;
                originalCanvas.height = img.height;
                retouchCanvas.width = img.width;
                retouchCanvas.height = img.height;
                resultCanvas.width = img.width;
                resultCanvas.height = img.height;
                
                // Draw original image
                originalCtx.drawImage(img, 0, 0);
                
                // Clear other canvases
                retouchCtx.clearRect(0, 0, retouchCanvas.width, retouchCanvas.height);
                resultCtx.clearRect(0, 0, resultCanvas.width, resultCanvas.height);
                
                // Enable retouch mode button
                retouchModeBtn.disabled = false;
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    // Toggle retouch mode
    function toggleRetouchMode() {
        isRetouchMode = !isRetouchMode;
        
        if (isRetouchMode) {
            retouchModeBtn.textContent = 'Disable Retouch Mode';
            retouchModeBtn.style.backgroundColor = '#f44336';
            selectionOverlay.style.display = 'block';
            applyRetouchBtn.disabled = false;
            
            // Clear retouch canvas
            retouchCtx.clearRect(0, 0, retouchCanvas.width, retouchCanvas.height);
            retouchCtx.globalCompositeOperation = 'source-over';
        } else {
            retouchModeBtn.textContent = 'Enable Retouch Mode';
            retouchModeBtn.style.backgroundColor = '#4CAF50';
            selectionOverlay.style.display = 'none';
            applyRetouchBtn.disabled = true;
        }
    }
    
    // Drawing functions
    function startDrawing(e) {
        if (!isRetouchMode) return;
        
        isDrawing = true;
        [lastX, lastY] = getCanvasCoordinates(e);
    }
    
    function draw(e) {
        if (!isDrawing || !isRetouchMode) return;
        
        const [x, y] = getCanvasCoordinates(e);
        
        retouchCtx.lineJoin = 'round';
        retouchCtx.lineCap = 'round';
        retouchCtx.lineWidth = brushSize.value;
        retouchCtx.globalAlpha = brushOpacity.value / 100;
        retouchCtx.strokeStyle = 'rgba(255, 255, 255, 1)';
        
        retouchCtx.beginPath();
        retouchCtx.moveTo(lastX, lastY);
        retouchCtx.lineTo(x, y);
        retouchCtx.stroke();
        
        [lastX, lastY] = [x, y];
    }
    
    function stopDrawing() {
        isDrawing = false;
    }
    
    // Apply retouch effect
    function applyRetouch() {
        if (!originalImage) return;
        
        // Copy original image to result canvas
        resultCtx.drawImage(originalImage, 0, 0);
        
        // Apply retouch (simple blur effect for demonstration)
        const imageData = retouchCtx.getImageData(0, 0, retouchCanvas.width, retouchCanvas.height);
        const blurredData = applyBlurEffect(imageData, 5);
        resultCtx.putImageData(blurredData, 0, 0);
        
        // Enable download button
        downloadBtn.disabled = false;
    }
    
    // Simple blur effect (for demonstration)
    function applyBlurEffect(imageData, radius) {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        const output = new ImageData(width, height);
        const outputData = output.data;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let r = 0, g = 0, b = 0, a = 0;
                let count = 0;
                
                for (let dy = -radius; dy <= radius; dy++) {
                    for (let dx = -radius; dx <= radius; dx++) {
                        const nx = x + dx;
                        const ny = y + dy;
                        
                        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                            const i = (ny * width + nx) * 4;
                            
                            // Only blur areas that were painted on the retouch canvas
                            const retouchI = (ny * width + nx) * 4;
                            const retouchData = retouchCtx.getImageData(0, 0, width, height).data;
                            
                            if (retouchData[retouchI] > 0 || retouchData[retouchI + 1] > 0 || retouchData[retouchI + 2] > 0) {
                                r += data[i];
                                g += data[i + 1];
                                b += data[i + 2];
                                a += data[i + 3];
                                count++;
                            } else {
                                // Keep original pixels for non-retouched areas
                                r += data[i];
                                g += data[i + 1];
                                b += data[i + 2];
                                a += data[i + 3];
                                count++;
                            }
                        }
                    }
                }
                
                const i = (y * width + x) * 4;
                outputData[i] = r / count;
                outputData[i + 1] = g / count;
                outputData[i + 2] = b / count;
                outputData[i + 3] = a / count;
            }
        }
        
        return output;
    }
    
    // Reset tool
    function resetTool() {
        if (originalImage) {
            originalCtx.drawImage(originalImage, 0, 0);
        }
        retouchCtx.clearRect(0, 0, retouchCanvas.width, retouchCanvas.height);
        resultCtx.clearRect(0, 0, resultCanvas.width, resultCanvas.height);
        
        isRetouchMode = false;
        retouchModeBtn.textContent = 'Enable Retouch Mode';
        retouchModeBtn.style.backgroundColor = '#4CAF50';
        selectionOverlay.style.display = 'none';
        applyRetouchBtn.disabled = true;
        downloadBtn.disabled = true;
    }
    
    // Download result
    function downloadResult() {
        const link = document.createElement('a');
        link.download = 'retouched-image.png';
        link.href = resultCanvas.toDataURL('image/png');
        link.click();
    }
    
    // Helper function to get canvas coordinates
    function getCanvasCoordinates(e) {
        const rect = retouchCanvas.getBoundingClientRect();
        return [
            e.clientX - rect.left,
            e.clientY - rect.top
        ];
    }
});