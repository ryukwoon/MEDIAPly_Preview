// ==========================================
// [독립 레지스트리] 모듈형 파티클 통합 설계 데이터베이스
// ==========================================
const ParticleRegistry = {
  
  fireflies: {
    count: 60, // 60개로 강화
    init: function(p) {
      p.size = Math.random() * 3.2 + 1.2; // 반딧불 크기 대폭 상향
      p.speedX = (Math.random() - 0.5) * 0.35;
      p.speedY = -(Math.random() * 0.35 + 0.15);
      p.pulseSpeed = Math.random() * 0.025 + 0.012;
      p.pulsePhase = Math.random() * Math.PI * 2;
      p.hue = Math.random() * 18 + 62;
    },
    draw: function(ctx, p, speedMultiplier, brightnessMultiplier) {
      p.x += p.speedX * speedMultiplier;
      p.y += p.speedY * speedMultiplier;
      p.pulsePhase += p.pulseSpeed * speedMultiplier;

      const blinkValue = (Math.sin(p.pulsePhase) + 1) / 2;
      const currentOpacity = blinkValue * 0.75 * brightnessMultiplier;

      if (p.y < -10) p.y = window.canvas.height + 10;
      if (p.x < -10) p.x = window.canvas.width + 10;
      if (p.x > window.canvas.width + 10) p.x = -10;

      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.shadowBlur = p.size * 5; // 빛 번짐(glow) 아우라 효과 대폭 강화
      ctx.shadowColor = `hsla(${p.hue}, 100%, 75%, ${currentOpacity})`;
      ctx.fillStyle = `hsla(${p.hue}, 100%, 78%, ${currentOpacity})`;
      ctx.fill();
      ctx.restore();
    }
  },

  fireflies_garden: {
    count: 70,
    init: function(p) {
	  p.size = Math.random() * 4.5 + 2.8;
	  p.speedX = (Math.random() - 0.5) * 0.35;
      p.speedY = -(Math.random() * 0.35 + 0.15);
      p.pulseSpeed = Math.random() * 0.035 + 0.015;
      p.pulsePhase = Math.random() * Math.PI * 2;
      p.hue = Math.random() * 25 + 60;
    },
    draw: function(ctx, p, speedMultiplier, brightnessMultiplier) {
      p.x += p.speedX * speedMultiplier;
      p.y += p.speedY * speedMultiplier;
      p.pulsePhase += p.pulseSpeed * speedMultiplier;

      const blinkValue = (Math.sin(p.pulsePhase) + 1) / 2;
      const currentOpacity = blinkValue * 0.75 * brightnessMultiplier;

      if (p.y < -15) p.y = window.canvas.height + 15;                  // 천장을 넘으면 바닥으로
      if (p.y > window.canvas.height + 15) p.y = -15;                 // 바닥을 넘으면 천장으로
      if (p.x < -15) p.x = window.canvas.width + 15;                  // 왼쪽 벽을 넘으면 오른쪽으로
      if (p.x > window.canvas.width + 15) p.x = -15;                  // 오른쪽 벽을 넘으면 왼쪽으로

      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.shadowBlur = p.size * 6.9; // 커진 크기에 대응하여 반짝이는 아우라 광원 범위도 부드럽게 대폭 확장
      ctx.shadowColor = `hsla(${p.hue}, 100%, 75%, ${currentOpacity})`;
      ctx.fillStyle = `hsla(${p.hue}, 100%, 78%, ${currentOpacity})`;
      ctx.fill();
      ctx.restore();
    }
  },

  snow: {
    count: 85,
    init: function(p) {
      p.size = Math.random() * 3 + 1;
      p.speedY = Math.random() * 0.8 + 0.35;
      p.swaySpeed = Math.random() * 0.018 + 0.005;
      p.swayPhase = Math.random() * Math.PI * 2;
      p.swayAmount = Math.random() * 0.6 + 0.2;
      p.alpha = Math.random() * 0.5 + 0.45;
    },
    draw: function(ctx, p, speedMultiplier, brightnessMultiplier) {
      p.swayPhase += p.swaySpeed * (1 + (speedMultiplier - 1) * 0.27);
      p.y += p.speedY * speedMultiplier;
      p.x += Math.sin(p.swayPhase) * p.swayAmount;

      if (p.y > window.canvas.height + 10) {
        p.y = -10;
        p.x = Math.random() * window.canvas.width;
      }
      if (p.x < -10) p.x = window.canvas.width + 10;
      if (p.x > window.canvas.width + 10) p.x = -10;

      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * brightnessMultiplier})`;
      if (p.size > 2.5) {
        ctx.shadowBlur = p.size * 1.5;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
      }
      ctx.fill();
      ctx.restore();
    }
  },

  snow_heavy: {
    count: 180,
    init: function(p) {
      p.size = Math.random() * 7.5 + 2.0;
      p.speedY = Math.random() * 1.3 + 0.6;
      p.swaySpeed = Math.random() * 0.025 + 0.008;
      p.swayPhase = Math.random() * Math.PI * 2;
      p.swayAmount = Math.random() * 1.6 + 0.4;
      p.alpha = Math.random() * 0.45 + 0.5;
    },
    draw: function(ctx, p, speedMultiplier, brightnessMultiplier) {
      p.swayPhase += p.swaySpeed * (1 + (speedMultiplier - 1) * 0.27);
      p.y += p.speedY * speedMultiplier;
      p.x += Math.sin(p.swayPhase) * p.swayAmount;

      if (p.y > window.canvas.height + 10) {
        p.y = -10;
        p.x = Math.random() * window.canvas.width;
      }
      if (p.x < -10) p.x = window.canvas.width + 10;
      if (p.x > window.canvas.width + 10) p.x = -10;

      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * brightnessMultiplier})`;
      if (p.size > 2.5) {
        ctx.shadowBlur = p.size * 1.5;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
      }
      ctx.fill();
      ctx.restore();
    }
  },

  rain: {
    count: 95,
    init: function(p) {
      p.length = Math.random() * 18 + 12;
      p.speedY = Math.random() * 5.5 + 12;
      p.speedX = -1.4;
      p.alpha = Math.random() * 0.22 + 0.14;
    },
    draw: function(ctx, p, speedMultiplier, brightnessMultiplier) {
      const currentRainSpeedY = p.speedY * (1 + (speedMultiplier - 1) * 0.16);
      p.y += currentRainSpeedY;
      p.x += p.speedX;

      if (p.y > window.canvas.height + p.length) {
        p.y = -p.length;
        p.x = Math.random() * window.canvas.width + 150;
      }

      ctx.save();
      ctx.strokeStyle = `rgba(180, 222, 255, ${p.alpha * brightnessMultiplier})`;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + p.speedX * 1.5, p.y + currentRainSpeedY * 0.45);
      ctx.stroke();
      ctx.restore();
    }
  },

  rain_heavy: {
    count: 220,
    init: function(p) {
      p.length = Math.random() * 50 + 30; 
      p.speedY = Math.random() * 7.0 + 13.0;
      p.speedX = -2.8;
      p.alpha = Math.random() * 0.28 + 0.22;
    },
    draw: function(ctx, p, speedMultiplier, brightnessMultiplier) {
      const currentRainSpeedY = p.speedY * (1 + (speedMultiplier - 1) * 0.16);
      p.y += currentRainSpeedY;
      p.x += p.speedX;

      if (p.y > window.canvas.height + p.length) {
        p.y = -p.length;
        p.x = Math.random() * window.canvas.width + 150;
      }

      ctx.save();
      ctx.strokeStyle = `rgba(180, 222, 255, ${p.alpha * brightnessMultiplier})`;
      
      ctx.lineWidth = 7; 
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      
      ctx.lineTo(p.x + p.speedX * 3.2, p.y + currentRainSpeedY * 1.0); 
      
      ctx.stroke();
      ctx.restore();
    }
  },

  campfire: {
    count: 70,
    init: function(p) {
      p.size = Math.random() * 4.2 + 0.8;
      p.speedY = -(Math.random() * 1.9 + 1.3);
      p.speedX = (Math.random() - 0.5) * 0.45;
      p.swaySpeed = Math.random() * 0.035 + 0.015;
      p.swayPhase = Math.random() * Math.PI * 2;
      p.swayAmount = Math.random() * 1.6 + 0.6;
      p.hue = Math.random() * 25 + 13;
    },
    draw: function(ctx, p, speedMultiplier, brightnessMultiplier) {
      p.swayPhase += p.swaySpeed * speedMultiplier;
      p.y += p.speedY * speedMultiplier;
      p.x += (p.speedX + Math.sin(p.swayPhase) * p.swayAmount) * speedMultiplier;

      const heightProgress = p.y / window.canvas.height;
      const fadeStart = 0.15;
      let currentOpacity = 0;
      if (heightProgress > fadeStart) {
        currentOpacity = ((heightProgress - fadeStart) / (1 - fadeStart)) * 0.85 * brightnessMultiplier;
      }
      const currentSize = Math.max(0.2, p.size * heightProgress);

      if (p.y < 50 || currentOpacity <= 0 || p.x < -10 || p.x > window.canvas.width + 10) {
        p.y = window.canvas.height + Math.random() * 60;
        p.x = Math.random() * window.canvas.width;
        p.swayPhase = Math.random() * Math.PI * 2;
      }

      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
      ctx.shadowBlur = currentSize * 3;
      ctx.shadowColor = `hsla(${p.hue}, 100%, 60%, ${currentOpacity})`;
      ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${currentOpacity})`;
      ctx.fill();
      ctx.restore();
    }
  }
};

function initParticles() {
  window.particles = [];
  const effect = window.tracks[window.activeSlotIndex].effect;
  
  if (effect === 'none' || !ParticleRegistry[effect]) return;

  const config = ParticleRegistry[effect];
  for (let i = 0; i < config.count; i++) {
    const p = {
      type: effect,
      x: Math.random() * window.canvas.width,
      y: Math.random() * window.canvas.height
    };
    config.init(p);
    window.particles.push(p);
  }
}

function drawBackgroundAndEffects() {
  const currentTrack = window.tracks[window.activeSlotIndex];
  const effect = currentTrack.effect;
  const enableRipple = effect.includes('ripple') && window.isPlayingOrRecording();
  const hasParticles = (effect !== 'none');

  window.ctx.save();
  
  if (transitionActive && prevImg) {
    const elapsed = Date.now() - transitionStartTime;
    const progress = Math.min(1, elapsed / transitionDuration);
    
    if (progress >= 1) {
      transitionActive = false;
      drawMedia(currentTrack);
    } else {
      renderImageTransition(prevImg, currentTrack, progress, activeTransitionType);
    }
  } else {
    drawMedia(currentTrack);
  }
  
  window.ctx.restore();

  if (hasParticles && window.particles && window.particles.length > 0) {
    let bassEnergy = 0;
    if (window.dataArray && window.analyser) {
      let sum = 0;
      for(let i=0; i<12; i++) sum += window.dataArray[i];
      bassEnergy = (sum / 12) / 255;
    }

    const speedMultiplier = 1 + (bassEnergy * 2.2); 
    const brightnessMultiplier = 1 + (bassEnergy * 0.35);

    for (let p of window.particles) {
      const config = ParticleRegistry[p.type];
      if (config) {
        config.draw(window.ctx, p, speedMultiplier, brightnessMultiplier);
      }
    }
  }
}

function drawMedia(track, x = 0, y = 0, w = window.canvas.width, h = window.canvas.height) {
  if (!track) return;
  if (track.bgType === 'image' && track.img) {
    window.ctx.drawImage(track.img, x, y, w, h);
  } else if (track.bgType === 'video' && track.video) {
    window.ctx.drawImage(track.video, x, y, w, h);
  } else {
    window.ctx.fillStyle = document.body.classList.contains('dark-theme') ? '#151726' : '#eff1f5';
    window.ctx.fillRect(x, y, w, h);
  }
}

function drawMediaElement(el, x, y, w, h) {
  if (el instanceof HTMLImageElement || el instanceof HTMLVideoElement) {
    window.ctx.drawImage(el, x, y, w, h);
  } else {
    window.ctx.fillStyle = document.body.classList.contains('dark-theme') ? '#151726' : '#eff1f5';
    window.ctx.fillRect(el, x, y, w, h);
  }
}

function renderImageTransition(prev, nextTrack, progress, type) {
  ctx.save();
  const prevElement = prev; 
  
  if (type === 'fade') {
    drawMediaElement(prevElement, 0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = progress;
    drawMedia(nextTrack, 0, 0, canvas.width, canvas.height);
  } else if (type === 'slide_left') {
    const xOffset = progress * canvas.width;
    drawMediaElement(prevElement, -xOffset, 0, canvas.width, canvas.height);
    drawMedia(nextTrack, canvas.width - xOffset, 0, canvas.width, canvas.height);
  } else if (type === 'slide_right') {
    const xOffset = progress * canvas.width;
    drawMediaElement(prevElement, xOffset, 0, canvas.width, canvas.height);
    drawMedia(nextTrack, -canvas.width + xOffset, 0, canvas.width, canvas.height);
  } else if (type === 'zoom') {
    drawMediaElement(prevElement, 0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = progress;
    const w = canvas.width * progress;
    const h = canvas.height * progress;
    drawMedia(nextTrack, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
  } else {
    drawMedia(nextTrack, 0, 0, canvas.width, canvas.height);
  }
  ctx.restore();
}

window.currentBounceScale = window.currentBounceScale || 1.0;

function drawMedia(track, x = 0, y = 0, w = window.canvas.width, h = window.canvas.height) {
  if (!track) return;

  let bassEnergy = 0;
  if (window.dataArray && window.analyser && window.isPlayingOrRecording()) {
    let sum = 0;
    for (let i = 0; i < 4; i++) {
      sum += window.dataArray[i];
    }
    bassEnergy = (sum / 4) / 255;
  }

  let multiplier = 0;
  if (window.bounceLevel === 1) multiplier = 0.035;
  else if (window.bounceLevel === 2) multiplier = 0.085;
  else if (window.bounceLevel === 3) multiplier = 0.160;

  const targetScale = 1.0 + Math.pow(bassEnergy, 3.0) * multiplier;

  if (targetScale > window.currentBounceScale) {
    window.currentBounceScale = targetScale;
  } else {
    window.currentBounceScale = 1.0 + (window.currentBounceScale - 1.0) * 0.82;
  }

  if (window.bounceLevel === 0 || !window.isPlayingOrRecording()) {
    window.currentBounceScale = 1.0;
  }

  if (track.bgType === 'image' && track.img) {
    window.ctx.save();
    
    window.ctx.translate(window.canvas.width / 2, window.canvas.height / 2);
    window.ctx.scale(window.currentBounceScale, window.currentBounceScale);
    
    window.ctx.drawImage(track.img, -window.canvas.width / 2, -window.canvas.height / 2, window.canvas.width, window.canvas.height);
    window.ctx.restore();

  } else if (track.bgType === 'video' && track.video) {
    window.ctx.save();
    
    window.ctx.translate(window.canvas.width / 2, window.canvas.height / 2);
    window.ctx.scale(window.currentBounceScale, window.currentBounceScale);
    
    window.ctx.drawImage(track.video, -window.canvas.width / 2, -window.canvas.height / 2, window.canvas.width, window.canvas.height);
    window.ctx.restore();

  } else {
    window.ctx.fillStyle = document.body.classList.contains('dark-theme') ? '#151726' : '#eff1f5';
    window.ctx.fillRect(x, y, w, h);
  }
}
