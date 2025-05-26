document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('drawing-canvas');
    const ctx = canvas.getContext('2d');
    const pointCountDisplay = document.getElementById('point-count');
    const convexitySlider = document.getElementById('convexity-slider');
    const convexityValue = document.getElementById('convexity-value');
    const pointSelector = document.getElementById('point-selector');
    const convexityControls = document.getElementById('convexity-controls');
    
    let points = [];
    let interpolate = false;
    let advancedMode = false;
    let selectedPointIndex = -1;
    let convexityValues = [];
    
    function initCanvas() {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
    }
    
    function redraw() {
        initCanvas();
        
        points.forEach((point, index) => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = index === selectedPointIndex ? 'green' : 'red';
            ctx.fill();
            
            ctx.fillStyle = 'black';
            ctx.font = '12px Arial';
            ctx.fillText(index, point.x + 8, point.y + 8);
        });
        
        if (points.length > 1) {
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        
        if (interpolate && points.length >= 2) {
            drawSpline();
        }
        
        pointCountDisplay.textContent = points.length;
    }
    
    function drawSpline() {
        const sortedPoints = [...points].sort((a, b) => a.x - b.x);
        const x = sortedPoints.map(p => p.x);
        const y = sortedPoints.map(p => p.y);
        
        ctx.beginPath();
        ctx.moveTo(x[0], y[0]);
        
        for (let i = 0; i < x.length - 1; i++) {
            const x0 = x[i];
            const y0 = y[i];
            const x1 = x[i+1];
            const y1 = y[i+1];
            
            let cp1x, cp1y, cp2x, cp2y;
            
            if (advancedMode && convexityValues[i] !== undefined) {
                const convexity = convexityValues[i];
                const dx = x1 - x0;
                const dy = y1 - y0;
                
                cp1x = x0 + dx * 0.3;
                cp1y = y0 + dy * 0.3 + convexity * dx * 0.5;
                cp2x = x1 - dx * 0.3;
                cp2y = y1 - dy * 0.3 + convexity * dx * 0.5;
            } else {
                if (i === 0) {
                    cp1x = x0 + (x1 - x0) / 3;
                    cp1y = y0 + (y1 - y0) / 3;
                } else {
                    cp1x = x0 + (x1 - x[i-1]) / 6;
                    cp1y = y0 + (y1 - y[i-1]) / 6;
                }
                
                if (i === x.length - 2) {
                    cp2x = x1 - (x1 - x0) / 3;
                    cp2y = y1 - (y1 - y0) / 3;
                } else {
                    cp2x = x1 - (x[i+2] - x0) / 6;
                    cp2y = y1 - (y[i+2] - y0) / 6;
                }
            }
            
            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x1, y1);
        }
        
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    function updatePointSelector() {
        pointSelector.innerHTML = '';
        
        for (let i = 0; i < points.length; i++) {
            const btn = document.createElement('button');
            btn.textContent = `Point ${i}`;
            btn.addEventListener('click', () => {
                selectedPointIndex = i;
                if (convexityValues[i] === undefined) {
                    convexityValues[i] = 0;
                }
                convexitySlider.value = convexityValues[i];
                convexityValue.textContent = convexityValues[i];
                redraw();
            });
            pointSelector.appendChild(btn);
        }
    }
    
    canvas.addEventListener('click', function(e) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        points.push({ x, y });
        redraw();
        
        if (advancedMode) {
            updatePointSelector();
        }
    });
    
    document.getElementById('toggle-interpolation').addEventListener('click', function() {
        interpolate = !interpolate;
        redraw();
    });
    
    document.getElementById('clear-canvas').addEventListener('click', function() {
        points = [];
        convexityValues = [];
        selectedPointIndex = -1;
        convexitySlider.value = 0;
        convexityValue.textContent = '0';
        redraw();
        updatePointSelector();
    });
    
    document.getElementById('advanced-mode').addEventListener('click', function() {
        advancedMode = !advancedMode;
        convexityControls.style.display = advancedMode ? 'block' : 'none';
        this.textContent = advancedMode ? 'Basic Mode' : 'Advanced Mode';
        redraw();
        if (advancedMode) {
            updatePointSelector();
        }
    });
    
    convexitySlider.addEventListener('input', function() {
        if (selectedPointIndex >= 0 && selectedPointIndex < points.length - 1) {
            convexityValues[selectedPointIndex] = parseFloat(this.value);
            convexityValue.textContent = this.value;
            redraw();
        }
    });
    
    // Initialize
    initCanvas();
});