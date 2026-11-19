const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", { alpha: false });

let particles = [];
let nameParticles = [];

const particleCount = 15000;
const nama = "sisilia";

let nameOpacity = 0;
let nameReady = false;
let lastTime = 0;

// --- Posisi Pointer (untuk interaksi halus pada nama) ---
const pointer = { x: -9999, y: -9999, active: false };

window.addEventListener("pointermove", (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.active = true;
});

window.addEventListener("pointerleave", () => {
    pointer.active = false;
});

// --- 1. Pre-render Sprite Partikel ---
function createParticleSprite(coreColor, glowColor) {
    const sprite = document.createElement("canvas");
    const size = 32;
    sprite.width = size;
    sprite.height = size;
    const sCtx = sprite.getContext("2d");

    const half = size / 2;
    const grad = sCtx.createRadialGradient(half, half, 0, half, half, half);
    grad.addColorStop(0, coreColor);
    grad.addColorStop(0.35, glowColor);
    grad.addColorStop(1, "rgba(0, 140, 255, 0)");

    sCtx.fillStyle = grad;
    sCtx.beginPath();
    sCtx.arc(half, half, half, 0, Math.PI * 2);
    sCtx.fill();

    return sprite;
}

const heartSprite = createParticleSprite("rgba(150, 225, 255, 1)", "rgba(22, 140, 255, 0.65)");
const nameSprite = createParticleSprite("rgba(215, 245, 255, 1)", "rgba(32, 175, 255, 0.85)");
const sparkSprite = createParticleSprite("rgba(120, 210, 255, 0.9)", "rgba(0, 140, 255, 0.3)");

// --- 2. Pengaturan Foto ---
const personImg = new Image();
personImg.src = "foto.jpeg";

let photoOpacity = 0;
let photoReady = false;

personImg.onload = () => {
    photoReady = true;
};

// --- 3. Pengaturan Musik Latar ---
const bgMusic = new Audio("lagu.mp4");
bgMusic.loop = true;
bgMusic.volume = 0;

const targetVolume = 0.5;
let isMusicPlaying = false;
let fadeInterval = null;

const musicBtn = document.createElement("button");
musicBtn.textContent = "♪ Klik layar untuk Musik";
musicBtn.style.cssText = `
    position: fixed;
    top: 16px;
    right: 16px;
    z-index: 999;
    padding: 8px 14px;
    border-radius: 999px;
    border: 1px solid rgba(124, 224, 255, 0.5);
    background: rgba(0, 25, 55, 0.75);
    color: #a8ecff;
    font-family: Arial, sans-serif;
    font-size: 13px;
    cursor: pointer;
    backdrop-filter: blur(4px);
`;
document.body.appendChild(musicBtn);

function fadeVolumeTo(goalVolume, durationMs = 1200) {
    clearInterval(fadeInterval);
    const steps = 24;
    const stepTime = durationMs / steps;
    const startVolume = bgMusic.volume;
    const delta = (goalVolume - startVolume) / steps;
    let currentStep = 0;

    fadeInterval = setInterval(() => {
        currentStep++;
        const nextVol = Math.max(0, Math.min(1, startVolume + delta * currentStep));
        bgMusic.volume = nextVol;

        if (currentStep >= steps) {
            bgMusic.volume = goalVolume;
            clearInterval(fadeInterval);
            if (goalVolume === 0) {
                bgMusic.pause();
            }
        }
    }, stepTime);
}

function playMusic() {
    bgMusic.play().then(() => {
        isMusicPlaying = true;
        musicBtn.textContent = "♫ Musik: On";
        fadeVolumeTo(targetVolume, 1200);
    }).catch(() => {
        isMusicPlaying = false;
        musicBtn.textContent = "♪ Klik layar untuk Musik";
    });
}

function pauseMusic() {
    isMusicPlaying = false;
    musicBtn.textContent = "♪ Musik: Off";
    fadeVolumeTo(0, 400);
}

musicBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (isMusicPlaying) {
        pauseMusic();
    } else {
        playMusic();
    }
});

window.addEventListener("DOMContentLoaded", () => {
    playMusic();
});

const unlockAudio = () => {
    if (!isMusicPlaying) {
        playMusic();
    }
    window.removeEventListener("pointerdown", unlockAudio);
    window.removeEventListener("keydown", unlockAudio);
};

window.addEventListener("pointerdown", unlockAudio);
window.addEventListener("keydown", unlockAudio);

// --- 4. Ukuran Canvas & Koordinat ---
let width = window.innerWidth;
let height = window.innerHeight;

function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

resizeCanvas();

const centerX = () => width / 2;
const centerY = () => height / 2;

function heart(t) {
    return {
        x: 16 * Math.pow(Math.sin(t), 3),
        y: -(13 * Math.cos(t)
            - 5 * Math.cos(2 * t)
            - 2 * Math.cos(3 * t)
            - Math.cos(4 * t))
    };
}

// --- 5. Partikel Hati ---
class Particle {
    constructor() {
        const t = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random());
        const h = heart(t);

        this.targetX = h.x * 13 * r;
        this.targetY = h.y * 13 * r;

        this.x = centerX() + this.targetX;
        this.y = centerY() + this.targetY;
        this.vx = 0;
        this.vy = 0;

        this.drawSize = (Math.random() * 1.2 + 0.35) * 4.2;
        this.offset = Math.random() * Math.PI * 2;
        this.alpha = 0.7;
    }

    update(time, dtFactor) {
        const beat = Math.sin(time * 0.0022) + 0.25 * Math.sin(time * 0.0044);
        const pulse = 1 + beat * 0.028;

        const tx = centerX() + this.targetX * pulse;
        const ty = centerY() + this.targetY * pulse;

        const spring = 0.018 * dtFactor;
        const damping = Math.pow(0.84, dtFactor);

        this.vx = (this.vx + (tx - this.x) * spring) * damping;
        this.vy = (this.vy + (ty - this.y) * spring) * damping;

        this.x += this.vx * dtFactor;
        this.y += this.vy * dtFactor;

        const wave = 0.5 + 0.5 * Math.sin(time * 0.0028 + this.offset);
        this.alpha = 0.22 + wave * 0.78;
    }

    draw() {
        ctx.globalAlpha = this.alpha;
        const half = this.drawSize * 0.5;
        ctx.drawImage(heartSprite, this.x - half, this.y - half, this.drawSize, this.drawSize);
    }
}

function createHeartParticles() {
    particles = [];
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
}

// --- 6. Partikel Nama dengan Animasi Gelombang, Denyut & Interaksi ---
function createNameParticles() {
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");

    tempCanvas.width = width;
    tempCanvas.height = height;

    let fontSize = Math.min(width * 0.11, 96);
    tempCtx.font = `bold ${fontSize}px Arial`;

    while (tempCtx.measureText(nama).width > width * 0.85) {
        fontSize -= 2;
        tempCtx.font = `bold ${fontSize}px Arial`;
    }

    tempCtx.textAlign = "center";
    tempCtx.textBaseline = "middle";
    tempCtx.fillStyle = "white";

    const nameY = centerY() - Math.min(280, height * 0.32);
    tempCtx.fillText(nama, centerX(), nameY);

    const imageData = tempCtx.getImageData(0, 0, width, height);

    nameParticles = [];

    for (let y = 0; y < height; y += 2) {
        for (let x = 0; x < width; x += 2) {
            const index = (y * width + x) * 4;

            if (imageData.data[index + 3] > 128) {
                // Partikel muncul berputar/menyebar dari sekitar pusat nama
                const angle = Math.random() * Math.PI * 2;
                const radius = 80 + Math.random() * 140;

                nameParticles.push({
                    x: centerX() + Math.cos(angle) * radius,
                    y: nameY + Math.sin(angle) * radius,
                    vx: 0,
                    vy: 0,
                    baseX: x,
                    baseY: y,
                    nameCenterY: nameY,
                    baseSize: (Math.random() * 1.1 + 0.5) * 4.4,
                    offset: Math.random() * Math.PI * 2
                });
            }
        }
    }

    nameReady = true;
}

function drawName(time, dtFactor) {
    if (!nameReady) return;

    const fadeEase = 1 - Math.pow(1 - 0.02, dtFactor);
    nameOpacity += (1 - nameOpacity) * fadeEase;

    // Denyut ringan selaras dengan detak hati
    const beat = Math.sin(time * 0.0022) + 0.25 * Math.sin(time * 0.0044);
    const scalePulse = 1 + beat * 0.022;

    const spring = 0.016 * dtFactor;
    const damping = Math.pow(0.84, dtFactor);
    const cx = centerX();

    for (let i = 0; i < nameParticles.length; i++) {
        const p = nameParticles[i];

        // 1. Efek gelombang mengambang (wave) dari kiri ke kanan
        const waveY = Math.sin(time * 0.0032 + p.baseX * 0.025) * 6;
        const waveX = Math.cos(time * 0.0024 + p.baseY * 0.03) * 2;

        // 2. Efek bernapas/denyut dari titik pusat tulisan
        const tx = cx + (p.baseX - cx) * scalePulse + waveX;
        const ty = p.nameCenterY + (p.baseY - p.nameCenterY) * scalePulse + waveY;

        p.vx = (p.vx + (tx - p.x) * spring) * damping;
        p.vy = (p.vy + (ty - p.y) * spring) * damping;

        // 3. Interaksi kursor/sentuhan: partikel menyebar lembut saat didekati
        if (pointer.active) {
            const dx = p.x - pointer.x;
            const dy = p.y - pointer.y;
            const distSq = dx * dx + dy * dy;
            const maxDist = 70;

            if (distSq < maxDist * maxDist && distSq > 0.01) {
                const dist = Math.sqrt(distSq);
                const force = (1 - dist / maxDist) * 1.8 * dtFactor;
                p.vx += (dx / dist) * force;
                p.vy += (dy / dist) * force;
            }
        }

        p.x += p.vx * dtFactor;
        p.y += p.vy * dtFactor;

        // 4. Kilau bintang bergerak menyapu huruf dari kiri ke kanan
        const sweep = 0.5 + 0.5 * Math.sin(time * 0.004 - p.baseX * 0.03 + p.offset * 0.3);
        const flicker = 0.65 + 0.35 * sweep;
        const dynamicSize = p.baseSize * (0.9 + 0.25 * sweep);

        ctx.globalAlpha = nameOpacity * flicker;

        const half = dynamicSize * 0.5;
        ctx.drawImage(nameSprite, p.x - half, p.y - half, dynamicSize, dynamicSize);
    }

    ctx.globalAlpha = 1;
}

// --- 7. Menggambar Foto ---
function drawPersonPhoto(time, dtFactor) {
    if (!photoReady || !nameReady) return;

    const photoEase = 1 - Math.pow(1 - 0.02, dtFactor);
    photoOpacity += (1 - photoOpacity) * photoEase;

    const beat = Math.sin(time * 0.0022) + 0.25 * Math.sin(time * 0.0044);
    const pulseScale = 1 + beat * 0.012;
    const diameter = Math.min(width, height) * 0.22 * pulseScale;
    const x = centerX();
    const y = centerY() + 10;

    ctx.save();
    ctx.globalAlpha = photoOpacity;
    ctx.shadowColor = "#00b7ff";
    ctx.shadowBlur = 20;

    ctx.beginPath();
    ctx.arc(x, y, diameter / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    const imgRatio = personImg.width / personImg.height;
    let drawW = diameter;
    let drawH = diameter;

    if (imgRatio > 1) {
        drawW = diameter * imgRatio;
    } else {
        drawH = diameter / imgRatio;
    }

    ctx.drawImage(personImg, x - drawW / 2, y - drawH / 2, drawW, drawH);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = photoOpacity * 0.9;
    ctx.strokeStyle = "#7ce0ff";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(x, y, diameter / 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
}

// --- 8. Sparks & Glow ---
let sparks = [];

for (let i = 0; i < 600; i++) {
    sparks.push({
        x: Math.random() * width,
        y: Math.random() * height,
        drawSize: (Math.random() * 1.4 + 0.3) * 4,
        speed: Math.random() * 1.1 + 0.25,
        swayOffset: Math.random() * Math.PI * 2,
        alpha: Math.random() * 0.65 + 0.15
    });
}

function drawSparks(time, dtFactor) {
    for (let i = 0; i < sparks.length; i++) {
        const p = sparks[i];
        p.y -= p.speed * dtFactor;
        p.x += Math.sin(time * 0.0015 + p.swayOffset) * 0.25 * dtFactor;

        if (p.y < -10) {
            p.y = height + 10;
            p.x = Math.random() * width;
        }

        ctx.globalAlpha = p.alpha;
        const half = p.drawSize * 0.5;
        ctx.drawImage(sparkSprite, p.x - half, p.y - half, p.drawSize, p.drawSize);
    }

    ctx.globalAlpha = 1;
}

function drawGlow(time) {
    const x = centerX();
    const y = centerY() + 180;

    const pulse = Math.sin(time * 0.0035) * 10;

    const gradient = ctx.createRadialGradient(
        x, y, 2,
        x, y, 115 + pulse
    );

    gradient.addColorStop(0, "rgba(0, 180, 255, 0.75)");
    gradient.addColorStop(0.4, "rgba(0, 100, 255, 0.28)");
    gradient.addColorStop(1, "rgba(0, 0, 255, 0)");

    ctx.globalAlpha = 1;
    ctx.fillStyle = gradient;

    ctx.beginPath();
    ctx.ellipse(x, y, 105 + pulse, 26, 0, 0, Math.PI * 2);
    ctx.fill();
}

// --- 9. Loop Animasi ---
function animate(time) {
    if (!lastTime) lastTime = time;
    const deltaMs = Math.min(time - lastTime, 50);
    lastTime = time;
    const dtFactor = deltaMs / 16.67;

    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(0, 0, 0, 0.32)";
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = "lighter";

    drawGlow(time);
    drawSparks(time, dtFactor);

    for (let i = 0; i < particles.length; i++) {
        particles[i].update(time, dtFactor);
        particles[i].draw();
    }

    drawName(time, dtFactor);

    ctx.globalCompositeOperation = "source-over";
    drawPersonPhoto(time, dtFactor);

    requestAnimationFrame(animate);
}

createHeartParticles();
requestAnimationFrame(animate);

setTimeout(() => {
    createNameParticles();
}, 2000);

window.addEventListener("resize", () => {
    resizeCanvas();
    createHeartParticles();

    if (nameReady) {
        createNameParticles();
    }
});