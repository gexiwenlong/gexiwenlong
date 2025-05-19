function scaleImage() {
  const input = document.getElementById('imageInput');
  const ratioInput = document.getElementById('scaleRatio');
  const container = document.getElementById('imageContainer');
  if (input.files.length === 0) {
    alert('Please select an image first');
    return;
  }
  const ratio = parseFloat(ratioInput.value);
  if (isNaN(ratio) || ratio <= 0) {
    alert('Please enter a valid positive scale ratio');
    return;
  }
  const file = input.files[0];
  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.src = e.target.result;
    img.onload = function () {
      const width = img.width * ratio;
      const height = img.height * ratio;
      img.width = width;
      img.height = height;
      container.innerHTML = '';
      container.appendChild(img);
    };
  };
  reader.readAsDataURL(file);
}