document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('cube-canvas');
    const ctx = canvas.getContext('2d');
    
    const shapeTypeSelect = document.getElementById('shape-type');
    const xRotationSlider = document.getElementById('x-rotation');
    const yRotationSlider = document.getElementById('y-rotation');
    const zRotationSlider = document.getElementById('z-rotation');
    const xRotationValue = document.getElementById('x-rotation-value');
    const yRotationValue = document.getElementById('y-rotation-value');
    const zRotationValue = document.getElementById('z-rotation-value');
    const edgeColorPicker = document.getElementById('edge-color');
    const faceColorPicker = document.getElementById('face-color');
    const showNumbersCheckbox = document.getElementById('show-numbers');
    
    function resizeCanvas() {
        const size = Math.min(600, window.innerWidth - 40);
        canvas.width = size;
        canvas.height = size;
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    class Point3D {
        constructor(x, y, z) {
            this.x = x;
            this.y = y;
            this.z = z;
        }
        
        rotateX(angle) {
            const rad = angle * Math.PI / 180;
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);
            
            const y = this.y * cos - this.z * sin;
            const z = this.y * sin + this.z * cos;
            
            return new Point3D(this.x, y, z);
        }
        
        rotateY(angle) {
            const rad = angle * Math.PI / 180;
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);
            
            const x = this.x * cos + this.z * sin;
            const z = -this.x * sin + this.z * cos;
            
            return new Point3D(x, this.y, z);
        }
        
        rotateZ(angle) {
            const rad = angle * Math.PI / 180;
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);
            
            const x = this.x * cos - this.y * sin;
            const y = this.x * sin + this.y * cos;
            
            return new Point3D(x, y, this.z);
        }
        
        project() {
            const scale = canvas.width / 4;
            const x = this.x * scale + canvas.width / 2;
            const y = this.y * scale + canvas.height / 2;
            
            return { x, y, z: this.z };
        }
    }
    
    class Polyhedron {
        constructor(type) {
            this.type = parseInt(type);
            this.vertices = [];
            this.faces = [];
            this.faceNumbers = [];
            this.initShape();
        }
        
        initShape() {
            switch(this.type) {
                case 4:
                    this.initTetrahedron();
                    break;
                case 6:
                    this.initCube();
                    break;
                case 8:
                    this.initOctahedron();
                    break;
                case 12:
                    this.initDodecahedron();
                    break;
                case 20:
                    this.initIcosahedron();
                    break;
                default:
                    this.initCube();
            }
        }
        
        initTetrahedron() {
            const sqrt3 = Math.sqrt(3);
            this.vertices = [
                new Point3D(1, 1, 1),
                new Point3D(-1, -1, 1),
                new Point3D(-1, 1, -1),
                new Point3D(1, -1, -1)
            ];
            
            this.faces = [
                [0, 1, 2],
                [0, 2, 3],
                [0, 3, 1],
                [1, 3, 2]
            ];
            
            this.faceNumbers = [1, 2, 3, 4];
        }
        
        initCube() {
            this.vertices = [];
            for (let x = -1; x <= 1; x += 2) {
                for (let y = -1; y <= 1; y += 2) {
                    for (let z = -1; z <= 1; z += 2) {
                        this.vertices.push(new Point3D(x, y, z));
                    }
                }
            }
          
            this.faces = [
                [0, 1, 3, 2], 
                [4, 5, 7, 6], 
                [0, 1, 5, 4], 
                [2, 3, 7, 6], 
                [0, 2, 6, 4], 
                [1, 3, 7, 5]  
            ];
            
            this.faceNumbers = [1, 2, 3, 4, 5, 6];
        }
        
        initOctahedron() {
            this.vertices = [
                new Point3D(1, 0, 0),
                new Point3D(-1, 0, 0),
                new Point3D(0, 1, 0),
                new Point3D(0, -1, 0),
                new Point3D(0, 0, 1),
                new Point3D(0, 0, -1)
            ];
            
            this.faces = [
                [4, 0, 2], [4, 2, 1], [4, 1, 3], [4, 3, 0],
                [5, 0, 2], [5, 2, 1], [5, 1, 3], [5, 3, 0]
            ];
            
            this.faceNumbers = [1, 2, 3, 4, 5, 6, 7, 8];
        }
        
        initDodecahedron() {
            const phi = (1 + Math.sqrt(5)) / 2;
            
            this.vertices = [];
            for (let i = 0; i < 20; i++) {
                const x = (i % 2 === 0) ? 0 : (i < 10 ? 1/phi : phi);
                const y = (i % 3 === 0) ? 0 : (i < 10 ? phi : 1/phi);
                const z = (i % 5 === 0) ? 0 : (i < 10 ? 1/phi : phi);
                this.vertices.push(new Point3D(x, y, z));
            }
            
            this.faces = [];
            for (let i = 0; i < 12; i++) {
                this.faces.push([
                    i, (i + 1) % 12, (i + 2) % 12, (i + 3) % 12, (i + 4) % 12
                ]);
            }
            
            this.faceNumbers = Array.from({length: 12}, (_, i) => i + 1);
        }
        
        initIcosahedron() {
            const phi = (1 + Math.sqrt(5)) / 2;
            
            this.vertices = [];
            for (let i = 0; i < 12; i++) {
                const x = (i % 2 === 0) ? 0 : (i < 6 ? 1 : phi);
                const y = (i % 3 === 0) ? 0 : (i < 6 ? phi : 1);
                const z = (i % 4 === 0) ? 0 : (i < 6 ? 1 : phi);
                this.vertices.push(new Point3D(x, y, z));
            }
            
            this.faces = [];
            for (let i = 0; i < 20; i++) {
                this.faces.push([
                    i % 12, (i + 1) % 12, (i + 2) % 12
                ]);
            }
            
            this.faceNumbers = Array.from({length: 20}, (_, i) => i + 1);
        }
        
        getRotatedVertices(xAngle, yAngle, zAngle) {
            return this.vertices.map(v => {
                return v.rotateX(xAngle).rotateY(yAngle).rotateZ(zAngle);
            });
        }
    }
    
    let polyhedron = new Polyhedron(shapeTypeSelect.value);
    
    function drawPolyhedron() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const xAngle = parseInt(xRotationSlider.value);
        const yAngle = parseInt(yRotationSlider.value);
        const zAngle = parseInt(zRotationSlider.value);
        const edgeColor = edgeColorPicker.value;
        const faceColor = faceColorPicker.value;
        const showNumbers = showNumbersCheckbox.checked;
        
        const rotatedVertices = polyhedron.getRotatedVertices(xAngle, yAngle, zAngle);
        const projectedVertices = rotatedVertices.map(v => v.project());
        
        const facesWithDepth = polyhedron.faces.map((face, index) => {
            const depth = face.reduce((sum, vertexIndex) => 
                sum + rotatedVertices[vertexIndex].z, 0) / face.length;
            return { face, depth, index };
        });
        
        facesWithDepth.sort((a, b) => a.depth - b.depth);
        
        facesWithDepth.forEach(({ face, index }) => {
            const points = face.map(vertexIndex => projectedVertices[vertexIndex]);
            
            ctx.fillStyle = faceColor;
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.closePath();
            ctx.fill();
            
            ctx.strokeStyle = edgeColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.closePath();
            ctx.stroke();
            
            if (showNumbers && polyhedron.faceNumbers[index] !== undefined) {
                const centerX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
                const centerY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
                
                ctx.fillStyle = '#000000';
                ctx.font = `${canvas.width / 10}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(polyhedron.faceNumbers[index], centerX, centerY);
            }
        });
    }
    
    shapeTypeSelect.addEventListener('change', function() {
        polyhedron = new Polyhedron(this.value);
        drawPolyhedron();
    });
    
    xRotationSlider.addEventListener('input', function() {
        xRotationValue.textContent = `${this.value}°`;
        drawPolyhedron();
    });
    
    yRotationSlider.addEventListener('input', function() {
        yRotationValue.textContent = `${this.value}°`;
        drawPolyhedron();
    });
    
    zRotationSlider.addEventListener('input', function() {
        zRotationValue.textContent = `${this.value}°`;
        drawPolyhedron();
    });
    
    edgeColorPicker.addEventListener('input', drawPolyhedron);
    faceColorPicker.addEventListener('input', drawPolyhedron);
    showNumbersCheckbox.addEventListener('change', drawPolyhedron);
    
    drawPolyhedron();
    
    const animateBtn = document.createElement('button');
    animateBtn.textContent = '自动旋转';
    animateBtn.style.position = 'fixed';
    animateBtn.style.bottom = '20px';
    animateBtn.style.right = '20px';
    animateBtn.style.padding = '10px 20px';
    animateBtn.style.backgroundColor = '#3498db';
    animateBtn.style.color = 'white';
    animateBtn.style.border = 'none';
    animateBtn.style.borderRadius = '5px';
    animateBtn.style.cursor = 'pointer';
    document.body.appendChild(animateBtn);
    
    let isAnimating = false;
    let animationId = null;
    
    animateBtn.addEventListener('click', function() {
        if (isAnimating) {
            cancelAnimationFrame(animationId);
            animateBtn.textContent = '自动旋转';
            isAnimating = false;
        } else {
            animateBtn.textContent = '停止旋转';
            isAnimating = true;
            
            let lastTime = 0;
            const animate = (time) => {
                if (!lastTime) lastTime = time;
                const delta = time - lastTime;
                lastTime = time;
                
                yRotationSlider.value = (parseInt(yRotationSlider.value) + delta * 0.05) % 360;
                yRotationValue.textContent = `${yRotationSlider.value}°`;
                drawPolyhedron();
                
                animationId = requestAnimationFrame(animate);
            };
            
            animationId = requestAnimationFrame(animate);
        }
    });
});