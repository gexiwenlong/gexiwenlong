document.addEventListener('DOMContentLoaded', function() {
    const counterElement = document.getElementById('counter');
    const incrementBtn = document.getElementById('increment');
    const decrementBtn = document.getElementById('decrement');
    const resetBtn = document.getElementById('reset');
    
    let count = 0;

    // Update the counter display
    function updateCounter() {
        counterElement.textContent = count;
        counterElement.style.color = count > 0 ? '#2c3e50' : count < 0 ? '#e74c3c' : '#3498db';
    }

    // Increment button click handler
    incrementBtn.addEventListener('click', function() {
        count++;
        updateCounter();
    });

    // Decrement button click handler
    decrementBtn.addEventListener('click', function() {
        count--;
        updateCounter();
    });

    // Reset button click handler
    resetBtn.addEventListener('click', function() {
        count = 0;
        updateCounter();
    });

    // Initialize counter
    updateCounter();
});