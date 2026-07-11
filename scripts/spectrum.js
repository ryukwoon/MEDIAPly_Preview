// ==========================================
// [데칼코마니 알고리즘] 좌우 대칭 데이터 가공 함수
// ==========================================
function getSymmetricData(rawArray) {
  const symmetric = new Uint8Array(64);
  for (let i = 0; i < 32; i++) {
    symmetric[31 - i] = rawArray[i];
    symmetric[32 + i] = rawArray[i];
  }
  return symmetric;
}

function hexToHSL(hex) {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  
  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

// ==========================================
// [독립 모듈] 해상도 대응형(Scale-aware) 스펙트럼 렌더러 정의
// ==========================================
const SpectrumRenderers = {
  
  led: function(ctx, data, centerX, centerY, hueOffset) {
    const currentTrack = window.tracks[window.activeSlotIndex];
    const specScale = currentTrack.spectrumScale !== undefined ? currentTrack.spectrumScale : 1.0;
    const showReflection = currentTrack.spectrumReflection !== undefined ? currentTrack.spectrumReflection : true;
    const customHSL = hexToHSL(currentTrack.spectrumColor || '#5865f2');

    const scaleX = (ctx.canvas.width / 1280) * specScale;
    const scaleY = (ctx.canvas.height / 720) * specScale;

    const baselineY = centerY; // 외부 드래그 좌표 매핑
    const maxBlocks = 13;  
    const blockHeight = 4 * scaleY; 
    const blockGap = 2 * scaleY;    
    const barWidth = 3 * scaleX;    
    const barGap = 2 * scaleX;
    const totalWidth = (barWidth + barGap) * data.length; 
    let startX = centerX - (totalWidth / 2);

    if (peaks.length !== data.length) {
      peaks = new Array(data.length).fill(0);
    }

    drawHorizonLine(ctx, centerX, baselineY, totalWidth);

    for (let i = 0; i < data.length; i++) {
      const val = data[i];
      const targetBlocks = Math.floor((val / 255) * maxBlocks);
      
      if (targetBlocks >= peaks[i]) {
        peaks[i] = targetBlocks;
      } else {
        peaks[i] = Math.max(0, peaks[i] - 0.15); 
      }

      const hue = (i * (360 / data.length) + customHSL.h + hueOffset) % 360;

      for (let b = 0; b < targetBlocks; b++) {
        const y = baselineY - b * (blockHeight + blockGap) - blockHeight;
        ctx.fillStyle = `hsla(${hue}, ${customHSL.s}%, ${customHSL.l}%, 0.95)`;
        ctx.fillRect(startX, y, barWidth, blockHeight);
      }

      const peakIdx = Math.floor(peaks[i]);
      if (peakIdx > 0 && peakIdx < maxBlocks) {
        const y = baselineY - peakIdx * (blockHeight + blockGap) - blockHeight;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(startX, y, barWidth, blockHeight);
      }

      if (showReflection) {
        for (let b = 0; b < targetBlocks; b++) {
          const y = baselineY + b * (blockHeight + blockGap);
          const opacity = (1 - (b / maxBlocks)) * 0.35;
          ctx.fillStyle = `hsla(${hue}, ${customHSL.s}%, ${customHSL.l}%, ${opacity})`;
          ctx.fillRect(startX, y, barWidth, blockHeight);
        }
      }

      startX += barWidth + barGap;
    }
  },

  dot: function(ctx, data, centerX, centerY, hueOffset) {
    const currentTrack = window.tracks[window.activeSlotIndex];
    const specScale = currentTrack.spectrumScale !== undefined ? currentTrack.spectrumScale : 1.0;
    const showReflection = currentTrack.spectrumReflection !== undefined ? currentTrack.spectrumReflection : true;
    const customHSL = hexToHSL(currentTrack.spectrumColor || '#5865f2');

    const scaleX = (ctx.canvas.width / 1280) * specScale;
    const scaleY = (ctx.canvas.height / 720) * specScale;

    const baselineY = centerY;
    const maxDots = 13;  
    const dotRadius = 1.5 * scaleX; 
    const dotGap = 6 * scaleX;      
    const totalWidth = dotGap * data.length;
    let startX = centerX - (totalWidth / 2);

    if (peaks.length !== data.length) {
      peaks = new Array(data.length).fill(0);
    }

    drawHorizonLine(ctx, centerX, baselineY, totalWidth);

    for (let i = 0; i < data.length; i++) {
      const val = data[i];
      const targetDots = Math.floor((val / 255) * maxDots);
      
      if (targetDots >= peaks[i]) {
        peaks[i] = targetDots;
      } else {
        peaks[i] = Math.max(0, peaks[i] - 0.15);
      }

      const hue = (i * (360 / data.length) + customHSL.h + hueOffset) % 360;

      for (let b = 0; b < targetDots; b++) {
        const y = baselineY - b * dotGap - dotRadius;
        ctx.fillStyle = `hsla(${hue}, ${customHSL.s}%, ${customHSL.l}%, 0.95)`;
        ctx.beginPath();
        ctx.arc(startX, y, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      const peakIdx = Math.floor(peaks[i]);
      if (peakIdx > 0 && peakIdx < maxDots) {
        const y = baselineY - peakIdx * dotGap - dotRadius;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(startX, y, dotRadius * 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      if (showReflection) {
        for (let b = 0; b < targetDots; b++) {
          const y = baselineY + b * dotGap + dotRadius;
          const opacity = (1 - (b / maxDots)) * 0.35;
          ctx.fillStyle = `hsla(${hue}, ${customHSL.s}%, ${customHSL.l}%, ${opacity})`;
          ctx.beginPath();
          ctx.arc(startX, y, dotRadius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      startX += dotGap;
    }
  },

  classicBar: function(ctx, data, centerX, centerY, hueOffset) {
    const currentTrack = window.tracks[window.activeSlotIndex];
    const specScale = currentTrack.spectrumScale !== undefined ? currentTrack.spectrumScale : 1.0;
    const showReflection = currentTrack.spectrumReflection !== undefined ? currentTrack.spectrumReflection : true;
    const customHSL = hexToHSL(currentTrack.spectrumColor || '#5865f2');

    const scaleX = (ctx.canvas.width / 1280) * specScale;
    const scaleY = (ctx.canvas.height / 720) * specScale;

    const baselineY = centerY;
    const barWidth = 3.5 * scaleX; 
    const barGap = 1.5 * scaleX;   
    const maxBarHeight = 70 * scaleY; 
    const totalWidth = (barWidth + barGap) * data.length;
    let startX = centerX - (totalWidth / 2);

    if (peaks.length !== data.length) {
      peaks = new Array(data.length).fill(0);
    }

    drawHorizonLine(ctx, centerX, baselineY, totalWidth);

    for (let i = 0; i < data.length; i++) {
      const val = data[i];
      const barHeight = (val / 255) * maxBarHeight;

      if (barHeight >= peaks[i]) {
        peaks[i] = barHeight;
      } else {
        peaks[i] = Math.max(0, peaks[i] - 1.5 * scaleY);
      }

      const hue = (i * (360 / data.length) + customHSL.h + hueOffset) % 360;

      if (barHeight > 1.5 * scaleY) {
        const barGrad = ctx.createLinearGradient(startX, baselineY, startX, baselineY - barHeight);
        barGrad.addColorStop(0, `hsla(${hue}, ${customHSL.s}%, ${customHSL.l}%, 0.95)`);
        barGrad.addColorStop(0.7, `hsla(${(hue + 25) % 360}, ${customHSL.s}%, ${customHSL.l}%, 0.95)`);
        barGrad.addColorStop(1, '#ffffff');

        ctx.fillStyle = barGrad;
        ctx.beginPath();
        ctx.roundRect(startX, baselineY - barHeight, barWidth, barHeight, [2 * scaleY, 2 * scaleY, 0, 0]);
        ctx.fill();
      }

      if (peaks[i] > 1.5 * scaleY) {
        ctx.fillStyle = `hsla(${(hue + 25) % 360}, 100%, 80%, 1)`;
        ctx.beginPath();
        ctx.roundRect(startX, baselineY - peaks[i] - 4 * scaleY, barWidth, 1.5 * scaleY, 0.7 * scaleY);
        ctx.fill();
      }

      if (showReflection && barHeight > 1.5 * scaleY) {
        const refGrad = ctx.createLinearGradient(startX, baselineY, startX, baselineY + barHeight);
        refGrad.addColorStop(0, `hsla(${hue}, ${customHSL.s}%, ${customHSL.l}%, 0.35)`);
        refGrad.addColorStop(1, `hsla(${hue}, ${customHSL.s}%, ${customHSL.l}%, 0)`);

        ctx.fillStyle = refGrad;
        ctx.beginPath();
        ctx.roundRect(startX, baselineY, barWidth, barHeight, [0, 0, 2 * scaleY, 2 * scaleY]);
        ctx.fill();
      }

      startX += barWidth + barGap;
    }
  },

  seqBar: function(ctx, data, centerX, centerY, hueOffset) {
    const currentTrack = window.tracks[window.activeSlotIndex];
    const specScale = currentTrack.spectrumScale !== undefined ? currentTrack.spectrumScale : 1.0;
    const showReflection = currentTrack.spectrumReflection !== undefined ? currentTrack.spectrumReflection : true;
    const customHSL = hexToHSL(currentTrack.spectrumColor || '#5865f2');

    const scaleX = (ctx.canvas.width / 1280) * specScale;
    const scaleY = (ctx.canvas.height / 720) * specScale;

    const baselineY = centerY; // 외부 드래그 좌표 매핑
    const numBars = 20; 
    const barWidth = 14.5 * scaleX; 
    const barGap = 4.0 * scaleX;    
    const totalWidth = (barWidth + barGap) * numBars - barGap;
    let startX = centerX - (totalWidth / 2);

    const maxBlocks = 30; 
    const blockHeight = 2.0 * scaleY; 
    const blockGap = 1.0 * scaleY;    

    window.seqFrameCounter = window.seqFrameCounter || 0;
    window.seqAccumulatedVal = window.seqAccumulatedVal || 0;
    window.seqBarHeights = window.seqBarHeights || new Array(numBars).fill(0);
    window.seqPeaks = window.seqPeaks || new Array(numBars).fill(0);
    window.seqActiveIndex = window.seqActiveIndex || 0;
    window.seqSilenceFrames = window.seqSilenceFrames || 0;

    let currentVolume = 0;
    let audioEnergy = 0;
    if (data && data.length > 0) {
      let sum = 0;
      const sampleCount = Math.min(24, data.length);
      for (let i = 0; i < sampleCount; i++) {
        sum += data[i];
      }
      currentVolume = sum / sampleCount; 
      audioEnergy = Math.min(1.0, (currentVolume / 255) * 1.8);
    }

    if (audioEnergy < 0.05) {
      window.seqSilenceFrames++;
    } else {
      window.seqSilenceFrames = 0;
    }
    const standbyAlpha = Math.max(0, 1 - (window.seqSilenceFrames / 120));

    window.seqBarHueTime = window.seqBarHueTime || 0;
    const dynamicSpeed = 0.15 + Math.pow(audioEnergy, 2.0) * 2.5;
    window.seqBarHueTime += dynamicSpeed;

    const contrastFactor = 0.15 + Math.pow(audioEnergy, 1.5) * 0.75; 
    const targetVal = Math.min(255, currentVolume * contrastFactor * 1.35);

    window.seqAccumulatedVal = Math.max(window.seqAccumulatedVal, targetVal);
    window.seqFrameCounter++;

    const framePacing = 12;
    if (window.seqFrameCounter >= framePacing) {
      window.seqActiveIndex = Math.floor(Math.random() * numBars);
      window.seqBarHeights[window.seqActiveIndex] = window.seqAccumulatedVal;
      
      window.seqAccumulatedVal = 0;
      window.seqFrameCounter = 0;
    }

    for (let i = 0; i < numBars; i++) {
      window.seqBarHeights[i] = Math.max(0, window.seqBarHeights[i] - 0.5 * scaleY);
      
      if (window.seqBarHeights[i] >= window.seqPeaks[i]) {
        window.seqPeaks[i] = window.seqBarHeights[i];
      } else {
        window.seqPeaks[i] = Math.max(0, window.seqPeaks[i] - 0.22 * scaleY); 
      }
    }

    drawHorizonLine(ctx, centerX, baselineY, totalWidth);

    ctx.save();

    for (let i = 0; i < numBars; i++) {
      const h = window.seqBarHeights[i];
      const peakVal = window.seqPeaks[i];
      
      let targetBlocks = Math.floor((h / 255) * maxBlocks);
      const peakBlockIdx = Math.floor((peakVal / 255) * maxBlocks);

      let isStandbyMode = false;
      if (targetBlocks === 0 && standbyAlpha > 0) {
        targetBlocks = 1;
        isStandbyMode = true;
      }

      for (let b = 0; b < targetBlocks; b++) {
        const y = baselineY - b * (blockHeight + blockGap) - blockHeight;
        const progress = b / maxBlocks;
        
        const baseHue = customHSL.h + progress * 200; 
        const waveOffset = Math.sin(i * 0.3 + window.seqBarHueTime * 0.06) * 18; 
        const hue = (baseHue + waveOffset + 360) % 360;

        const blockAlpha = isStandbyMode ? (0.15 * standbyAlpha) : 0.95;

        ctx.fillStyle = `hsla(${hue}, ${customHSL.s}%, ${customHSL.l}%, ${blockAlpha})`;
        ctx.fillRect(startX, y, barWidth, blockHeight);

        if (showReflection) {
          const yRef = baselineY + b * (blockHeight + blockGap);
          const refOpacity = isStandbyMode ? (0.05 * standbyAlpha) : ((1 - (b / maxBlocks)) * 0.22);
          ctx.fillStyle = `hsla(${hue}, ${customHSL.s}%, ${customHSL.l}%, ${refOpacity})`;
          ctx.fillRect(startX, yRef, barWidth, blockHeight);
        }
      }

      if (!isStandbyMode && peakBlockIdx > 0 && peakBlockIdx < maxBlocks) {
        const y = baselineY - peakBlockIdx * (blockHeight + blockGap) - blockHeight;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(startX, y, barWidth, blockHeight);
      }

      startX += barWidth + barGap;
    }

    ctx.restore();
  },

  randomEq: function(ctx, data, centerX, centerY, hueOffset) {
    const currentTrack = window.tracks[window.activeSlotIndex];
    const specScale = currentTrack.spectrumScale !== undefined ? currentTrack.spectrumScale : 1.0;
    const showReflection = currentTrack.spectrumReflection !== undefined ? currentTrack.spectrumReflection : true;
    const customHSL = hexToHSL(currentTrack.spectrumColor || '#5865f2');

    const scaleX = (ctx.canvas.width / 1280) * specScale;
    const scaleY = (ctx.canvas.height / 720) * specScale;

    const baselineY = centerY; // 외부 드래그 좌표 매핑
    const numBars = 18; 
    const barWidth = 16 * scaleX; 
    const barGap = 5 * scaleX;
    
    const totalWidth = (barWidth + barGap) * numBars - barGap;
    let startX = centerX - (totalWidth / 2);

    window.randomEqHeights = window.randomEqHeights || new Array(numBars).fill(0);
    window.randomEqPeaks = window.randomEqPeaks || new Array(numBars).fill(0);
    window.randomEqSilence = window.randomEqSilence || 0;

    window.randomEqBassActiveIdx = window.randomEqBassActiveIdx !== undefined ? window.randomEqBassActiveIdx : 0;
    window.randomEqTrebleActiveIdx = window.randomEqTrebleActiveIdx !== undefined ? window.randomEqTrebleActiveIdx : 0;
    window.randomEqMidActiveIdx = window.randomEqMidActiveIdx !== undefined ? window.randomEqMidActiveIdx : 0;

    window.randomEqBassFrameCounter = window.randomEqBassFrameCounter || 0;
    window.randomEqTrebleFrameCounter = window.randomEqTrebleFrameCounter || 0;
    window.randomEqMidFrameCounter = window.randomEqMidFrameCounter || 0;

    window.randomEqBassAccum = window.randomEqBassAccum || 0;
    window.randomEqTrebleAccum = window.randomEqTrebleAccum || 0;
    window.randomEqMidAccum = window.randomEqMidAccum || 0;

    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
    }
    const rawEnergy = sum / (data.length * 255);
    const audioEnergy = Math.min(1.0, rawEnergy * 1.8);

    if (audioEnergy < 0.05) {
      window.randomEqSilence++;
    } else {
      window.randomEqSilence = 0;
    }
    const standbyAlpha = Math.max(0, 1 - (window.randomEqSilence / 120));

    let bSum = 0;
    for (let i = 1; i <= 6; i++) bSum += data[i];
    const frameBassVal = bSum / 6;

    let tSum = 0;
    for (let i = 40; i <= 55; i++) tSum += data[i];
    const frameTrebleVal = tSum / 16;

    let mSum = 0;
    for (let i = 12; i <= 27; i++) mSum += data[i];
    const frameMidVal = mSum / 16;

    window.randomEqBassAccum = Math.max(window.randomEqBassAccum, frameBassVal);
    window.randomEqTrebleAccum = Math.max(window.randomEqTrebleAccum, frameTrebleVal);
    window.randomEqMidAccum = Math.max(window.randomEqMidAccum, frameMidVal);
    
    window.randomEqBassFrameCounter++;
    window.randomEqTrebleFrameCounter++;
    window.randomEqMidFrameCounter++;

    const bCool = window.randomEqBassFrameCounter >= 4;
    const tCool = window.randomEqTrebleFrameCounter >= 4;
    const mCool = window.randomEqMidFrameCounter >= 4;

    const maxTimeout = 30;
    const contrastFactor = 0.15 + Math.pow(audioEnergy, 1.5) * 0.75; 
    
    if ((window.randomEqBassAccum >= 140 && bCool) || window.randomEqBassFrameCounter >= maxTimeout) {
      const bPool = [0, 1, 2, 15, 16, 17];
      const bIdx = bPool[Math.floor(Math.random() * bPool.length)];
      const bAddValue = window.randomEqBassAccum * 0.55; 
      window.randomEqHeights[bIdx] = Math.min(255, window.randomEqHeights[bIdx] * 0.25 + bAddValue);
      
      window.randomEqBassAccum = 0;
      window.randomEqBassFrameCounter = 0;
    }

    if ((window.randomEqTrebleAccum >= 60 && tCool) || window.randomEqTrebleFrameCounter >= maxTimeout) {
      const tPool = [6, 7, 8, 9, 10, 11];
      const tIdx = tPool[Math.floor(Math.random() * tPool.length)];
      const tAddValue = window.randomEqTrebleAccum * 1.3; 
      window.randomEqHeights[tIdx] = Math.min(255, window.randomEqHeights[tIdx] * 0.25 + tAddValue);
      
      window.randomEqTrebleAccum = 0;
      window.randomEqTrebleFrameCounter = 0;
    }

    if ((window.randomEqMidAccum >= 100 && mCool) || window.randomEqMidFrameCounter >= maxTimeout) {
      const mPool = [3, 4, 5, 12, 13, 14];
      const mIdx = mPool[Math.floor(Math.random() * mPool.length)];
      const mAddValue = window.randomEqMidAccum * 0.9; 
      window.randomEqHeights[mIdx] = Math.min(255, window.randomEqHeights[mIdx] * 0.25 + mAddValue);
      
      window.randomEqMidAccum = 0;
      window.randomEqMidFrameCounter = 0;
    }

    for (let i = 0; i < numBars; i++) {
      let decayRate = 0.95 * scaleY;
      if (i < 3 || i >= 15) {
        decayRate = 0.45 * scaleY;
      } else if (i >= 6 && i < 12) {
        decayRate = 1.6 * scaleY;
      }

      window.randomEqHeights[i] = Math.max(0, window.randomEqHeights[i] - decayRate);

      if (window.randomEqHeights[i] >= window.randomEqPeaks[i]) {
        window.randomEqPeaks[i] = window.randomEqHeights[i];
      } else {
        window.randomEqPeaks[i] = Math.max(0, window.randomEqPeaks[i] - 0.2 * scaleY);
      }
    }

    drawHorizonLine(ctx, centerX, baselineY, totalWidth);

    const maxBlocks = 30; // 30층 고밀도 슬림 블록
    const blockHeight = 2.0 * scaleY; 
    const blockGap = 1.0 * scaleY;    

    ctx.save();
	let currentX = startX; 

    for (let i = 0; i < numBars; i++) {
      const h = window.randomEqHeights[i];
      const peakVal = window.randomEqPeaks[i];
      
      let targetBlocks = Math.floor((h / 255) * maxBlocks);
      const peakBlockIdx = Math.floor((peakVal / 255) * maxBlocks);

      const heightProgress = h / 255;
      const hue = (i * (360 / numBars) + heightProgress * 240 + hueOffset) % 360; 
      const sat = 95; 
      const lit = 50 + (1 - heightProgress) * 12; 

      let isStandbyMode = false;
      if (targetBlocks === 0 && standbyAlpha > 0) {
        targetBlocks = 1;
        isStandbyMode = true;
      }

      for (let b = 0; b < targetBlocks; b++) {
        const y = baselineY - b * (blockHeight + blockGap) - blockHeight;

        const blockAlpha = isStandbyMode ? (0.15 * standbyAlpha) : 0.95;

        ctx.fillStyle = `hsla(${hue}, ${sat}%, ${lit}%, ${blockAlpha})`;
        ctx.fillRect(currentX, y, barWidth, blockHeight);

        if (showReflection) {
          const yRef = baselineY + b * (blockHeight + blockGap);
          const refOpacity = isStandbyMode ? (0.05 * standbyAlpha) : ((1 - (b / maxBlocks)) * 0.22);
          ctx.fillStyle = `hsla(${hue}, ${sat}%, ${lit}%, ${refOpacity})`;
          ctx.fillRect(currentX, yRef, barWidth, blockHeight);
        }
      }

      if (!isStandbyMode && peakBlockIdx > 0 && peakBlockIdx < maxBlocks) {
        const y = baselineY - peakBlockIdx * (blockHeight + blockGap) - blockHeight;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(currentX, y, barWidth, blockHeight);
      }

      currentX += barWidth + barGap;
    }

    ctx.restore();
  },
  
  equalizer: function(ctx, data, centerX, centerY, hueOffset) {
    this.seqBar(ctx, data, centerX, centerY, hueOffset);
  },

  cyberWave: function(ctx, data, centerX, centerY, hueOffset) {
    const currentTrack = window.tracks[window.activeSlotIndex];
    const specScale = currentTrack.spectrumScale !== undefined ? currentTrack.spectrumScale : 1.0;
    const showReflection = currentTrack.spectrumReflection !== undefined ? currentTrack.spectrumReflection : true;
    const customHSL = hexToHSL(currentTrack.spectrumColor || '#5865f2');

    const scaleX = (ctx.canvas.width / 1280) * specScale;
    const scaleY = (ctx.canvas.height / 720) * specScale;

    const baselineY = centerY;
    const totalWidth = 320 * scaleX;
    const startX = centerX - (totalWidth / 2);

    ctx.strokeStyle = 'rgba(88, 101, 242, 0.05)';
    ctx.lineWidth = 1;
    for (let x = centerX - 160 * scaleX; x <= centerX + 160 * scaleX; x += 15 * scaleX) {
      ctx.beginPath();
      ctx.moveTo(x, baselineY - 60 * scaleY);
      ctx.lineTo(x, baselineY + 60 * scaleY);
      ctx.stroke();
    }

    drawHorizonLine(ctx, centerX, baselineY, totalWidth);

    const waveCount = 3;
    const waveColors = [
      `hsla(${(customHSL.h + hueOffset) % 360}, ${customHSL.s}%, ${customHSL.l}%, 0.8)`,
      `hsla(${(customHSL.h + 40 + hueOffset) % 360}, ${customHSL.s}%, ${customHSL.l}%, 0.55)`,
      `hsla(${(customHSL.h - 40 + hueOffset) % 360}, ${customHSL.s}%, ${customHSL.l}%, 0.4)`
    ];

    for (let w = 0; w < waveCount; w++) {
      ctx.beginPath();
      ctx.lineWidth = (2.5 - w * 0.4) * scaleY;
      ctx.shadowBlur = 8 * scaleY;
      ctx.shadowColor = waveColors[w];

      for (let i = 0; i < data.length; i++) {
        const x = startX + (i / (data.length - 1)) * totalWidth;
        
        const amp = (data[i] / 255) * 45 * scaleY;
        const phase = (i * 0.16) + (hueOffset * 0.04) + (w * Math.PI / 3);
        const yOffset = Math.sin(phase) * amp;

        const progress = i / (data.length - 1);
        const fadeFactor = Math.sin(progress * Math.PI);

        if (i === 0) {
          ctx.moveTo(x, baselineY);
        } else {
          ctx.lineTo(x, baselineY + yOffset * fadeFactor);
        }
      }

      const waveGrad = ctx.createLinearGradient(startX, baselineY, startX + totalWidth, baselineY);
      waveGrad.addColorStop(0, 'rgba(0,0,0,0)');
      waveGrad.addColorStop(0.25, waveColors[w]);
      waveGrad.addColorStop(0.75, waveColors[w]);
      waveGrad.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.strokeStyle = waveGrad;
      ctx.stroke();
      
      if (showReflection) {
        ctx.beginPath();
        ctx.lineWidth = 2 * scaleY;
        for (let i = 0; i < data.length; i++) {
          const x = startX + (i / (data.length - 1)) * totalWidth;
          const amp = (data[i] / 255) * 45 * scaleY;
          const phase = (i * 0.16) + (hueOffset * 0.04) + (w * Math.PI / 3);
          const yOffset = -Math.sin(phase) * amp * 0.35; 
          const progress = i / (data.length - 1);
          const fadeFactor = Math.sin(progress * Math.PI);

          if (i === 0) {
            ctx.moveTo(x, baselineY);
          } else {
            ctx.lineTo(x, baselineY + yOffset * fadeFactor);
          }
        }

        const refWaveGrad = ctx.createLinearGradient(startX, baselineY, startX + totalWidth, baselineY);
        refWaveGrad.addColorStop(0, 'rgba(0,0,0,0)');
        refWaveGrad.addColorStop(0.3, `hsla(${(customHSL.h + hueOffset) % 360}, ${customHSL.s}%, ${customHSL.l}%, 0.15)`);
        refWaveGrad.addColorStop(0.7, `hsla(${(customHSL.h + 40 + hueOffset) % 360}, ${customHSL.s}%, ${customHSL.l}%, 0.15)`);
        refWaveGrad.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.strokeStyle = refWaveGrad;
        ctx.stroke();
      }

      ctx.shadowBlur = 0;
    }
  }
};

function drawHorizonLine(ctx, centerX, y, width) {
  const grad = ctx.createLinearGradient(centerX - width / 1.5, y, centerX + width / 1.5, y);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
  grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.12)');
  grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  
  ctx.strokeStyle = grad;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(centerX - width / 1.5, y);
  ctx.lineTo(centerX + width / 1.5, y);
  ctx.stroke();
}