/**
 * 🦆 Pogoń Szczecin Interactive Mascot
 * Funny, animated duck mascot that follows mouse and reacts to user interactions
 */

'use strict';

const MASCOT = {
  x: 0,
  y: 0,
  targetX: 0,
  targetY: 0,
  vx: 0,
  vy: 0,
  mood: 'happy', // happy, excited, sleepy, dancing
  animationId: null,
  clickCount: 0,
  lastClickTime: 0,
  isVisible: true,
  scale: 1,
  rotation: 0
};

// Initialize mascot
function initMascot() {
  const container = document.body;
  
  // Create mascot SVG element
  const mascot = document.createElement('div');
  mascot.id = 'pogonMascot';
  mascot.style.cssText = `
    position: fixed;
    width: 120px;
    height: 120px;
    pointer-events: all;
    z-index: 999;
    cursor: pointer;
    user-select: none;
    filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
    transition: transform 0.1s ease;
  `;
  
  mascot.innerHTML = createDuckSVG();
  container.appendChild(mascot);
  
  // Position at random spot
  MASCOT.x = Math.random() * (window.innerWidth - 120);
  MASCOT.y = Math.random() * (window.innerHeight - 120);
  MASCOT.targetX = MASCOT.x;
  MASCOT.targetY = MASCOT.y;
  
  // Track mouse movement
  document.addEventListener('mousemove', (e) => {
    MASCOT.targetX = e.clientX - 60;
    MASCOT.targetY = e.clientY - 60;
  });
  
  // Click interactions
  mascot.addEventListener('click', (e) => {
    e.stopPropagation();
    handleMascotClick();
  });
  
  // Start animation loop
  animateMascot();
  
  // Periodic mood changes
  setInterval(changeMood, 5000);
}

function createDuckSVG() {
  return `
    <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" id="duckSvg">
      <!-- Background glow -->
      <circle cx="60" cy="60" r="65" fill="#FFD700" opacity="0.1" id="duckGlow" />
      
      <!-- Body -->
      <ellipse cx="60" cy="70" rx="45" ry="35" fill="#FFC107" id="duckBody" />
      
      <!-- Head -->
      <circle cx="60" cy="35" r="25" fill="#FFD700" id="duckHead" />
      
      <!-- Eyes (will animate) -->
      <circle cx="50" cy="32" r="5" fill="#000" id="eyeLeft" />
      <circle cx="70" cy="32" r="5" fill="#000" id="eyeRight" />
      <circle cx="51" cy="31" r="2" fill="#FFF" id="eyeShineLeft" />
      <circle cx="71" cy="31" r="2" fill="#FFF" id="eyeShineRight" />
      
      <!-- Beak -->
      <polygon points="75,35 95,32 75,38" fill="#FF6B00" id="duckBeak" />
      
      <!-- Wings -->
      <ellipse cx="40" cy="75" rx="18" ry="28" fill="#FFA500" id="wingLeft" transform="rotate(-20 40 75)" />
      <ellipse cx="80" cy="75" rx="18" ry="28" fill="#FFA500" id="wingRight" transform="rotate(20 80 75)" />
      
      <!-- Feet -->
      <g id="footLeft">
        <line x1="45" y1="100" x2="45" y2="110" stroke="#FF6B00" stroke-width="2" />
        <polyline points="35,110 40,110 45,110 50,110" stroke="#FF6B00" stroke-width="2" fill="none" />
      </g>
      <g id="footRight">
        <line x1="75" y1="100" x2="75" y2="110" stroke="#FF6B00" stroke-width="2" />
        <polyline points="65,110 70,110 75,110 80,110" stroke="#FF6B00" stroke-width="2" fill="none" />
      </g>
      
      <!-- Mouth (changes with mood) -->
      <path d="M 55 45 Q 60 48 65 45" stroke="#000" stroke-width="2" fill="none" id="duckMouth" stroke-linecap="round" />
      
      <!-- Pogoń badge -->
      <circle cx="75" cy="85" r="12" fill="#E84C3D" id="pogonBadge" />
      <text x="75" y="90" text-anchor="middle" font-size="14" font-weight="bold" fill="#FFF" id="pogonText">P</text>
    </svg>
  `;
}

function animateMascot() {
  const mascot = document.getElementById('pogonMascot');
  if (!mascot) return;
  
  // Smooth movement towards target with easing
  const dx = MASCOT.targetX - MASCOT.x;
  const dy = MASCOT.targetY - MASCOT.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance > 1) {
    MASCOT.vx += dx * 0.05;
    MASCOT.vy += dy * 0.05;
  }
  
  // Apply friction
  MASCOT.vx *= 0.92;
  MASCOT.vy *= 0.92;
  
  // Update position
  MASCOT.x += MASCOT.vx;
  MASCOT.y += MASCOT.vy;
  
  // Keep in bounds
  MASCOT.x = Math.max(0, Math.min(MASCOT.x, window.innerWidth - 120));
  MASCOT.y = Math.max(0, Math.min(MASCOT.y, window.innerHeight - 120));
  
  // Calculate rotation based on velocity
  if (Math.abs(MASCOT.vx) > 0.5) {
    MASCOT.rotation = MASCOT.vx > 0 ? -5 : 5;
  } else {
    MASCOT.rotation *= 0.9;
  }
  
  // Apply animations
  mascot.style.transform = `translate(${MASCOT.x}px, ${MASCOT.y}px) rotate(${MASCOT.rotation}deg) scale(${MASCOT.scale})`;
  
  // Wing flapping
  const wingLeft = document.getElementById('wingLeft');
  const wingRight = document.getElementById('wingRight');
  if (wingLeft && wingRight) {
    const wingFlap = Math.sin(Date.now() / 100) * 8;
    wingLeft.style.transform = `rotate(${-20 + wingFlap} deg)`;
    wingRight.style.transform = `rotate(${20 - wingFlap} deg)`;
  }
  
  // Eye blinking
  if (Math.random() > 0.98) {
    const eyeLeft = document.getElementById('eyeLeft');
    const eyeRight = document.getElementById('eyeRight');
    if (eyeLeft) eyeLeft.setAttribute('ry', '1');
    if (eyeRight) eyeRight.setAttribute('ry', '1');
    
    setTimeout(() => {
      if (eyeLeft) eyeLeft.setAttribute('ry', '5');
      if (eyeRight) eyeRight.setAttribute('ry', '5');
    }, 100);
  }
  
  MASCOT.animationId = requestAnimationFrame(animateMascot);
}

function handleMascotClick() {
  const now = Date.now();
  MASCOT.clickCount++;
  
  // Double click detection
  if (now - MASCOT.lastClickTime < 300 && MASCOT.clickCount === 2) {
    triggerSpecialAnimation();
    MASCOT.clickCount = 0;
  }
  
  MASCOT.lastClickTime = now;
  
  // Single click animation
  animateClick();
  
  // Random reaction
  const reactions = [
    () => showBubble('Quaaack! 🦆'),
    () => showBubble('Pogoń najlepsza! ⚽'),
    () => showBubble('Hej, to mnie!'),
    () => showBubble('Czik-czik! 🐥'),
    () => showBubble('Szczeciński kwakatek! 🎉'),
  ];
  
  reactions[Math.floor(Math.random() * reactions.length)]();
}

function animateClick() {
  MASCOT.scale = 1.2;
  setTimeout(() => {
    MASCOT.scale = 1;
  }, 100);
  
  // Jump
  MASCOT.vy -= 20;
}

function triggerSpecialAnimation() {
  const mascot = document.getElementById('pogonMascot');
  if (!mascot) return;
  
  // Spin animation
  mascot.style.transition = 'transform 0.6s ease';
  mascot.style.transform = `translate(${MASCOT.x}px, ${MASCOT.y}px) rotate(720deg) scale(1.3)`;
  
  showBubble('GOOOOOL! 🎉⚽');
  
  setTimeout(() => {
    mascot.style.transition = 'transform 0.1s ease';
  }, 600);
}

function changeMood() {
  const moods = ['happy', 'excited', 'sleepy', 'dancing', 'silly'];
  MASCOT.mood = moods[Math.floor(Math.random() * moods.length)];
  
  const mouth = document.getElementById('duckMouth');
  const glow = document.getElementById('duckGlow');
  
  switch (MASCOT.mood) {
    case 'happy':
      mouth.setAttribute('d', 'M 55 45 Q 60 48 65 45');
      glow.setAttribute('fill', '#FFD700');
      break;
    case 'excited':
      mouth.setAttribute('d', 'M 55 45 Q 60 50 65 45');
      glow.setAttribute('fill', '#FF69B4');
      showBubble('Wow! 🤩');
      break;
    case 'sleepy':
      mouth.setAttribute('d', 'M 55 48 Q 60 46 65 48');
      glow.setAttribute('fill', '#87CEEB');
      break;
    case 'dancing':
      mouth.setAttribute('d', 'M 54 44 Q 60 50 66 44');
      glow.setAttribute('fill', '#FFD700');
      triggerDance();
      break;
    case 'silly':
      mouth.setAttribute('d', 'M 55 50 Q 60 46 65 50');
      glow.setAttribute('fill', '#FF6B00');
      showBubble('Hehehehe! 😜');
      break;
  }
}

function triggerDance() {
  const svg = document.getElementById('duckSvg');
  if (!svg) return;
  
  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      svg.style.transform = `rotate(${Math.sin(Date.now() / 50) * 10}deg)`;
    }, i * 100);
  }
}

function showBubble(text) {
  const bubble = document.createElement('div');
  bubble.style.cssText = `
    position: fixed;
    left: ${MASCOT.x + 60}px;
    top: ${MASCOT.y - 50}px;
    background: white;
    border: 2px solid #FFD700;
    border-radius: 12px;
    padding: 8px 12px;
    font-size: 14px;
    font-weight: bold;
    color: #333;
    pointer-events: none;
    z-index: 1000;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    animation: bubbleFloat 2s ease-out forwards;
  `;
  
  bubble.textContent = text;
  document.body.appendChild(bubble);
  
  // Add animation
  if (!document.getElementById('bubbleStyle')) {
    const style = document.createElement('style');
    style.id = 'bubbleStyle';
    style.textContent = `
      @keyframes bubbleFloat {
        0% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-40px); }
      }
    `;
    document.head.appendChild(style);
  }
  
  setTimeout(() => bubble.remove(), 2000);
}

// Toggle mascot visibility
function toggleMascot() {
  const mascot = document.getElementById('pogonMascot');
  if (mascot) {
    MASCOT.isVisible = !MASCOT.isVisible;
    mascot.style.display = MASCOT.isVisible ? 'block' : 'none';
  }
}

// Keyboard shortcut (M to toggle)
document.addEventListener('keydown', (e) => {
  if (e.key === 'm' || e.key === 'M') {
    toggleMascot();
  }
});

// Window resize handling
window.addEventListener('resize', () => {
  const mascot = document.getElementById('pogonMascot');
  if (mascot) {
    MASCOT.x = Math.min(MASCOT.x, window.innerWidth - 120);
    MASCOT.y = Math.min(MASCOT.y, window.innerHeight - 120);
  }
});

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Wait for app to be ready
  const checkApp = setInterval(() => {
    const app = document.getElementById('app');
    if (app && !app.classList.contains('hidden')) {
      clearInterval(checkApp);
      setTimeout(initMascot, 500);
    }
  }, 100);
});

// Export for manual use
window.pogonMascot = {
  init: initMascot,
  toggle: toggleMascot,
  changeMood: changeMood,
  click: handleMascotClick
};
