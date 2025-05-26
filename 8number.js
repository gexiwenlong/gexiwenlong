document.addEventListener('DOMContentLoaded', () => {
  const originalCanvas = document.getElementById('originalCanvas');
  const transformedCanvas = document.getElementById('transformedCanvas');
  const resetPointsBtn = document.getElementById('resetPoints');
  const transformImageBtn = document.getElementById('transformImage');

  const ctxOriginal = originalCanvas.getContext('2d');
  const ctxTransformed = transformedCanvas.getContext('2d');

  let originalPoints = [];
  let transformedPoints = [];
  let isSelectingOriginal = true;
  let img = new Image();

  img.src = 'https://via.placeholder.com/400x300';
  img.onload = () => {
    originalCanvas.width = img.width;
    originalCanvas.height = img.height;
    transformedCanvas.width = img.width;
    transformedCanvas.height = img.height;
    ctxOriginal.drawImage(img, 0, 0);
  };

  originalCanvas.addEventListener('click', (e) => {
    if (isSelectingOriginal && originalPoints.length < 3) {
      const rect = originalCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      originalPoints.push({ x, y });
      drawPoint(ctxOriginal, x, y, 'red');
      if (originalPoints.length === 3) isSelectingOriginal = false;
    }
  });

  transformedCanvas.addEventListener('click', (e) => {
    if (!isSelectingOriginal && transformedPoints.length < 3) {
      const rect = transformedCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      transformedPoints.push({ x, y });
      drawPoint(ctxTransformed, x, y, 'blue');
    }
  });

  function drawPoint(ctx, x, y, color) {
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.stroke();
  }

  resetPointsBtn.addEventListener('click', () => {
    originalPoints = [];
    transformedPoints = [];
    isSelectingOriginal = true;
    ctxOriginal.clearRect(0, 0, originalCanvas.width, originalCanvas.height);
    ctxOriginal.drawImage(img, 0, 0);
    ctxTransformed.clearRect(0, 0, transformedCanvas.width, transformedCanvas.height);
  });

  transformImageBtn.addEventListener('click', () => {
    if (originalPoints.length === 3 && transformedPoints.length === 3) {
      const srcTri = originalPoints.map(p => [p.x, p.y]);
      const dstTri = transformedPoints.map(p => [p.x, p.y]);
      transformImage(srcTri, dstTri);
    } else {
      alert('Please select 3 points in each image!');
    }
  });

  function transformImage(srcTri, dstTri) {
    const A = calculateAffineTransform(srcTri, dstTri);

    const isEnlarging = isImageEnlarged(srcTri, dstTri);
    const interpolation = isEnlarging ? 'bilinear' : 'trilinear';

    console.log(`Using ${interpolation} filtering`);

    ctxTransformed.clearRect(0, 0, transformedCanvas.width, transformedCanvas.height);
    ctxTransformed.save();
    ctxTransformed.transform(A[0][0], A[1][0], A[0][1], A[1][1], A[0][2], A[1][2]);
    ctxTransformed.drawImage(originalCanvas, 0, 0);
    ctxTransformed.restore();
  }

  function isImageEnlarged(srcTri, dstTri) {
    const srcArea = calculateTriangleArea(srcTri);
    const dstArea = calculateTriangleArea(dstTri);
    return dstArea > srcArea;
  }

  function calculateTriangleArea(tri) {
    const [a, b, c] = tri;
    return Math.abs((a[0]*(b[1]-c[1]) + b[0]*(c[1]-a[1]) + c[0]*(a[1]-b[1])) / 2);
  }

  function calculateAffineTransform(srcTri, dstTri) {
    const [s1, s2, s3] = srcTri;
    const [d1, d2, d3] = dstTri;

    const M = [
      [s1[0], s1[1], 1, 0, 0, 0],
      [0, 0, 0, s1[0], s1[1], 1],
      [s2[0], s2[1], 1, 0, 0, 0],
      [0, 0, 0, s2[0], s2[1], 1],
      [s3[0], s3[1], 1, 0, 0, 0],
      [0, 0, 0, s3[0], s3[1], 1]
    ];

    const b = [d1[0], d1[1], d2[0], d2[1], d3[0], d3[1]];

    const x = solveLinearSystem(M, b);

    return [
      [x[0], x[1], x[2]],
      [x[3], x[4], x[5]]
    ];
  }

  function solveLinearSystem(M, b) {
    const n = M.length;
    for (let i = 0; i < n; i++) {
      let maxRow = i;
      for (let j = i + 1; j < n; j++) {
        if (Math.abs(M[j][i]) > Math.abs(M[maxRow][i])) {
          maxRow = j;
        }
      }

      [M[i], M[maxRow]] = [M[maxRow], M[i]];
      [b[i], b[maxRow]] = [b[maxRow], b[i]];

      for (let j = i + 1; j < n; j++) {
        const factor = M[j][i] / M[i][i];
        for (let k = i; k < n; k++) {
          M[j][k] -= factor * M[i][k];
        }
        b[j] -= factor * b[i];
      }
    }

    const x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      let sum = 0;
      for (let j = i + 1; j < n; j++) {
        sum += M[i][j] * x[j];
      }
      x[i] = (b[i] - sum) / M[i][i];
    }

    return x;
  }
});