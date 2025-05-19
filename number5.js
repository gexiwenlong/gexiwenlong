document.addEventListener('DOMContentLoaded', function() {
    const mainDisplay = document.getElementById('mainDisplay');
    const binaryDisplay = document.getElementById('binaryDisplay');
    const hexDisplay = document.getElementById('hexDisplay');
    const romanDisplay = document.getElementById('romanDisplay');
    const circleDisplay = document.getElementById('circleDisplay');
    
    const incrementBtn = document.getElementById('increment');
    const decrementBtn = document.getElementById('decrement');
    const resetBtn = document.getElementById('reset');
    
    let count = 0;

    // Update all displays
    function updateDisplays() {
        mainDisplay.textContent = count;
        binaryDisplay.textContent = count.toString(2);
        hexDisplay.textContent = count.toString(16).toUpperCase();
        romanDisplay.textContent = toRomanNumeral(count);
        circleDisplay.textContent = generateCircleNumber(count);
        
        // Color coding for main display
        mainDisplay.style.color = count > 0 ? '#3498db' : count < 0 ? '#e74c3c' : '#2c3e50';
    }

    // Convert to Roman numerals
    function toRomanNumeral(num) {
        if (num === 0) return 'N';
        if (num < 0 || num > 3999) return 'Out of range';
        
        const romanNumerals = [
            { value: 1000, symbol: 'M' },
            { value: 900, symbol: 'CM' },
            { value: 500, symbol: 'D' },
            { value: 400, symbol: 'CD' },
            { value: 100, symbol: 'C' },
            { value: 90, symbol: 'XC' },
            { value: 50, symbol: 'L' },
            { value: 40, symbol: 'XL' },
            { value: 10, symbol: 'X' },
            { value: 9, symbol: 'IX' },
            { value: 5, symbol: 'V' },
            { value: 4, symbol: 'IV' },
            { value: 1, symbol: 'I' }
        ];
        
        let result = '';
        for (let i = 0; i < romanNumerals.length; i++) {
            while (num >= romanNumerals[i].value) {
                result += romanNumerals[i].symbol;
                num -= romanNumerals[i].value;
            }
        }
        return result;
    }

    // Generate circle number (0-20)
    function generateCircleNumber(num) {
        if (num < 0 || num > 20) return num;
        
        const circleNumbers = [
            '⓪', '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩',
            '⑪', '⑫', '⑬', '⑭', '⑮', '⑯', '⑰', '⑱', '⑲', '⑳'
        ];
        return circleNumbers[num];
    }

    // Event listeners
    incrementBtn.addEventListener('click', function() {
        count++;
        updateDisplays();
    });

    decrementBtn.addEventListener('click', function() {
        count--;
        updateDisplays();
    });

    resetBtn.addEventListener('click', function() {
        count = 0;
        updateDisplays();
    });

    // Initialize displays
    updateDisplays();
});