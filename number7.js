const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const imageInput = document.getElementById('imageInput');
const ratioInput = document.getElementById('ratio');

imageInput.addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                applyUnsharpMask();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

function applyUnsharpMask() {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imgData.data;
    const ratio = parseFloat(ratioInput.value);

    for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];

        const gray = 0.3 * r + 0.59 * g + 0.11 * b;
        pixels[i] = Math.min(255, gray * ratio + (1 - ratio) * r);
        pixels[i + 1] = Math.min(255, gray * ratio + (1 - ratio) * g);
        pixels[i + 2] = Math.min(255, gray * ratio + (1 - ratio) * b);
        pixels[i + 3] = a;
    }

    ctx.putImageData(imgData, 0, 0);
}