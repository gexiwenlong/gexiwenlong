let cvReady = false;
function onOpenCvReady() {
    cvReady = true;
    document.getElementById('opencv-loading').style.display = 'none';
    console.log('OpenCV.js is ready');
}

document.addEventListener('DOMContentLoaded', function() {
    const originalCanvas = document.getElementById('original-canvas');
    const segmentedCanvas = document.getElementById('segmented-canvas');
    const originalCtx = originalCanvas.getContext('2d');
    const segmentedCtx = segmentedCanvas.getContext('2d');
    const imageUpload = document.getElementById('image-upload');
    const downloadBtn = document.getElementById('download-btn');
    const resetBtn = document.getElementById('reset-btn');
    const processBtn = document.getElementById('process-btn');
    
    const modeButtons = document.querySelectorAll('.mode-btn');
    const controlPanels = document.querySelectorAll('.control-panel');
    
    const thresholdSlider = document.getElementById('threshold');
    const thresholdValue = document.getElementById('threshold-value');
    const minAreaSlider = document.getElementById('min-area');
    const minAreaValue = document.getElementById('min-area-value');
    
    const contourThresholdSlider = document.getElementById('contour-threshold');
    const contourThresholdValue = document.getElementById('contour-threshold-value');
    
    const iterationsSlider = document.getElementById('iterations');
    const iterationsValue = document.getElementById('iterations-value');
    
    let originalImage = null;
    let currentMode = 'geometric';
    
    function initCanvas() {
        originalCanvas.width = 500;
        originalCanvas.height = 400;
        segmentedCanvas.width = 500;
        segmentedCanvas.height = 400;
        
        drawPlaceholder(originalCtx, '原始图片');
        drawPlaceholder(segmentedCtx, '分割结果');
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
                    segmentedCanvas.width = displayWidth;
                    segmentedCanvas.height = displayHeight;
                    
                    originalCtx.drawImage(originalImage, 0, 0, displayWidth, displayHeight);
                    
                    segmentedCtx.drawImage(originalImage, 0, 0, displayWidth, displayHeight);
                };
                originalImage.src = event.target.result;
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    });
    
    modeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            currentMode = this.getAttribute('data-mode');
            
            modeButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            controlPanels.forEach(panel => panel.classList.remove('active'));
            document.getElementById(`${currentMode}-controls`).classList.add('active');
        });
    });
    
    thresholdSlider.addEventListener('input', function() {
        thresholdValue.textContent = this.value;
    });
    
    minAreaSlider.addEventListener('input', function() {
        minAreaValue.textContent = this.value;
    });
    
    contourThresholdSlider.addEventListener('input', function() {
        contourThresholdValue.textContent = this.value;
    });
    
    iterationsSlider.addEventListener('input', function() {
        iterationsValue.textContent = this.value;
    });
    
    processBtn.addEventListener('click', function() {
        if (!originalImage) {
            alert('请先上传图片');
            return;
        }
        
        if (!cvReady) {
            alert('OpenCV库尚未加载完成，请稍后再试');
            return;
        }
        
        switch(currentMode) {
            case 'geometric':
                detectGeometricShapes();
                break;
            case 'contour':
                detectContours();
                break;
            case 'foreground':
                extractForeground();
                break;
        }
    });
    
    function detectGeometricShapes() {
        const src = cv.imread(originalCanvas);
        const dst = new cv.Mat();
        const contours = new cv.MatVector();
        const hierarchy = new cv.Mat();
        
        cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);
        
        const thresholdValue = parseInt(document.getElementById('threshold').value);
        cv.threshold(dst, dst, thresholdValue, 255, cv.THRESH_BINARY);
        
        cv.findContours(dst, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
        
        const result = new cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
        const minArea = parseInt(document.getElementById('min-area').value);
        
        for (let i = 0; i < contours.size(); ++i) {
            const contour = contours.get(i);
            const area = cv.contourArea(contour);
            
            if (area < minArea) continue;
            
            const perimeter = cv.arcLength(contour, true);
            const approx = new cv.Mat();
            cv.approxPolyDP(contour, approx, 0.04 * perimeter, true);
            
            const vertices = approx.rows;
            let color;
            let shapeName;
            
            if (vertices === 3) {
                color = new cv.Scalar(255, 0, 0);
                shapeName = "三角形";
            } else if (vertices === 4) {
                const rect = cv.minAreaRect(contour);
                const aspectRatio = rect.size.width / rect.size.height;
                if (aspectRatio >= 0.9 && aspectRatio <= 1.1) {
                    color = new cv.Scalar(0, 255, 0);
                    shapeName = "正方形";
                } else {
                    color = new cv.Scalar(0, 255, 255);
                    shapeName = "矩形";
                }
            } else if (vertices > 8) {
                color = new cv.Scalar(0, 0, 255);
                shapeName = "圆形";
            } else {
                color = new cv.Scalar(255, 255, 255);
                shapeName = "多边形";
            }
            
            cv.drawContours(result, contours, i, color, 2, cv.LINE_8, hierarchy, 0);
            
            const moments = cv.moments(contour);
            const cx = moments.m10 / moments.m00;
            const cy = moments.m01 / moments.m00;
            
            const textPoint = new cv.Point(cx - 20, cy);
            cv.putText(result, shapeName, textPoint, cv.FONT_HERSHEY_SIMPLEX, 0.5, color, 2);
        }
        
        cv.imshow(segmentedCanvas, result);
        
        src.delete();
        dst.delete();
        contours.delete();
        hierarchy.delete();
        result.delete();
    }
    
    function detectContours() {
        const src = cv.imread(originalCanvas);
        const dst = new cv.Mat();
        const contours = new cv.MatVector();
        const hierarchy = new cv.Mat();
        
        cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);
        cv.GaussianBlur(dst, dst, new cv.Size(5, 5), 0);
        
        const thresholdValue = parseInt(document.getElementById('contour-threshold').value);
        cv.Canny(dst, dst, thresholdValue, thresholdValue * 2);
        
        cv.findContours(dst, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);
        
        const result = new cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
        
        const getRandomColor = () => {
            const r = Math.floor(Math.random() * 256);
            const g = Math.floor(Math.random() * 256);
            const b = Math.floor(Math.random() * 256);
            return new cv.Scalar(b, g, r);
        };
        
        for (let i = 0; i < contours.size(); ++i) {
            const color = getRandomColor();
            cv.drawContours(result, contours, i, color, 2, cv.LINE_8, hierarchy, 0);
        }
        
        cv.imshow(segmentedCanvas, result);
        
        src.delete();
        dst.delete();
        contours.delete();
        hierarchy.delete();
        result.delete();
    }
    
    function extractForeground() {
        const src = cv.imread(originalCanvas);
        const mask = new cv.Mat();
        const bgdModel = new cv.Mat();
        const fgdModel = new cv.Mat();
        const rect = new cv.Rect(50, 50, src.cols - 100, src.rows - 100);
        const iterations = parseInt(document.getElementById('iterations').value);
        
        cv.grabCut(src, mask, rect, bgdModel, fgdModel, iterations, cv.GC_INIT_WITH_RECT);
        
        const foregroundMask = new cv.Mat();
        cv.compare(mask, new cv.Mat(mask.rows, mask.cols, mask.type(), new cv.Scalar(3)), foregroundMask, cv.CMP_EQ);
        
        const result = new cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
        src.copyTo(result, foregroundMask);
        
        cv.imshow(segmentedCanvas, result);
        
        src.delete();
        mask.delete();
        bgdModel.delete();
        fgdModel.delete();
        foregroundMask.delete();
        result.delete();
    }
    
    downloadBtn.addEventListener('click', function() {
        if (!originalImage) {
            alert('请先上传并处理图片');
            return;
        }
        
        const link = document.createElement('a');
        link.download = 'segmented-image.png';
        link.href = segmentedCanvas.toDataURL('image/png');
        link.click();
    });
    
    resetBtn.addEventListener('click', function() {
        if (!originalImage) return;
        
        segmentedCtx.drawImage(originalImage, 0, 0, segmentedCanvas.width, segmentedCanvas.height);
    });
    
    const checkOpenCv = setInterval(function() {
        if (cvReady) {
            clearInterval(checkOpenCv);
            document.getElementById('opencv-loading').style.display = 'none';
        } else {
            document.getElementById('opencv-loading').style.display = 'block';
        }
    }, 100);
    
    initCanvas();
});