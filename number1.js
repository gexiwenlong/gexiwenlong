document.getElementById('rotateButton').addEventListener('click', rotateImage);

function rotateImage() {
    const image = document.getElementById('displayImage');
    const degreeInput = document.getElementById('rotationDegree');
    const degree = parseFloat(degreeInput.value);

    if (!image.src || image.src === '#' || !degree) {
        alert('请先上传图片并输入旋转角度！');
        return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = image.src;

    img.onload = function () {
        const radians = (degree * Math.PI) / 180;
        const cos = Math.abs(Math.cos(radians));
        const sin = Math.abs(Math.sin(radians));
        const newWidth = img.width * cos + img.height * sin;
        const newHeight = img.width * sin + img.height * cos;

        canvas.width = newWidth;
        canvas.height = newHeight;

        ctx.translate(newWidth / 2, newHeight / 2);
        ctx.rotate(radians);
        ctx.translate(-img.width / 2, -img.height / 2);
        ctx.drawImage(img, 0, 0);

        image.src = canvas.toDataURL('image/png');
    };
}

document.getElementById('imageInput').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
            document.getElementById('displayImage').src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});