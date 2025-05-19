document.addEventListener('DOMContentLoaded', function () {
    const fileInput = document.getElementById('fileInput');
    const canvas = document.getElementById('imageCanvas');
    const ctx = canvas.getContext('2d');

    fileInput.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (event) {
                const img = new Image();
                img.onload = function () {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);

                    // 获取图像数据
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imageData.data;

                    // 简单的高斯模糊（这里只是示例，实际应用可优化）
                    const blurredData = [...data];
                    const radius = 3;
                    for (let y = 0; y < canvas.height; y++) {
                        for (let x = 0; x < canvas.width; x++) {
                            let r = 0, g = 0, b = 0, a = 0;
                            let count = 0;
                            for (let yy = Math.max(y - radius, 0); yy <= Math.min(y + radius, canvas.height - 1); yy++) {
                                for (let xx = Math.max(x - radius, 0); xx <= Math.min(x + radius, canvas.width - 1); xx++) {
                                    const index = (yy * canvas.width + xx) * 4;
                                    r += data[index];
                                    g += data[index + 1];
                                    b += data[index + 2];
                                    a += data[index + 3];
                                    count++;
                                }
                            }
                            const blurredIndex = (y * canvas.width + x) * 4;
                            blurredData[blurredIndex] = r / count;
                            blurredData[blurredIn