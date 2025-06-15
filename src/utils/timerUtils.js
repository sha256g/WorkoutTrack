// src/utils/timerUtils.js

export const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (num) => String(num).padStart(2, '0');

    if (hours > 0) {
        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    } else {
        return `${pad(minutes)}:${pad(seconds)}`;
    }
};

// Optional: Function for playing a sound
export const playSound = (url) => {
    try {
        const audio = new Audio(url);
        audio.play().catch(e => console.error("Error playing sound:", e));
    } catch (e) {
        console.error("Failed to create Audio object:", e);
    }
};

// Optional: Function for vibration (for mobile PWA)
export const vibrate = (pattern = [200, 100, 200]) => {
    if (navigator.vibrate) {
        navigator.vibrate(pattern);
    }
};