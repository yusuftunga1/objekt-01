/* ==========================================================================
   OBJEKT // 01 — Vanilla JavaScript Engine
   Atelier Vera — Zürich / Kayseri
   ========================================================================== */

'use strict';

/* ==========================================================================
   1. EDİTORYAL BİLDİRİM SİSTEMİ
   ========================================================================== */
let editorialToastTimer = null;

function showEditorialToast(kicker, message) {
    const toast = document.getElementById('editorial-toast');
    document.getElementById('toast-kicker').textContent = kicker;
    document.getElementById('toast-body').textContent = message;

    toast.classList.remove('opacity-0', 'translate-y-4');
    toast.classList.add('opacity-100', 'translate-y-0');

    if (editorialToastTimer) clearTimeout(editorialToastTimer);
    editorialToastTimer = setTimeout(() => {
        toast.classList.remove('opacity-100', 'translate-y-0');
        toast.classList.add('opacity-0', 'translate-y-4');
    }, 3400);
}

/* ==========================================================================
   2. WEB AUDIO API: AKUSTİK ODA FREKANSI (432 Hz Warm Harmonic)
   ========================================================================== */
let audioContext = null;
let masterGain = null;
let oscFundamental = null;
let oscHarmonic = null;
let isAmbientOn = false;

function toggleAmbientAcoustic() {
    const indicator = document.getElementById('sound-indicator');
    const label = document.getElementById('sound-label');

    try {
        if (!audioContext) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            audioContext = new AudioCtx();
        }

        if (!isAmbientOn) {
            if (audioContext.state === 'suspended') audioContext.resume();

            masterGain = audioContext.createGain();
            masterGain.gain.setValueAtTime(0.001, audioContext.currentTime);
            masterGain.gain.exponentialRampToValueAtTime(0.032, audioContext.currentTime + 1.2);

            oscFundamental = audioContext.createOscillator();
            oscHarmonic    = audioContext.createOscillator();

            oscFundamental.type = 'sine';
            oscFundamental.frequency.setValueAtTime(216, audioContext.currentTime);

            oscHarmonic.type = 'sine';
            oscHarmonic.frequency.setValueAtTime(432, audioContext.currentTime);

            oscFundamental.connect(masterGain);
            oscHarmonic.connect(masterGain);
            masterGain.connect(audioContext.destination);

            oscFundamental.start();
            oscHarmonic.start();

            isAmbientOn = true;
            indicator.className = 'w-2 h-2 rounded-full bg-charcoal animate-ping shrink-0';
            label.textContent = 'AKUSTİK: 432 Hz AKTİF';
            showEditorialToast('AKUSTİK DENEYİM AKTİF', '216 Hz & 432 Hz saf elektrostatik sinüs alanı sentezleniyor.');
        } else {
            if (oscFundamental) { oscFundamental.stop(); oscFundamental.disconnect(); }
            if (oscHarmonic)    { oscHarmonic.stop();    oscHarmonic.disconnect();    }
            isAmbientOn = false;
            indicator.className = 'w-2 h-2 rounded-full bg-stone shrink-0';
            label.textContent = 'AKUSTİK: KAPALI';
            showEditorialToast('AKUSTİK DENEYİM DURDURULDU', 'Oda sessizlik moduna döndü.');
        }
    } catch (e) {
        showEditorialToast('SES MOTORU', 'Tarayıcı ses etkileşimi bekliyor.');
    }
}

/* ==========================================================================
   3. HERO CANVAS: CANLI DİPOL MONOLİT & DALGA SİMÜLASYONU
   ========================================================================== */
const heroCanvas = document.getElementById('hero-monolith-canvas');
const heroCtx    = heroCanvas.getContext('2d');
let heroWaveFreq = 1;
let heroMouseX   = 0.5;
let heroMouseY   = 0.5;
let globalPhase  = 0;

function resizeHeroMonolithCanvas() {
    const rect = heroCanvas.parentElement.getBoundingClientRect();
    const dpr  = window.devicePixelRatio || 1;
    heroCanvas.width  = (rect.width - 24) * dpr;
    heroCanvas.height = 310 * dpr;
    heroCtx.scale(dpr, dpr);
}

heroCanvas.addEventListener('mousemove', (e) => {
    const rect = heroCanvas.getBoundingClientRect();
    heroMouseX = (e.clientX - rect.left) / rect.width;
    heroMouseY = (e.clientY - rect.top)  / rect.height;
    const distMeters = (0.4 + Math.hypot(heroMouseX - 0.5, heroMouseY - 0.5) * 3.2).toFixed(2);
    const spl = (96.4 - distMeters * 2.1).toFixed(1);
    document.getElementById('hero-probe-coords').textContent =
        `PROB MESAFESİ: ${distMeters}m (AÇI: ${Math.round((heroMouseX - 0.5) * 180)}°)`;
    document.getElementById('hero-spl-readout').textContent = `SPL: ${spl} dB`;
});

function setHeroWaveProfile(profileId) {
    heroWaveFreq = profileId;
    [1, 2, 3].forEach(id => {
        const btn = document.getElementById(`hero-prof-${id}`);
        btn.className = id === profileId
            ? 'px-2.5 py-1 bg-charcoal text-alabaster uppercase transition-colors'
            : 'px-2.5 py-1 bg-travertine text-stone hover:text-charcoal border border-hairline uppercase transition-colors';
    });
}

function renderHeroMonolithCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const w   = heroCanvas.width  / dpr;
    const h   = heroCanvas.height / dpr;
    heroCtx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const ringCount = 6 + heroWaveFreq * 2;

    for (let i = 1; i <= ringCount; i++) {
        const progress = ((i / ringCount) + (globalPhase * 0.012 * heroWaveFreq)) % 1;
        const radius   = progress * (Math.min(w, h) * 0.44);
        const alpha    = (1 - progress) * 0.45;

        heroCtx.strokeStyle = `rgba(17, 17, 17, ${alpha})`;
        heroCtx.lineWidth   = 1;

        heroCtx.beginPath();
        heroCtx.arc(cx, cy - radius * 0.55, radius * 0.75, 0, Math.PI * 2);
        heroCtx.stroke();

        heroCtx.beginPath();
        heroCtx.arc(cx, cy + radius * 0.55, radius * 0.75, 0, Math.PI * 2);
        heroCtx.stroke();
    }

    // Monolit kesiti (üstten görünüm)
    heroCtx.fillStyle = '#111111';
    heroCtx.fillRect(cx - 48, cy - 5, 96, 10);

    heroCtx.strokeStyle = '#6E6A63';
    heroCtx.lineWidth   = 1;
    heroCtx.strokeRect(cx - 58, cy - 14, 116, 28);

    // İmleç prob çizgisi
    const px = heroMouseX * w;
    const py = heroMouseY * h;
    heroCtx.strokeStyle = 'rgba(17,17,17,0.25)';
    heroCtx.setLineDash([3, 3]);
    heroCtx.beginPath();
    heroCtx.moveTo(cx, cy);
    heroCtx.lineTo(px, py);
    heroCtx.stroke();
    heroCtx.setLineDash([]);

    heroCtx.fillStyle = '#111111';
    heroCtx.beginPath();
    heroCtx.arc(px, py, 4, 0, Math.PI * 2);
    heroCtx.fill();
}

/* ==========================================================================
   4. SCROLL-REACTIVE MANİFESTO METNİ
   ========================================================================== */
const manifestoContainer = document.getElementById('manifesto-text-container');
let manifestoWordSpans = [];

function initManifestoWords() {
    const rawText = manifestoContainer.textContent.trim().replace(/\s+/g, ' ');
    const words   = rawText.split(' ');
    manifestoContainer.innerHTML = '';

    words.forEach((word) => {
        const span = document.createElement('span');
        span.className   = 'manifesto-word';
        span.textContent = word;
        manifestoContainer.appendChild(span);
        manifestoWordSpans.push(span);
    });
}

function updateManifestoOnScroll() {
    const section = document.getElementById('manifesto-section');
    const rect    = section.getBoundingClientRect();
    const windowH = window.innerHeight;

    const start = windowH * 0.82;
    const end   = -rect.height * 0.25;
    let progress = (start - rect.top) / (start - end);
    progress = Math.max(0, Math.min(1, progress));

    const pct = Math.round(progress * 100);
    document.getElementById('manifesto-progress-label').textContent = `${pct}%`;
    document.getElementById('manifesto-progress-bar').style.width   = `${pct}%`;

    const totalWords = manifestoWordSpans.length;
    manifestoWordSpans.forEach((span, idx) => {
        const wordThreshold = idx / totalWords;
        const delta   = (progress * 1.25 - wordThreshold) * 4.5;
        const clamped = Math.max(0, Math.min(1, delta));

        span.style.opacity   = (0.15 + clamped * 0.85).toFixed(3);
        span.style.transform = `scale(${(0.94 + clamped * 0.06).toFixed(3)}) translateY(${((1 - clamped) * 4).toFixed(1)}px)`;
    });
}

/* ==========================================================================
   5. SAHNE 01: GÖZENEKLI ROMA TRAVERTENİ AKUSTİK SÖNÜMLEME SKANERİ
   ========================================================================== */
const stoneCanvas = document.getElementById('travertine-scanner-canvas');
const stoneCtx    = stoneCanvas.getContext('2d');
let currentStoneMaterial = 'travertine';
let scannerY = 0.5;
const stonePores = [];

function initStonePores() {
    for (let i = 0; i < 65; i++) {
        stonePores.push({
            x:  Math.random(),
            y:  Math.random(),
            rx: 4  + Math.random() * 14,
            ry: 2  + Math.random() * 5
        });
    }
}

function resizeStoneCanvas() {
    const rect = stoneCanvas.parentElement.getBoundingClientRect();
    const dpr  = window.devicePixelRatio || 1;
    stoneCanvas.width  = (rect.width - 32) * dpr;
    stoneCanvas.height = 320 * dpr;
    stoneCtx.scale(dpr, dpr);
}

stoneCanvas.addEventListener('mousemove', (e) => {
    const rect = stoneCanvas.getBoundingClientRect();
    scannerY = Math.max(0.08, Math.min(0.92, (e.clientY - rect.top) / rect.height));
});

function setStoneScannerMaterial(mat) {
    currentStoneMaterial = mat;
    ['travertine', 'aluminum', 'wood'].forEach(m => {
        const btn = document.getElementById(`mat-btn-${m}`);
        btn.className = m === mat
            ? 'py-2.5 px-3 bg-charcoal text-alabaster uppercase tracking-wider text-left transition-all'
            : 'py-2.5 px-3 bg-alabaster text-stone hover:text-charcoal border border-hairline uppercase tracking-wider text-left transition-all';
    });

    const meta = {
        travertine: { damp: 'SÖNÜMLEME: -48.6 dB / ms', eff: 'KAVERN SÖNÜMLEME VERİMİ: %99.4' },
        aluminum:   { damp: 'SÖNÜMLEME: -12.4 dB / ms (ÇINLAMA)', eff: 'METALİK REZONANS KAYBI: %61.2' },
        wood:       { damp: 'SÖNÜMLEME: -6.8 dB / ms (KUTU SESİ)', eff: 'PANELLERDE İÇ YANSIMA: %34.0' }
    };
    document.getElementById('stone-damping-readout').textContent = meta[mat].damp;
    document.getElementById('stone-porosity-label').textContent  = meta[mat].eff;
}

function renderStoneScanner() {
    const dpr    = window.devicePixelRatio || 1;
    const w      = stoneCanvas.width  / dpr;
    const h      = stoneCanvas.height / dpr;
    stoneCtx.clearRect(0, 0, w, h);

    const splitX = w * 0.45;
    stoneCtx.fillStyle = '#F3F2EE';
    stoneCtx.fillRect(0, 0, splitX, h);

    if (currentStoneMaterial === 'travertine') {
        stoneCtx.fillStyle = 'rgba(17, 17, 17, 0.14)';
        stonePores.forEach(p => {
            stoneCtx.beginPath();
            stoneCtx.ellipse(p.x * (splitX - 20) + 10, p.y * h, p.rx, p.ry, 0, 0, Math.PI * 2);
            stoneCtx.fill();
        });
    } else if (currentStoneMaterial === 'aluminum') {
        stoneCtx.strokeStyle = 'rgba(17, 17, 17, 0.08)';
        for (let y = 0; y < h; y += 6) {
            stoneCtx.beginPath();
            stoneCtx.moveTo(0, y);
            stoneCtx.lineTo(splitX, y);
            stoneCtx.stroke();
        }
    } else {
        stoneCtx.strokeStyle = 'rgba(140, 122, 107, 0.25)';
        for (let y = 0; y < h; y += 10) {
            stoneCtx.beginPath();
            stoneCtx.moveTo(0, y);
            stoneCtx.bezierCurveTo(splitX * 0.3, y + 6, splitX * 0.7, y - 6, splitX, y);
            stoneCtx.stroke();
        }
    }

    // Skaner lazer çizgisi
    const scanPos = scannerY * h;
    stoneCtx.strokeStyle = '#111111';
    stoneCtx.lineWidth   = 1.5;
    stoneCtx.beginPath();
    stoneCtx.moveTo(0, scanPos);
    stoneCtx.lineTo(w, scanPos);
    stoneCtx.stroke();

    // Sönümleme osilografı
    const decayRate = currentStoneMaterial === 'travertine' ? 0.032
                    : currentStoneMaterial === 'aluminum'   ? 0.007
                    : 0.0035;

    stoneCtx.beginPath();
    stoneCtx.strokeStyle = '#111111';
    stoneCtx.lineWidth   = 1.8;

    for (let x = splitX + 10; x < w - 10; x++) {
        const dist     = x - (splitX + 10);
        const envelope = Math.exp(-dist * decayRate);
        const y        = scanPos + Math.sin(dist * 0.18 - globalPhase * 0.2) * (58 * envelope);
        if (x === splitX + 10) stoneCtx.moveTo(x, y);
        else stoneCtx.lineTo(x, y);
    }
    stoneCtx.stroke();
}

/* ==========================================================================
   6. SAHNE 02: 1.2 MİKRON MYLAR ELEKTROSTATİK DİYAFRAM CANVAS
   ========================================================================== */
const eslCanvas     = document.getElementById('electrostatic-canvas');
const eslCtx        = eslCanvas.getContext('2d');
const eslFreqSlider = document.getElementById('esl-freq-slider');
const eslVoltSlider = document.getElementById('esl-volt-slider');
let eslFreq = 340;
let eslVolt = 5400;

function resizeEslCanvas() {
    const rect = eslCanvas.parentElement.getBoundingClientRect();
    const dpr  = window.devicePixelRatio || 1;
    eslCanvas.width  = (rect.width - 32) * dpr;
    eslCanvas.height = 340 * dpr;
    eslCtx.scale(dpr, dpr);
}

eslFreqSlider.addEventListener('input', (e) => {
    eslFreq = Number(e.target.value);
    document.getElementById('esl-freq-val').textContent = `${eslFreq} Hz`;
});

eslVoltSlider.addEventListener('input', (e) => {
    eslVolt = Number(e.target.value);
    document.getElementById('esl-volt-val').textContent = `${eslVolt.toLocaleString('en-US')} V DC`;
    const respTime = (0.0014 - eslVolt / 10000000).toFixed(4);
    document.getElementById('esl-velocity-readout').textContent = `TEPKİ HIZI: ${respTime} ms`;
});

function renderElectrostaticCanvas() {
    const dpr     = window.devicePixelRatio || 1;
    const w       = eslCanvas.width  / dpr;
    const h       = eslCanvas.height / dpr;
    eslCtx.clearRect(0, 0, w, h);

    const centerX     = w / 2;
    const statorOffset = 58;

    // Stator plakaları
    eslCtx.strokeStyle = '#6E6A63';
    eslCtx.lineWidth   = 2;
    eslCtx.setLineDash([8, 6]);
    eslCtx.beginPath();
    eslCtx.moveTo(centerX - statorOffset, 24);
    eslCtx.lineTo(centerX - statorOffset, h - 24);
    eslCtx.moveTo(centerX + statorOffset, 24);
    eslCtx.lineTo(centerX + statorOffset, h - 24);
    eslCtx.stroke();
    eslCtx.setLineDash([]);

    // Mylar diyafram
    const amp          = (eslVolt / 6500) * 38;
    const freqNorm     = (eslFreq / 340) * 0.035;
    const displacement = Math.sin(globalPhase * 0.14 * (eslFreq / 240)) * amp;

    eslCtx.beginPath();
    eslCtx.strokeStyle = '#111111';
    eslCtx.lineWidth   = 2.5;

    for (let y = 24; y <= h - 24; y += 4) {
        const normY     = (y - 24) / (h - 48);
        const arch      = Math.sin(normY * Math.PI);
        const microRipple = Math.sin(y * freqNorm + globalPhase * 0.2) * 3.5;
        const x         = centerX + (displacement + microRipple) * arch;
        if (y === 24) eslCtx.moveTo(x, y);
        else eslCtx.lineTo(x, y);
    }
    eslCtx.stroke();

    // Planar ses dalgaları
    for (let i = 1; i <= 5; i++) {
        const waveOffset = ((globalPhase * 1.8 + i * 36) % 180);
        const alpha      = (1 - waveOffset / 180) * 0.35;
        eslCtx.strokeStyle = `rgba(17, 17, 17, ${alpha})`;
        eslCtx.lineWidth   = 1;

        eslCtx.beginPath();
        eslCtx.moveTo(centerX + statorOffset + waveOffset, 42);
        eslCtx.lineTo(centerX + statorOffset + waveOffset, h - 42);
        eslCtx.stroke();

        eslCtx.beginPath();
        eslCtx.moveTo(centerX - statorOffset - waveOffset, 42);
        eslCtx.lineTo(centerX - statorOffset - waveOffset, h - 42);
        eslCtx.stroke();
    }
}

/* ==========================================================================
   7. SAHNE 03: DOKUNSAL ALÜMİNYUM KADRAN
   ========================================================================== */
const cncDial = document.getElementById('interactive-cnc-dial');
let isDraggingDial = false;
let currentDialAngle = 65;

function setDialAngle(deg) {
    const clamped  = Math.max(-135, Math.min(135, deg));
    const velocity = Math.abs(clamped - currentDialAngle) * 0.18;
    currentDialAngle = clamped;

    cncDial.style.transform = `rotate(${currentDialAngle.toFixed(1)}deg)`;

    const norm     = (currentDialAngle + 135) / 270;
    const dbVal    = (-64 + norm * 64).toFixed(1);
    const relayStep = Math.max(1, Math.round(norm * 64));

    document.getElementById('dial-db-readout').textContent      = `${dbVal} dB`;
    document.getElementById('dial-relay-readout').textContent   = `ADIM #${relayStep} / 64`;
    document.getElementById('dial-angle-readout').textContent   = `${currentDialAngle >= 0 ? '+' : ''}${currentDialAngle.toFixed(1)}°`;
    document.getElementById('dial-angular-velocity').textContent = `AÇISAL HIZ: ${velocity.toFixed(2)} rad/s`;

    if (isAmbientOn && masterGain && audioContext) {
        const gainVal = Math.max(0.002, norm * 0.06);
        masterGain.gain.setTargetAtTime(gainVal, audioContext.currentTime, 0.05);
    }
}

function animateDialTo(targetDb) {
    const norm        = (targetDb + 64) / 64;
    const targetAngle = -135 + norm * 270;
    setDialAngle(targetAngle);
    showEditorialToast('VISHAY R-2R RÖLE KİLİDİ', `Mekanik zayıflatıcı ${targetDb.toFixed(1)} dB seviyesine kalibre edildi.`);
}

function handleDialPointerMove(clientX, clientY) {
    if (!isDraggingDial) return;
    const rect    = cncDial.getBoundingClientRect();
    const cx      = rect.left + rect.width  / 2;
    const cy      = rect.top  + rect.height / 2;
    const radians = Math.atan2(clientX - cx, -(clientY - cy));
    setDialAngle(radians * (180 / Math.PI));
}

cncDial.addEventListener('mousedown', () => { isDraggingDial = true; });
window.addEventListener('mouseup', () => {
    if (isDraggingDial) {
        isDraggingDial = false;
        document.getElementById('dial-angular-velocity').textContent = 'AÇISAL HIZ: 0.00 rad/s';
    }
});
window.addEventListener('mousemove', (e) => handleDialPointerMove(e.clientX, e.clientY));

cncDial.addEventListener('touchstart', (e) => { isDraggingDial = true; e.preventDefault(); }, { passive: false });
window.addEventListener('touchend', () => { isDraggingDial = false; });
window.addEventListener('touchmove', (e) => {
    if (isDraggingDial && e.touches[0])
        handleDialPointerMove(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: true });

/* ==========================================================================
   8. YATAY KAYAN SERGİ GALERİSİ
   ========================================================================== */
const gallerySection = document.getElementById('sergi-galerisi');
const galleryTrack   = document.getElementById('horizontal-gallery-track');

function updateHorizontalGalleryOnScroll() {
    const rect           = gallerySection.getBoundingClientRect();
    const totalScrollable = gallerySection.offsetHeight - window.innerHeight;
    if (totalScrollable <= 0) return;

    let progress = -rect.top / totalScrollable;
    progress = Math.max(0, Math.min(1, progress));

    const maxTranslate = Math.max(0, galleryTrack.scrollWidth - window.innerWidth + 64);
    galleryTrack.style.transform = `translate3d(${-(progress * maxTranslate)}px, 0, 0)`;

    const pct      = Math.max(20, Math.round(progress * 100));
    const slideIdx = Math.min(5, Math.max(1, Math.ceil(progress * 5)));
    document.getElementById('gallery-scroll-bar').style.width   = `${pct}%`;
    document.getElementById('gallery-index-readout').textContent = `0${slideIdx} / 05`;
}

function nudgeHorizontalGallery(direction) {
    window.scrollBy({ top: direction * window.innerHeight * 0.55, behavior: 'smooth' });
}

/* ==========================================================================
   9. EDİTORYAL KATALOG ŞEMATİK ÇİZİM MOTORU
   ========================================================================== */
const blueprintData = [
    {
        code:  'ŞEMATİK ÇİZİM // CAT-01',
        title: 'Dipol Elektrostatik Kule & Traverten Kaide',
        desc:  'Ön ve arka faz dalgalarının simetrik yayılımını gösteren üstten ve yandan ortografik projeksiyon.',
        svg: `
            <rect x="165" y="25" width="70" height="175" fill="none" stroke="#111111" stroke-width="1.5"/>
            <line x1="200" y1="25" x2="200" y2="200" stroke="#111111" stroke-dasharray="3 3"/>
            <rect x="145" y="200" width="110" height="55" fill="#F3F2EE" stroke="#111111" stroke-width="1.5"/>
            <circle cx="200" cy="112" r="75" fill="none" stroke="#6E6A63" stroke-dasharray="4 4"/>
            <text x="200" y="232" text-anchor="middle" font-family="JetBrains Mono" font-size="9" fill="#111111">TRAVERTEN KAİDE (68.4 KG)</text>`
    },
    {
        code:  'ŞEMATİK ÇİZİM // CAT-02',
        title: '1.2 Mikron Mylar Diyafram & Stator Katmanları',
        desc:  'İki mikro-perfore AL-7075 stator plakası arasında asılı duran iletken Mylar zarın izometrik ayrıştırılmış kesiti.',
        svg: `
            <line x1="120" y1="35" x2="120" y2="245" stroke="#6E6A63" stroke-width="2" stroke-dasharray="6 4"/>
            <path d="M 200 35 Q 222 140 200 245" fill="none" stroke="#111111" stroke-width="2.5"/>
            <line x1="280" y1="35" x2="280" y2="245" stroke="#6E6A63" stroke-width="2" stroke-dasharray="6 4"/>
            <text x="200" y="22" text-anchor="middle" font-family="JetBrains Mono" font-size="9" fill="#111111">1.2 µm MYLAR MEMBRAN</text>`
    },
    {
        code:  'ŞEMATİK ÇİZİM // CAT-03',
        title: '24 Hz – 42 kHz Doğrusal Faz Yanıt Eğrisi',
        desc:  'Oda içi kalibrasyon sonrası elde edilen ±1.2 dB genlik ve < 0.4° faz tutarlılığı grafiği.',
        svg: `
            <line x1="30" y1="220" x2="370" y2="220" stroke="#6E6A63" stroke-width="1"/>
            <line x1="30" y1="130" x2="370" y2="130" stroke="#E5E2DC" stroke-width="1"/>
            <path d="M 35 155 Q 70 130 120 130 L 320 130 Q 350 130 365 142" fill="none" stroke="#111111" stroke-width="2"/>
            <text x="200" y="112" text-anchor="middle" font-family="JetBrains Mono" font-size="9" fill="#111111">±1.2 dB LİNEER FAZ REFERANSI</text>`
    },
    {
        code:  'ŞEMATİK ÇİZİM // CAT-04',
        title: '64-Adım Vishay R-2R Merdiven Attenuator',
        desc:  'Sinyal yolunda kapasitör veya karbon potansiyometre bulundurmayan saf direnç röle topolojisi.',
        svg: `
            <circle cx="200" cy="140" r="78" fill="none" stroke="#111111" stroke-width="1.5"/>
            <circle cx="200" cy="140" r="52" fill="none" stroke="#6E6A63" stroke-dasharray="3 5"/>
            <line x1="200" y1="140" x2="245" y2="95" stroke="#111111" stroke-width="2"/>
            <text x="200" y="245" text-anchor="middle" font-family="JetBrains Mono" font-size="9" fill="#111111">64 ADIM ALTIN RÖLE DİZİLİMİ</text>`
    },
    {
        code:  'ŞEMATİK ÇİZİM // CAT-05',
        title: 'Arka Kaide Saf Gümüş XLR & Optik I2S Terminali',
        desc:  'Traverten taban altına gizlenmiş titreşim izoleli analog ve master dijital giriş plakası.',
        svg: `
            <rect x="65" y="70" width="270" height="140" fill="none" stroke="#111111" stroke-width="1.5"/>
            <circle cx="135" cy="140" r="28" fill="none" stroke="#111111" stroke-width="1.5"/>
            <circle cx="265" cy="140" r="28" fill="none" stroke="#111111" stroke-width="1.5"/>
            <text x="200" y="235" text-anchor="middle" font-family="JetBrains Mono" font-size="9" fill="#111111">SAF GÜMÜŞ XLR & AES/EBU</text>`
    },
    {
        code:  'ŞEMATİK ÇİZİM // CAT-06',
        title: '1,420 mm Monolit Mimari Ölçü Standardı',
        desc:  'Mekan içi yerleşim için milimetrik yükseklik, genişlik ve ağırlık merkezi diyagramı.',
        svg: `
            <line x1="95" y1="25" x2="95" y2="255" stroke="#111111" stroke-width="1"/>
            <rect x="145" y="25" width="110" height="230" fill="none" stroke="#111111" stroke-width="1.5"/>
            <text x="60" y="145" text-anchor="middle" font-family="JetBrains Mono" font-size="9" fill="#111111">1420mm</text>
            <text x="200" y="145" text-anchor="middle" font-family="Instrument Serif" font-size="18" fill="#111111">OBJEKT // 01</text>`
    }
];

/**
 * SVG içeriğini güvenli biçimde temizler.
 * Sadece izin verilen SVG etiketlerine ve niteliklerine izin verir.
 * Bu sayede blueprintData'ya dışarıdan veri enjekte edilse bile XSS engellenir.
 */
function sanitizeSVG(rawSVG) {
    const ALLOWED_TAGS = new Set([
        'rect', 'circle', 'line', 'path', 'text', 'g', 'polyline', 'polygon', 'ellipse'
    ]);
    const ALLOWED_ATTRS = new Set([
        'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry',
        'width', 'height', 'd', 'fill', 'stroke', 'stroke-width',
        'stroke-dasharray', 'text-anchor', 'font-family', 'font-size',
        'font-weight', 'transform', 'opacity'
    ]);

    const parser  = new DOMParser();
    const doc     = parser.parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${rawSVG}</svg>`, 'image/svg+xml');
    const svgEl   = doc.documentElement;
    const output  = document.createDocumentFragment();

    svgEl.childNodes.forEach(node => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        const tag = node.tagName.toLowerCase();
        if (!ALLOWED_TAGS.has(tag)) return;

        const el = document.createElementNS('http://www.w3.org/2000/svg', tag);

        Array.from(node.attributes).forEach(attr => {
            if (ALLOWED_ATTRS.has(attr.name)) {
                el.setAttribute(attr.name, attr.value);
            }
        });

        // Text içeriği güvenli şekilde kopyala
        if (tag === 'text') {
            el.textContent = node.textContent;
        }

        output.appendChild(el);
    });

    return output;
}

function updateBlueprintSchematic(index) {
    // Index sınır kontrolü
    if (index < 0 || index >= blueprintData.length) return;

    const item  = blueprintData[index];
    const svgEl = document.getElementById('catalog-blueprint-svg');

    // Güvenli textContent kullanımı (XSS yok)
    document.getElementById('schematic-code-label').textContent = item.code;
    document.getElementById('schematic-part-title').textContent = item.title;
    document.getElementById('schematic-part-desc').textContent  = item.desc;

    // SVG'yi temizleyip güvenli DOM node'larıyla doldur
    while (svgEl.firstChild) svgEl.removeChild(svgEl.firstChild);
    svgEl.appendChild(sanitizeSVG(item.svg));
}

function copyCatalogSpec(rowEl) {
    // innerText DOM'dan metin alır — güvenli, HTML yorumlamaz
    const raw  = rowEl.innerText.replace(/\s+/g, ' ').trim();
    // Maksimum 300 karakter ile sınırla (potansiyel veri sızdırma önlemi)
    const text = raw.substring(0, 300);
    const payload = `[OBJEKT // 01 KATALOG] ${text}`;

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(payload)
            .then(() => showEditorialToast('KATALOG VERİSİ KOPYALANDI', text.substring(0, 68) + '...'))
            .catch(() => showEditorialToast('KOPYALAMA HATASI', 'Pano erişimi reddedildi.'));
    } else {
        // Güvensiz bağlamda (http://) kopyalama devre dışı
        showEditorialToast('KOPYALAMA DEVRE DIŞI', 'HTTPS bağlantısı gereklidir.');
    }
}

function downloadMonograph() {
    showEditorialToast('MONOGRAFİ İNDİRİLİYOR', 'OBJEKT_01_Architectural_Monograph_2026.pdf hazırlanıyor.');
}

/* ==========================================================================
   10. RANDEVU MODALI KONTROLLERİ
   ========================================================================== */
const appointmentModal = document.getElementById('appointment-modal');

function openAppointmentModal() {
    appointmentModal.classList.remove('hidden');
    appointmentModal.classList.add('flex');
    document.body.style.overflow = 'hidden';
}

function closeAppointmentModal() {
    appointmentModal.classList.add('hidden');
    appointmentModal.classList.remove('flex');
    document.body.style.overflow = '';
}

function submitAppointment(e) {
    e.preventDefault();

    const form = e.target;

    // Form verilerini güvenli şekilde oku (HTML yorumlamadan)
    const nameInput  = form.querySelector('input[type="text"]');
    const emailInput = form.querySelector('input[type="email"]');

    if (!nameInput || !emailInput) return;

    // Basit client-side sanitize: HTML etiketlerini soy
    const sanitize = (str) => str.replace(/[<>"'`]/g, '').trim();

    const name  = sanitize(nameInput.value);
    const email = sanitize(emailInput.value);

    // E-posta regex kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email)) {
        showEditorialToast('GEÇERSİZ E-POSTA', 'Lütfen geçerli bir e-posta adresi girin.');
        return;
    }

    // İsim uzunluk kontrolü
    if (name.length < 2 || name.length > 120) {
        showEditorialToast('GEÇERSİZ AD', 'Ad alanı 2 ile 120 karakter arasında olmalıdır.');
        return;
    }

    // Başarılı gönderim — gerçek uygulamada burada fetch() ile backend'e gönderilir
    console.info('[FORM] Güvenli gönderim tamamlandı.', { name, email }); // Sadece geliştirme ortamında

    closeAppointmentModal();
    form.reset();
    showEditorialToast('ÖZEL DAVETİYE KAYDEDİLDİ', 'Baş küratörümüz 24 saat içinde sizinle iletişime geçecektir.');
}

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAppointmentModal();
});

/* Modal dışına tıklandığında kapat */
appointmentModal.addEventListener('click', (e) => {
    if (e.target === appointmentModal) closeAppointmentModal();
});

/* ==========================================================================
   11. ANA ANİMASYON DÖNGÜSÜ
   ========================================================================== */
function animateEditorialLoop() {
    globalPhase++;
    renderHeroMonolithCanvas();
    renderStoneScanner();
    renderElectrostaticCanvas();
    requestAnimationFrame(animateEditorialLoop);
}

/* ==========================================================================
   12. SCROLL & RESIZE EVENT LISTENERS + INIT
   ========================================================================== */
window.addEventListener('scroll', () => {
    updateManifestoOnScroll();
    updateHorizontalGalleryOnScroll();
}, { passive: true });

window.addEventListener('resize', () => {
    resizeHeroMonolithCanvas();
    resizeStoneCanvas();
    resizeEslCanvas();
    updateHorizontalGalleryOnScroll();
});

window.addEventListener('load', () => {
    initManifestoWords();
    initStonePores();
    resizeHeroMonolithCanvas();
    resizeStoneCanvas();
    resizeEslCanvas();
    updateBlueprintSchematic(0);
    updateManifestoOnScroll();
    updateHorizontalGalleryOnScroll();
    animateEditorialLoop();
});
