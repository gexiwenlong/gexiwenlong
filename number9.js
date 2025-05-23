const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let vertices = [];
let faces = [];
let angleX = 0;
let angleY = 0;
let angleZ = 0;

function createCube(numFaces = 6) {
  vertices = [];
  faces = [];
  const radius = 100;
  const thetaStep = (2 * Math.PI) / numFaces;

  for (let i = 0; i < numFaces; i++) {
    const theta = i * thetaStep;
    const x = radius * Math.cos(theta);
    const y = radius * Math.sin(theta);
    vertices.push({ x, y, z: -radius / 2 });
    vertices.push({ x, y, z: radius / 2 });
  }

  for (let i = 0; i < numFaces; i++) {
    const i1 = i * 2;
    const i2 = (i === numFaces - 1)? 0 : (i + 1) * 2;
    faces.push([i1, i1 + 1, i2 + 1, i2]);
  }
}

function drawCube() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  const projectionMatrix = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1 / (1 + 0.001 * canvas.width)]
  ];

  const rotationX = [
    [1, 0, 0],
    [0, Math.cos(angleX), -Math.sin(angleX)],
    [0, Math.sin(angleX), Math.cos(angleX)]
  ];
  const rotationY = [
    [Math.cos(angleY), 0, Math.sin(angleY)],
    [0, 1, 0],
    [-Math.sin(angleY), 0, Math.cos(angleY)]
  ];
  const rotationZ = [
    [Math.cos(angleZ), -Math.sin(angleZ), 0],
    [Math.sin(angleZ), Math.cos(angleZ), 0],
    [0, 0, 1]
  ];

  for (const face of faces) {
    const projectedPoints = [];
    for (const vertexIndex of face) {
      const vertex = vertices[vertexIndex];
      let rotatedVertex = multiplyMatrixVector(rotationX, vertex);
      rotatedVertex = multiplyMatrixVector(rotationY, rotatedVertex);
      rotatedVertex = multiplyMatrixVector(rotationZ, rotatedVertex);
      const projectedVertex = multiplyMatrixVector(projectionMatrix, rotatedVertex);
      const x = centerX + projectedVertex.x;
      const y = centerY + projectedVertex.y;
      projectedPoints.push({ x, y });
    }
    ctx.beginPath();
    ctx.moveTo(projectedPoints[0].x, projectedPoints[0].y);
    for (let i = 1; i < projectedPoints.length; i++) {
      ctx.lineTo(projectedPoints[i].x, projectedPoints[i].y);
    }
    ctx.closePath();
    ctx.stroke();
  }
}

function multiplyMatrixVector(matrix, vector) {
  return {
    x: matrix[0][0] * vector.x + matrix[0][1] * vector.y + matrix[0][2] * vector.z,
    y: matrix[1][0] * vector.x + matrix[1][1] * vector.y + matrix[1][2] * vector.z,
    z: matrix[2][0] * vector.x + matrix[2][1] * vector.y + matrix[2][2] * vector.z
  };
}

function updateCube() {
  const numFaces = parseInt(document.getElementById('numFaces').value);
  createCube(numFaces);
  drawCube();
}

function handleMouseMove(event) {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  angleX = (y / canvas.height - 0.5) * 2 * Math.PI;
  angleY = (x / canvas.width - 0.5) * 2 * Math.PI;
  drawCube();
}

canvas.addEventListener('mousemove', handleMouseMove);
createCube();
drawCube();