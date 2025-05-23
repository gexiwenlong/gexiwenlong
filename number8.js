document.addEventListener('DOMContentLoaded', () => {
    const originalCanvas = document.getElementById('originalCanvas');
    const transformedCanvas = document.getElementById('transformedCanvas');
    const originalCtx = originalCanvas.getContext('2d');
    const transformedCtx = transformedCanvas.getContext('2d');
    const imageInput = document.getElementById('imageInput');
    const transformBtn = document.getElementById('transformBtn');
    const resetBtn = document.getElementById('resetBtn');

    let originalPoints = [];
    let transformedPoints = [];
    let image = null;
    let originalCanvasRect = null;
    let transformedCanvasRect = null;

    imageInput.addEventListener('change', handleImageUpload);
    transformBtn.addEventListener('click', transformImage);
    resetBtn.addEventListener('click', resetPoints);
    originalCanvas.addEventListener('click', (e) => handleCanvasClick(e, originalCanvas, originalPoints));
    transformedCanvas.addEventListener('click', (e) => handleCanvasClick(e, transformedCanvas, transformedPoints));

    function handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            image = new Image();
            image.onload = () => {
                originalCanvas.width = image.width;
                originalCanvas.height = image.height;
                transformedCanvas.width = image.width;
                transformedCanvas.height = image.height;
                
                originalCtx.drawImage(image, 0, 0);
                
                originalCanvasRect = originalCanvas.getBoundingClientRect();
                transformedCanvasRect = transformedCanvas.getBoundingClientRect();
                
                transformBtn.disabled = false;
                resetBtn.disabled = false;
            };
            image.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }

    function handleCanvasClick(e, canvas, pointsArray) {
        if (!image || pointsArray.length >= 3) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const scaledX = x * scaleX;
        const scaledY = y * scaleY;
        
        pointsArray.push({ x: scaledX, y: scaledY });
        
        const marker = document.createElement('div');
        marker.className = 'point-marker';
        marker.style.left = `${x}px`;
        marker.style.top = `${y}px`;
        
        const label = document.createElement('div');
        label.className = 'point-label';
        label.textContent = pointsArray.length;
        label.style.left = `${x}px`;
        label.style.top = `${y}px`;
        
        const wrapper = canvas.parentNode;
        wrapper.appendChild(marker);
        wrapper.appendChild(label);
    }

    function transformImage() {
        if (!image || originalPoints.length !== 3 || transformedPoints.length !== 3) {
            alert('Please select an image and set exactly 3 points on both canvases');
            return;
        }

        const matrix = calculateAffineMatrix(originalPoints, transformedPoints);
        
        applyTransformation(matrix);
    }

    function calculateAffineMatrix(srcPoints, dstPoints) {
        const A = [];
        const B = [];
        
        for (let i = 0; i < 3; i++) {
            A.push([srcPoints[i].x, srcPoints[i].y, 1, 0, 0, 0]);
            B.push(dstPoints[i].x);
            
            A.push([0, 0, 0, srcPoints[i].x, srcPoints[i].y, 1]);
            B.push(dstPoints[i].y);
        }
        
        const X = solveLinearSystem(A, B);
        
        return [
            [X[0], X[1], X[2]],
            [X[3], X[4], X[5]],
            [0, 0, 1]
        ];
    }

    function solveLinearSystem(A, B) {
        const n = 6;
        
        let M = A.map((row, i) => [...row, B[i]]);
        
        for (let i = 0; i < n; i++) {
            let maxRow = i;
            for (let j = i + 1; j < n; j++) {
                if (Math.abs(M[j][i]) > Math.abs(M[maxRow][i])) {
                    maxRow = j;
                }
            }
            
            [M[i], M[maxRow]] = [M[maxRow], M[i]];
            
            for (let j = i + 1; j < n; j++) {
                const factor = M[j][i] / M[i][i];
                for (let k = i; k <= n; k++) {
                    M[j][k] -= factor * M[i][k];
                }
            }
        }
        
        const X = new Array(n);
        for (let i = n - 1; i >= 0; i--) {
            X[i] = M[i][n] / M[i][i];
            for (let j = 0; j < i; j++) {
                M[j][n] -= M[j][i] * X[i];
            }
        }
        
        return X;
    }

    function applyTransformation(matrix) {
        transformedCtx.clearRect(0, 0, transformedCanvas.width, transformedCanvas.height);
        
        const imgData = originalCtx.getImageData(0, 0, originalCanvas.width, originalCanvas.height);
        const newImgData = transformedCtx.createImageData(transformedCanvas.width, transformedCanvas.height);
        
        const det = matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
        const isUpscaling = Math.abs(det) > 1;
        
        for (let y = 0; y < transformedCanvas.height; y++) {
            for (let x = 0; x < transformedCanvas.width; x++) {
                const srcX = matrix[0][0] * x + matrix[0][1] * y + matrix[0][2];
                const srcY = matrix[1][0] * x + matrix[1][1] * y + matrix[1][2];
                
                if (srcX >= 0 && srcX < originalCanvas.width && srcY >= 0 && srcY < originalCanvas.height) {
                    const pixel = isUpscaling ? 
                        bilinearInterpolation(imgData, srcX, srcY) :
                        trilinearInterpolation(imgData, srcX, srcY);
                    
                    const idx = (y * transformedCanvas.width + x) * 4;
                    newImgData.data[idx] = pixel.r;
                    newImgData.data[idx + 1] = pixel.g;
                    newImgData.data[idx + 2] = pixel.b;
                    newImgData.data[idx + 3] = pixel.a;
                }
            }
        }
        
        transformedCtx.putImageData(newImgData, 0, 0);
    }

    function bilinearInterpolation(imgData, x, y) {
        const x1 = Math.floor(x);
        const y1 = Math.floor(y);
        const x2 = Math.min(x1 + 1, imgData.width - 1);
        const y2 = Math.min(y1 + 1, imgData.height - 1);
        
        const dx = x - x1;
        const dy = y - y1;
        
        const p1 = getPixel(imgData, x1, y1);
        const p2 = getPixel(imgData, x2, y1);
        const p3 = getPixel(imgData, x1, y2);
        const p4 = getPixel(imgData, x2, y2);
        
        const r = lerp(lerp(p1.r, p2.r, dx), lerp(p3.r, p4.r, dx), dy);
        const g = lerp(lerp(p1.g, p2.g, dx), lerp(p3.g, p4.g, dx), dy);
        const b = lerp(lerp(p1.b, p2.b, dx), lerp(p3.b, p4.b, dx), dy);
        const a = lerp(lerp(p1.a, p2.a, dx), lerp(p3.a, p4.a, dx), dy);
        
        return { r, g, b, a };
    }

    function trilinearInterpolation(imgData, x, y) {
        const radius = 1; 
        let r = 0, g = 0, b = 0, a = 0;
        let count = 0;
        
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const sampleX = Math.floor(x + dx);
                const sampleY = Math.floor(y + dy);
                
                if (sampleX >= 0 && sampleX < imgData.width && sampleY >= 0 && sampleY < imgData.height) {
                    const pixel = getPixel(imgData, sampleX, sampleY);
                    r += pixel.r;
                    g += pixel.g;
                    b += pixel.b;
                    a += pixel.a;
                    count++;
                }
            }
        }
        
        return {
            r: Math.round(r / count),
            g: Math.round(g / count),
            b: Math.round(b / count),
            a: Math.round(a / count)
        };
    }

    function getPixel(imgData, x, y) {
        const idx = (Math.floor(y) * imgData.width + Math.floor(x)) * 4;
        return {
            r: imgData.data[idx],
            g: imgData.data[idx + 1],
            b: imgData.data[idx + 2],
            a: imgData.data[idx + 3]
        };
    }

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function resetPoints() {
        originalPoints = [];
        transformedPoints = [];
        
        document.querySelectorAll('.point-marker, .point-label').forEach(el => el.remove());
        
        if (image) {
            originalCtx.clearRect(0, 0, originalCanvas.width, originalCanvas.height);
            originalCtx.drawImage(image, 0, 0);
        }
        
        transformedCtx.clearRect(0, 0, transformedCanvas.width, transformedCanvas.height);
    }
});