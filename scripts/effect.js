// ====================================
// [글로벌 환경 요소 연동 및 전역 브릿지 선언]
// ====================================
const bridgeBgInput = document.getElementById('bridgeBgInput');
const bridgeAudioInput = document.getElementById('bridgeAudioInput');
const audioPlayer = document.getElementById('audioPlayer');
const btnStart = document.getElementById('btnStart');
const btnStop = document.getElementById('btnStop');
const statusText = document.getElementById('statusText');
const canvas = document.getElementById('movieCanvas');
const ctx = canvas.getContext('2d');
const masterVolume = document.getElementById('masterVolume');
let activeRenderQueue = [];
window.stickerLibrary = []; // 왼쪽 사이드바용 템플릿 목록
window.activeEditingLayer = 'stickers'; // 'stickers', 'subtitles', 'spectrum'
const btnFadeIn = document.getElementById('btnFadeIn');
const btnFadeOut = document.getElementById('btnFadeOut');
const fadeInDurationInput = document.getElementById('fadeInDuration');
const fadeOutDurationInput = document.getElementById('fadeOutDuration');
const fadeInValLabel = document.getElementById('fadeInVal');
const fadeOutValLabel = document.getElementById('fadeOutVal');

// ==========================================
//  반투명 슬라이드 가이드 서랍창(Drawer) 제어 리스너
// ==========================================
const btnUserGuide = document.getElementById('btnUserGuide');
const guideDrawer = document.getElementById('guideDrawer');
const btnDrawerClose = document.getElementById('btnDrawerClose');
const drawerOverlay = document.getElementById('drawerOverlay');
const defaultStickers = [ ];
const videoResolutionSelect = document.getElementById('videoResolution');

window.canvas = canvas;
window.ctx = ctx;
window.activeSlotIndex = 0;        
window.peaks = [];
window.particles = []; 

/* === [스티커 업로드 및 그리드 연동 시작] === */
window.triggerStickerUpload = function() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*,video/*'; // 동영상 수용 활성화
  input.multiple = true;
  input.onchange = (e) => {
    Array.from(e.target.files).forEach(file => {
      const url = URL.createObjectURL(file);

      if (file.type.startsWith('video/')) {
        const video = document.createElement('video');
        video.src = url;
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        
        video.onloadeddata = () => {
          window.stickerLibrary.push({
            type: 'video',
            img: video, // drawImage 호환용 공용 키
            name: file.name
          });
          renderStickerGrid();
        };
      } else {
        const img = new Image();
        img.onload = () => {
          window.stickerLibrary.push({
            type: 'image',
            img: img,
            name: file.name
          });
          renderStickerGrid();
        };
        img.src = url;
      }
    });
  };
  input.click();
};

/* === [renderStickerGrid] === */
function renderStickerGrid() {
  const grid = document.getElementById('stickerGrid');
  if (!grid) return;
  grid.innerHTML = '';
  window.stickerLibrary.forEach((s, idx) => {
    const thumb = document.createElement('div');
    thumb.className = 'sticker-thumb';
    thumb.style.cssText = "width: 48px; height: 48px; box-sizing: border-box; flex-shrink: 0; display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 4px; cursor: pointer;";
    if (s.type === 'video') {
      thumb.innerHTML = `<video src="${s.img.src}" muted playsinline style="width: 100%; height: 100%; object-fit: cover; pointer-events: none;"></video>`;
      thumb.onmouseenter = () => {
        const vid = thumb.querySelector('video');
        if (vid) vid.play().catch(e => {});
      };
      thumb.onmouseleave = () => {
        const vid = thumb.querySelector('video');
        if (vid) {
          vid.pause();
          vid.currentTime = 0;
        }
      };
    } else {
      thumb.innerHTML = `<img src="${s.img.src}" style="width: 100%; height: 100%; object-fit: cover;">`;
    }
    thumb.onclick = () => addStickerToTrack(idx);
    grid.appendChild(thumb);
  });
}

/* === [addStickerToTrack 개별 바운스] === */
function addStickerToTrack(libIdx) {
  const currentTrack = window.tracks[window.activeSlotIndex];
  if (!currentTrack) return;
  const template = window.stickerLibrary[libIdx];
  if (!template) return;
  let elementToUse = template.img;
  if (template.type === 'video') {
    const videoClone = document.createElement('video');
    videoClone.src = template.img.src;
    videoClone.muted = true;
    videoClone.loop = true;
    videoClone.playsInline = true;
    videoClone.play().catch(e => console.warn("동영상 스티커 재생 오류:", e));
    elementToUse = videoClone;
  }
  currentTrack.stickers.push({
    type: template.type || 'image',
    img: elementToUse,
    x: canvas.width / 2,
    y: canvas.height / 2,
    scale: 0.3,
    opacity: 1.0,
    bounce: 0.5, // 스티커별 개별 둠칫 바운스 기본 감도 (0.5 배율)
    name: template.name
  });
  currentTrack.selectedStickerIndex = currentTrack.stickers.length - 1;
  selectSticker(currentTrack.selectedStickerIndex);
  drawStaticFrame();
  if (isPlayingOrRecording() && !animFrameId) {
    updateAnimation();
  }
}
/* === [removeActiveSticker] === */
function removeActiveSticker() {
  const currentTrack = window.tracks[window.activeSlotIndex];
  if (!currentTrack || currentTrack.selectedStickerIndex === -1) return;
  currentTrack.stickers.splice(currentTrack.selectedStickerIndex, 1);
  currentTrack.selectedStickerIndex = -1;
  const controls = document.getElementById('stickerControls');
  if (controls) controls.style.display = 'none';  
  drawStaticFrame();
}
window.removeActiveSticker = removeActiveSticker;
/* === [window.tracks] === */
window.tracks = [
  {
    bgType: "none", 
    img: null,
    video: null,
    imageName: "이미지/동영상 선택 📂", 
    imgTransition: "none", 
    audioFile: null,
    audioUrl: null,
    audioName: "오디오 선택 📂",
    effect: "none",
    style: "led",
    text: "", // 레거시 텍스트
    stickers: [],            
    selectedStickerIndex: -1,
    spectrumX: null,          
    spectrumY: null,          
    spectrumScale: 1.0,       
    spectrumReflection: true, 
    spectrumColor: '#5865f2',
    selectedSubIndex: 0,
    subtitles: [
      { text: "", x: null, y: null, scale: 1.0, colorFill: "#ffffff", colorFill2: "#ff3366", colorStroke: "#000000", strokeWidth: 4, hasBg: false, colorBg: "#151726", bgAlpha: 0.7, rotation: 0, gradient: false },
      { text: "", x: null, y: null, scale: 1.0, colorFill: "#ffffff", colorFill2: "#33ff66", colorStroke: "#000000", strokeWidth: 4, hasBg: false, colorBg: "#151726", bgAlpha: 0.7, rotation: 0, gradient: false },
      { text: "", x: null, y: null, scale: 1.0, colorFill: "#ffffff", colorFill2: "#3366ff", colorStroke: "#000000", strokeWidth: 4, hasBg: false, colorBg: "#151726", bgAlpha: 0.7, rotation: 0, gradient: false }
    ]
  }
];
let audioPlayerLocal = audioPlayer;
if (!audioPlayerLocal) {
  audioPlayerLocal = document.createElement('audio');
  audioPlayerLocal.id = 'audioPlayer';
  audioPlayerLocal.style.display = 'none';
  document.body.appendChild(audioPlayerLocal);
}
window.audioPlayerLocal = audioPlayerLocal;
let audioCtx, analyser, source, bufferLength, dataArray, audioDestination;
let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;
let hueOffset = 0;
let animFrameId = null;
let rippleTime = 0;
let enableGlobalFadeIn = false;  
let enableGlobalFadeOut = false; 
let transitionActive = false;
let transitionStartTime = 0;
let transitionDuration = 1000; 
let prevImg = null;
let activeTransitionType = "none";
let playbackStartTime = 0;
let fileLoadTargetIndex = null;
/* === [selectSticker] === */
function selectSticker(idx) {
  const currentTrack = window.tracks[window.activeSlotIndex];
  if (!currentTrack) return;
  currentTrack.selectedStickerIndex = idx;
  const sticker = currentTrack.stickers[idx];
  const controls = document.getElementById('stickerControls');
  const nameLabel = document.getElementById('selectedLogoName');  
  if (sticker) {
    if (controls) controls.style.display = 'block';
    if (nameLabel) nameLabel.innerText = sticker.name;    
    document.getElementById('logoOpacity').value = sticker.opacity;
    document.getElementById('logoScale').value = sticker.scale;
    document.getElementById('logoOpacityVal').innerText = `${Math.round(sticker.opacity * 100)}%`;
    document.getElementById('logoScaleVal').innerText = `${Math.round(sticker.scale * 100)}%`;
    const bounceVal = sticker.bounce !== undefined ? sticker.bounce : 0.5;
    document.getElementById('logoBounce').value = Math.round(bounceVal * 10);
    document.getElementById('logoBounceVal').innerText = `${Math.round(bounceVal * 10)}단`;
  } else {
    if (controls) controls.style.display = 'none';
  }
  drawStaticFrame();
}
document.getElementById('logoOpacity').addEventListener('input', (e) => {
  const currentTrack = window.tracks[window.activeSlotIndex];
  if (currentTrack && currentTrack.selectedStickerIndex > -1) {
    const val = parseFloat(e.target.value);
    currentTrack.stickers[currentTrack.selectedStickerIndex].opacity = val;
    document.getElementById('logoOpacityVal').innerText = `${Math.round(val * 100)}%`;
    drawStaticFrame();
  }
});
document.getElementById('logoScale').addEventListener('input', (e) => {
  const currentTrack = window.tracks[window.activeSlotIndex];
  if (currentTrack && currentTrack.selectedStickerIndex > -1) {
    const val = parseFloat(e.target.value);
    currentTrack.stickers[currentTrack.selectedStickerIndex].scale = val;
    document.getElementById('logoScaleVal').innerText = `${Math.round(val * 100)}%`;
    drawStaticFrame();
  }
});
function isPlayingOrRecording() {
  const isVideoPlaying = window.tracks.some(t => t.video && !t.video.paused);
  return !audioPlayerLocal.paused || isRecording || isVideoPlaying;
}
window.isPlayingOrRecording = isPlayingOrRecording;
// ====================================
// [이벤트 처리기] 글로벌 토글 및 볼륨 슬라이더
// ====================================
btnFadeIn.addEventListener('click', () => {
  enableGlobalFadeIn = !enableGlobalFadeIn;
  btnFadeIn.classList.toggle('active', enableGlobalFadeIn);
});
btnFadeOut.addEventListener('click', () => {
  enableGlobalFadeOut = !enableGlobalFadeOut;
  btnFadeOut.classList.toggle('active', enableGlobalFadeOut);
});
fadeInDurationInput.addEventListener('input', () => {
  fadeInValLabel.innerText = `${parseFloat(fadeInDurationInput.value).toFixed(1)}s`;
});
fadeOutDurationInput.addEventListener('input', () => {
  fadeOutValLabel.innerText = `${parseFloat(fadeOutDurationInput.value).toFixed(1)}s`;
});
if (masterVolume) {
  masterVolume.addEventListener('input', () => {
    audioPlayerLocal.volume = masterVolume.value;
  });
}
/* === [해상도 전환 시 좌표 안전 리셋 시작] === */
videoResolutionSelect.addEventListener('change', () => {
  const selectedRes = videoResolutionSelect.value;
  if (selectedRes === '720') {
    canvas.width = 1280;
    canvas.height = 720;
  } else if (selectedRes === '1080') {
    canvas.width = 1920;
    canvas.height = 1080;
  } else if (selectedRes === '2160') {
    canvas.width = 3840;
    canvas.height = 2160;
  }
  window.tracks.forEach(track => {
    track.spectrumX = null;
    track.spectrumY = null;
    if (track.subtitles) {
      track.subtitles.forEach(sub => {
        sub.x = null;
        sub.y = null;
      });
    }
  });
  drawStaticFrame();
});
// ==================================
//     [동적 타임라인 드로잉 가변 시스템]
// ==================================
function renderTimelineTable() {
  const tbody = document.getElementById('timelineBody');
  const counter = document.getElementById('trackCounter');
  if (!tbody || !counter) return;
  tbody.innerHTML = '';
  counter.innerText = `트랙 ${window.tracks.length}/5`;
  window.tracks.forEach((track, idx) => {
    const row = document.createElement('tr');
    row.className = `timeline-row ${idx === window.activeSlotIndex ? 'active-row' : ''}`;
    row.dataset.index = idx;
    row.addEventListener('click', (e) => {
      if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
      selectActiveRow(idx);
    });
    const deleteBtnHtml = window.tracks.length > 1
      ? `<button class="btn-track-delete" onclick="event.stopPropagation(); deleteTrack(${idx});"><i class="bi bi-x-circle-fill"></i></button>`
      : `<button class="btn-track-delete" disabled><i class="bi bi-x-circle-fill"></i></button>`;
    const hasSubs = track.subtitles && track.selectedSubIndex !== undefined;
    const activeSub = hasSubs ? track.subtitles[track.selectedSubIndex] : null;
    const subTextVal = activeSub ? activeSub.text : "";
    const activeSubIdx = track.selectedSubIndex !== undefined ? track.selectedSubIndex : 0;
    row.innerHTML = `
      <td class="cell-track-header" style="padding: 0;">
        <div class="track-header-wrapper">
          ${deleteBtnHtml}
          <span class="track-title">트랙 ${idx + 1}</span>
        </div>
      </td>
      <td class="cell-file-picker ${track.bgType !== 'none' ? 'has-file image-type' : ''}" onclick="triggerBgUpload(${idx})">${track.imageName}</td>
      <td class="col-arrow">
        <select class="cell-select" onchange="updateTrackData(${idx}, 'imgTransition', this.value)">
          <option value="none" ${track.imgTransition === 'none' ? 'selected' : ''}>화면전환</option>
          <option value="fade" ${track.imgTransition === 'fade' ? 'selected' : ''}>페이드</option>
          <option value="slide_left" ${track.imgTransition === 'slide_left' ? 'selected' : ''}>슬라이드(좌)</option>
          <option value="slide_right" ${track.imgTransition === 'slide_right' ? 'selected' : ''}>슬라이드(우)</option>
          <option value="zoom" ${track.imgTransition === 'zoom' ? 'selected' : ''}>중앙 줌</option>
        </select>
      </td>
      <td class="cell-file-picker ${track.audioUrl ? 'has-file audio-type' : ''}" onclick="triggerAudioUpload(${idx})">${track.audioName}</td>
      <td>
        <select class="cell-select" onchange="updateTrackData(${idx}, 'effect', this.value)">
          <option value="none" ${track.effect === 'none' ? 'selected' : ''}>이펙트 없음</option>
          <option value="fireflies" ${track.effect === 'fireflies' ? 'selected' : ''}>반딧불</option>
          <option value="fireflies_garden" ${track.effect === 'fireflies_garden' ? 'selected' : ''}>반딧불의 정원</option>
		  <option value="snow" ${track.effect === 'snow' ? 'selected' : ''}>겨울밤</option>
		  <option value="snow_heavy" ${track.effect === 'snow_heavy' ? 'selected' : ''}>함박눈</option>
          <option value="rain" ${track.effect === 'rain' ? 'selected' : ''}>이슬비</option>
		  <option value="rain_heavy" ${track.effect === 'rain_heavy' ? 'selected' : ''}>소나기</option>
		  <option value="campfire" ${track.effect === 'campfire' ? 'selected' : ''}>모닥불</option>
        </select>
      </td>
      <td>
        <select class="cell-select" onchange="updateTrackData(${idx}, 'style', this.value)">
          <option value="led" ${track.style === 'led' ? 'selected' : ''}>네온 LED 블록</option>
          <option value="dot" ${track.style === 'dot' ? 'selected' : ''}>네온 동글 도트</option>
          <option value="classicBar" ${track.style === 'classicBar' ? 'selected' : ''}>클래식 라운드 바</option>
          <option value="cyberWave" ${track.style === 'cyberWave' ? 'selected' : ''}>네온 웨이브</option>
		  <option value="seqBar" ${track.style === 'seqBar' ? 'selected' : ''}>아날로그 이퀼라이저</option>
		  <option value="randomEq" ${track.style === 'randomEq' ? 'selected' : ''}>랜덤 이퀼라이저</option>
        </select>
      </td>
      <td>
        <div class="sub-btn-group" style="display: flex; gap: 4px; justify-content: center;">
          <button class="flat-footer-btn sub-slot-btn ${activeSubIdx === 0 ? 'active' : ''}" onclick="event.stopPropagation(); selectTrackSubtitleSlot(${idx}, 0)" style="flex: 1; padding: 4px 2px; font-size: 0.72rem; margin:0; min-width: 55px;">자막 1</button>
          <button class="flat-footer-btn sub-slot-btn ${activeSubIdx === 1 ? 'active' : ''}" onclick="event.stopPropagation(); selectTrackSubtitleSlot(${idx}, 1)" style="flex: 1; padding: 4px 2px; font-size: 0.72rem; margin:0; min-width: 55px;">자막 2</button>
          <button class="flat-footer-btn sub-slot-btn ${activeSubIdx === 2 ? 'active' : ''}" onclick="event.stopPropagation(); selectTrackSubtitleSlot(${idx}, 2)" style="flex: 1; padding: 4px 2px; font-size: 0.72rem; margin:0; min-width: 55px;">자막 3</button>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });
  if (window.tracks.length < 5) {
    const addRow = document.createElement('tr');
    addRow.innerHTML = `
      <td style="text-align: center; height: 38px;">
        <button class="btn-row-add" onclick="addNewTrack()">+</button>
      </td>
      <td colspan="6" style="background-color: var(--cell-bg); pointer-events: none;"></td>
    `;
    tbody.appendChild(addRow);
  }
}
function selectActiveRow(idx) {
  window.tracks.forEach(t => {
    if (t.video) t.video.pause();
  });
  if (idx !== window.activeSlotIndex) {
    const current = window.tracks[window.activeSlotIndex];
    if (current && (current.img || current.video)) {
      prevImg = current.bgType === 'image' ? current.img : current.video;
      transitionActive = true;
      transitionStartTime = Date.now();
      activeTransitionType = window.tracks[idx].imgTransition;
    }
  }
  window.activeSlotIndex = idx;
  const current = window.tracks[window.activeSlotIndex];  
  if (current.audioUrl) {
    audioPlayerLocal.src = current.audioUrl;
  } else {
    audioPlayerLocal.removeAttribute('src');
  }
  if (current.bgType === 'video' && current.video) {
    current.video.play().catch(e => console.log("Video Playback Error:", e));
  }
  initParticles();
  drawStaticFrame();
  renderTimelineTable();  
  renderStickerGrid();
  const currentTrack = window.tracks[window.activeSlotIndex];
  if (currentTrack && currentTrack.selectedStickerIndex > -1) {
    selectSticker(currentTrack.selectedStickerIndex);
  } else {
    const controls = document.getElementById('stickerControls');
    if (controls) controls.style.display = 'none';
  }  
  if (isPlayingOrRecording() && !animFrameId) {
    updateAnimation();
  }
}
/* === [addNewTrack] === */
function addNewTrack() {
  if (window.tracks.length >= 5) return;
  window.tracks.push({
    bgType: "none",
    img: null,
    video: null,
    imageName: "이미지/동영상 선택 📂",
    imgTransition: "none",
    audioFile: null,
    audioUrl: null,
    audioName: "오디오 선택 📂",
    effect: "none",
    style: "led",
    text: "",
    stickers: [],            
    selectedStickerIndex: -1,
    spectrumX: null,
    spectrumY: null,
    spectrumScale: 1.0,
    spectrumReflection: true,
    spectrumColor: '#5865f2',
    selectedSubIndex: 0,
    subtitles: [
      { text: "", x: null, y: null, scale: 1.0, colorFill: "#ffffff", colorFill2: "#ff3366", colorStroke: "#000000", strokeWidth: 4, hasBg: false, colorBg: "#151726", bgAlpha: 0.7, rotation: 0, gradient: false },
      { text: "", x: null, y: null, scale: 1.0, colorFill: "#ffffff", colorFill2: "#33ff66", colorStroke: "#000000", strokeWidth: 4, hasBg: false, colorBg: "#151726", bgAlpha: 0.7, rotation: 0, gradient: false },
      { text: "", x: null, y: null, scale: 1.0, colorFill: "#ffffff", colorFill2: "#3366ff", colorStroke: "#000000", strokeWidth: 4, hasBg: false, colorBg: "#151726", bgAlpha: 0.7, rotation: 0, gradient: false }
    ]
  });
  selectActiveRow(window.tracks.length - 1);
}
function updateTrackData(idx, key, value) {
  window.tracks[idx][key] = value;
  if (key === 'effect') {
    if (idx === window.activeSlotIndex) initParticles();
  }
  drawStaticFrame();
  checkReady();
}
function triggerBgUpload(idx) {
  fileLoadTargetIndex = idx;
  bridgeBgInput.click();
}
function triggerAudioUpload(idx) {
  fileLoadTargetIndex = idx;
  bridgeAudioInput.click();
}
bridgeBgInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file && fileLoadTargetIndex !== null) {
    const url = URL.createObjectURL(file);
    const targetTrack = window.tracks[fileLoadTargetIndex];

    targetTrack.img = null;
    if (targetTrack.video) {
      targetTrack.video.pause();
      targetTrack.video = null;
    }
    if (file.type.startsWith('video/')) {
      const video = document.createElement('video');
      video.src = url;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.addEventListener('loadedmetadata', () => {
        targetTrack.bgType = 'video';
        targetTrack.video = video;
        targetTrack.imageName = file.name;

        if (fileLoadTargetIndex === window.activeSlotIndex) {
          video.play().catch(err => console.log(err));
          if (!animFrameId) updateAnimation();
        }
        drawStaticFrame();
        checkReady();
        renderTimelineTable();
      });
    } else {
      const img = new Image();
      img.onload = () => {
        targetTrack.bgType = 'image';
        targetTrack.img = img;
        targetTrack.imageName = file.name;        
        drawStaticFrame();
        checkReady();
        renderTimelineTable();
      };
      img.src = url;
    }
  }
});
bridgeAudioInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file && fileLoadTargetIndex !== null) {
    const url = URL.createObjectURL(file);
    window.tracks[fileLoadTargetIndex].audioFile = file;
    window.tracks[fileLoadTargetIndex].audioUrl = url;
    window.tracks[fileLoadTargetIndex].audioName = file.name;
    if (fileLoadTargetIndex === window.activeSlotIndex) {
      audioPlayerLocal.src = url;
    }    
    drawStaticFrame();
    checkReady();
    renderTimelineTable();
  }
});
// =====================================
// [애니메이션 프레임 제어 및 특수 글로우 이펙트]
// =====================================
/* === [drawStaticFrame] === */
function drawStaticFrame() {
  drawBackgroundAndEffects();
  const dummyData = new Uint8Array(64);
  const symmetricData = getSymmetricData(dummyData);
  const current = window.tracks[window.activeSlotIndex];  
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const scaleY = canvas.height / 720;
  const specX = current.spectrumX !== null ? current.spectrumX : centerX;
  const specY = current.spectrumY !== null ? current.spectrumY : canvas.height - 90 * scaleY;  
  SpectrumRenderers[current.style](ctx, symmetricData, specX, specY, hueOffset);  
  drawStickers();  
  drawTextOverlay();
  drawGlobalFadeOverlay();
}
function drawTextOverlay() {
  const current = window.tracks[window.activeSlotIndex];
  if (!current || !current.subtitles) return;
  const scaleY = canvas.height / 720;
  current.subtitles.forEach((sub, i) => {
    if (!sub.text) return; // 내용이 비었으면 드로잉을 생략
    ctx.save();    
    const fontSize = Math.round(26 * scaleY * sub.scale);
    ctx.font = `bold ${fontSize}px 'Malgun Gothic', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const subX = sub.x !== null ? sub.x : canvas.width / 2;
    const subY = sub.y !== null ? sub.y : canvas.height - (220 * scaleY) + (i * (fontSize + 18 * scaleY));
    const textWidth = ctx.measureText(sub.text).width;
    const textHeight = fontSize;
    ctx.translate(subX, subY);
    if (sub.rotation) {
      ctx.rotate((sub.rotation * Math.PI) / 180);
    }
    if (sub.hasBg) {
      const paddingX = 14 * scaleY;
      const paddingY = 8 * scaleY;
      const boxW = textWidth + paddingX * 2;
      const boxH = textHeight + paddingY * 2;
      ctx.save();
      ctx.globalAlpha = sub.bgAlpha !== undefined ? sub.bgAlpha : 0.7; // 불투명 수치 강제 적용
      ctx.fillStyle = sub.colorBg || "#151726";      
      drawRoundRect(ctx, -boxW / 2, -boxH / 2, boxW, boxH, 6 * scaleY);
      ctx.restore();
    }
    ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
    ctx.shadowBlur = 4 * scaleY;
    ctx.shadowOffsetX = 1 * scaleY;
    ctx.shadowOffsetY = 1 * scaleY;
    if (sub.gradient && sub.colorFill2) {
      const grad = ctx.createLinearGradient(-textWidth / 2, 0, textWidth / 2, 0);
      grad.addColorStop(0, sub.colorFill || "#ffffff");
      grad.addColorStop(1, sub.colorFill2);
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = sub.colorFill || "#ffffff";
    }
    const strokeW = sub.strokeWidth !== undefined ? sub.strokeWidth : 4;
    if (strokeW > 0) {
      ctx.strokeStyle = sub.colorStroke || "#000000";
      ctx.lineWidth = strokeW * scaleY;
      ctx.lineJoin = "round";
      ctx.strokeText(sub.text, 0, 0);
    }
    ctx.fillText(sub.text, 0, 0);
    ctx.restore();
  });
}
function drawRoundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
}
function checkReady() {
  const readySlots = window.tracks.filter(t => t.audioUrl && (t.img || t.video));
  const count = readySlots.length;
  if (count > 0) {
    btnStart.disabled = false;
    statusText.innerHTML = `총 <strong>${count}개</strong>의 가변 트랙이 준비되었습니다. 영상 제작을 시작할 수 있습니다.`;
  } else {
    btnStart.disabled = true;
    statusText.innerHTML = " : 배경 이미지/동영상과 음악 파일을 업로드하여 최소 1개 이상의 트랙을 준비해 주세요.";
  }
}
function initAudioAnalysis() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 128;     
    source = audioCtx.createMediaElementSource(audioPlayerLocal);    
    source.connect(analyser);
    analyser.connect(audioCtx.destination);    
    audioDestination = audioCtx.createMediaStreamDestination();
    source.connect(audioDestination);    
    bufferLength = analyser.frequencyBinCount;
    window.dataArray = new Uint8Array(bufferLength);
    window.analyser = analyser;
  }
}
/* === [updateAnimation] === */
function updateAnimation() {
  if (audioPlayerLocal.paused && !isRecording && !window.tracks[window.activeSlotIndex].video) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
    return;
  }  
  drawBackgroundAndEffects();
  const current = window.tracks[window.activeSlotIndex];
  if (current) {
    if (window.analyser && !audioPlayerLocal.paused) {
      window.analyser.getByteFrequencyData(window.dataArray);
    } else {
      if (window.dataArray) window.dataArray.fill(0);
    }    
    const symmetricData = getSymmetricData(window.dataArray || new Uint8Array(64));
    hueOffset = (hueOffset + 1.2) % 360;    
    const scaleY = canvas.height / 720;
    const specX = current.spectrumX !== null ? current.spectrumX : canvas.width / 2;
    const specY = current.spectrumY !== null ? current.spectrumY : canvas.height - 90 * scaleY;    
    SpectrumRenderers[current.style](ctx, symmetricData, specX, specY, hueOffset);    
    drawStickers();    
    drawTextOverlay();
    drawGlobalFadeOverlay();
// --------------------------------------------------
// 인코딩/미리보기 시 상단 상태바에 실시간 메타데이터 피드백 출력
// --------------------------------------------------
    if (isRecording || window.isPreviewPlaying) {
      const modeLabel = isRecording ? "<i class='bi bi-camera-reels-fill'></i>️ 인코딩 저장 중" : "<i class='bi bi-camera-video'></i>️ 실시간 미리보기 중";      
      const effectNames = { none: "없음", fireflies: "반딧불", fireflies_garden: "반딧불의 정원", snow: "겨울밤", snow_heavy: "함박눈", rain: "이슬비", rain_heavy: "소나기", campfire: "모닥불" };
      const styleNames = { led: "네온 LED", dot: "동글 도트", classicBar: "클래식 바", cyberWave: "네온 웨이브", seqBar: "이퀼라이저", randomEq: "랜덤 EQ" };      
      const curEffect = effectNames[current.effect] || "없음";
      const curStyle = styleNames[current.style] || "LED";
      const stickerCount = current.stickers ? current.stickers.length : 0;
      const curSec = Math.round(audioPlayerLocal.currentTime);
      const totalSec = Math.round(audioPlayerLocal.duration) || 0;
      statusText.innerHTML = `
        <span class="recording-indicator"></span>
		<font style='color:blue;'>[${modeLabel}]</font>
		<i class="bi bi-caret-right-square-fill"></i>
        | 현재 <strong style='color: #ff3300;'>트랙 ${window.activeSlotIndex + 1}</strong> 실행중 | 파티클: <em style='color:#cc33ff;'>${curEffect}</em>
        | 스펙트럼: <em style='color:#ff66ff;'>${curStyle}</em>
        | 스티커: <em style='color:blue;'>${stickerCount}개</em>
        | 플레이: <strong style='color: #ff3300;'>${curSec}초 / ${totalSec}초</strong>
      `;
    }
  }  
  animFrameId = requestAnimationFrame(updateAnimation);
}
// ==========================================
//   화면전환 스크립트(내용추가시 목록에도 등록해야 함)
// ==========================================
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
// ===================================
//       배경태마 변경(화이트 / 다크)
// ===================================
function drawGlobalFadeOverlay() {
  if (!isPlayingOrRecording()) return;
  const elapsed = (Date.now() - playbackStartTime) / 1000; 
  const fadeInSec = parseFloat(fadeInDurationInput.value);
  const fadeOutSec = parseFloat(fadeOutDurationInput.value);
  ctx.save();  
  if (enableGlobalFadeIn && elapsed < fadeInSec) {
    const alpha = 1 - (elapsed / fadeInSec);
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  if (enableGlobalFadeOut && activeRenderQueue.length === 1) {
    const remaining = audioPlayerLocal.duration - audioPlayerLocal.currentTime;
    if (!isNaN(remaining) && remaining < fadeOutSec) {
      const alpha = 1 - (remaining / fadeOutSec);
      ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }
  ctx.restore();
}
btnStart.addEventListener('click', async () => {
  activeRenderQueue = []; // 안전하게 선언된 전역 큐 사용
  window.tracks.forEach((track, idx) => {
    if (track.audioUrl && (track.img || track.video)) {
      activeRenderQueue.push(idx);
    }
  });
  if (activeRenderQueue.length === 0) return;
  initAudioAnalysis();
  if (audioCtx.state === 'suspended') {
    await audioCtx.resume();
  }
  isRecording = true;
  recordedChunks = [];  
  playbackStartTime = Date.now();
  const firstSlot = activeRenderQueue[0];
  selectActiveRow(firstSlot);
  audioPlayerLocal.play();
  updateAnimation();
  const canvasStream = canvas.captureStream(30);
  const videoTrack = canvasStream.getVideoTracks()[0];
  const tracksToCombine = [videoTrack];
  if (audioDestination && audioDestination.stream) {
    const audioTrack = audioDestination.stream.getAudioTracks()[0];
    if (audioTrack) {
      tracksToCombine.push(audioTrack);
    }
  }
  const combinedStream = new MediaStream(tracksToCombine);
  mediaRecorder = new MediaRecorder(combinedStream, {
    mimeType: 'video/webm;codecs=vp9,opus',
    videoBitsPerSecond: 8000000 
  });
  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) recordedChunks.push(e.data);
  };
  mediaRecorder.onstop = () => {
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);    
    const a = document.createElement('a');
    a.href = url;
    a.download = `ruykwoon_studio_output_${Date.now()}.webm`;
    a.click();    
    statusText.innerHTML = " : 영상 저장이 완료되었습니다.";
    btnStart.style.display = 'inline-block';
    btnStop.style.display = 'none';
  };
  mediaRecorder.start();
  btnStart.style.display = 'none';
  btnStop.style.display = 'inline-block';
  statusText.innerHTML = `<span class="recording-indicator"></span>현재 [트랙 ${firstSlot + 1}] 영상 인코딩 및 마스터 레코딩 중...`;
});
btnStop.addEventListener('click', () => {
  stopRecording();
});
/* === [오디오 종료 및 연속 트랙 인코딩 연동 시작] === */
audioPlayerLocal.addEventListener('ended', () => {
  if (isRecording) {
    // ----------------------------------------
    // [모드 1] 실시간 레코딩 중일 때의 트랙 릴레이 동작
    // ----------------------------------------
    activeRenderQueue.shift();
    if (activeRenderQueue.length > 0) {
      const nextSlot = activeRenderQueue[0];
      selectActiveRow(nextSlot);
      audioPlayerLocal.play().catch(err => console.warn("연속 트랙 오디오 시작 실패:", err));
      statusText.innerHTML = `<span class="recording-indicator"></span>현재 [트랙 ${nextSlot + 1}] 영상 인코딩 및 마스터 레코딩 중...`;
    } else {
      stopRecording();
    }
  } else if (window.isPreviewPlaying) {
    // ----------------------------------------------------
    // [모드 2] 무거운 녹화 없이 화면 미리보기 재생 중일 때의 릴레이 동작
    // ----------------------------------------------------
    window.activePreviewQueue.shift();

    if (window.activePreviewQueue.length > 0) {
      const nextSlot = window.activePreviewQueue[0];
      selectActiveRow(nextSlot);
      audioPlayerLocal.play().catch(err => console.warn("미리보기 릴레이 재생 실패:", err));
    } else {
      stopPreview(); // 대기열이 끝나면 플레이백 깔끔하게 종료
    }
  }
});
/* === [drawStickers] ==== */
function drawStickers() {
  const currentTrack = window.tracks[window.activeSlotIndex];
  if (!currentTrack || !currentTrack.stickers) return;
  currentTrack.stickers.forEach((s) => {
    ctx.save();
    ctx.globalAlpha = s.opacity;    
    let naturalW = s.img.videoWidth || s.img.width || 0;
    let naturalH = s.img.videoHeight || s.img.height || 0;
    if (naturalW === 0 || naturalH === 0) {
      naturalW = 300;
      naturalH = 168;
    }
    const sBounceFactor = s.bounce !== undefined ? s.bounce : 0.5;
    const stickerBounce = 1.0 + (window.currentBounceScale - 1.0) * sBounceFactor;
    const drawW = naturalW * s.scale * stickerBounce;
    const drawH = naturalH * s.scale * stickerBounce;    
    ctx.drawImage(s.img, s.x - drawW / 2, s.y - drawH / 2, drawW, drawH);
    ctx.restore();
  });
}
/* === [stopRecording] === */
function stopRecording() {
  isRecording = false;
  audioPlayerLocal.pause();
  const current = window.tracks[window.activeSlotIndex];
  if (current && current.video) current.video.pause();
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  checkReady(); 
}
if (btnUserGuide && guideDrawer && drawerOverlay) {
  btnUserGuide.addEventListener('click', () => {
    guideDrawer.classList.add('open');
    drawerOverlay.classList.add('open');
  });
}
if (btnDrawerClose && guideDrawer && drawerOverlay) {
  btnDrawerClose.addEventListener('click', () => {
    guideDrawer.classList.remove('open');
    drawerOverlay.classList.remove('open');
  });
}
if (drawerOverlay && guideDrawer) {
  drawerOverlay.addEventListener('click', () => {
    guideDrawer.classList.remove('open');
    drawerOverlay.classList.remove('open');
  });
}
function deleteTrack(idx) {
  if (window.tracks.length <= 1) return; // 안전장치: 트랙이 1개 이하일 때는 작동 안 함
  const targetTrack = window.tracks[idx];
  if (targetTrack && targetTrack.video) {
    targetTrack.video.pause();
  }
  window.tracks.splice(idx, 1);
  if (window.activeSlotIndex >= window.tracks.length) {
    window.activeSlotIndex = window.tracks.length - 1;
  } else if (window.activeSlotIndex === idx) {
    window.activeSlotIndex = Math.max(0, idx - 1);
  }
  const current = window.tracks[window.activeSlotIndex];
  if (current) {
    if (current.audioUrl) {
      audioPlayerLocal.src = current.audioUrl;
    } else {
      audioPlayerLocal.removeAttribute('src');
    }
    if (current.bgType === 'video' && current.video) {
      current.video.play().catch(e => console.log("Video Auto-Play Error:", e));
    }
  }
  initParticles();
  drawStaticFrame();
  renderTimelineTable();
  checkReady();
}
function initDefaultStickers() {
	let loadedCount = 0;
	defaultStickers.forEach((path) => {
		const img = new Image();
		img.onload = () => {
		// 라이브러리에 템플릿으로 보관
		window.stickerLibrary.push({
			img: img,
			name: path.split('/').pop()
		});
		loadedCount++;
		if (loadedCount === defaultStickers.length) {
			renderStickerGrid();
			drawStaticFrame();
			}
		};
	img.onerror = () => {
		console.warn(`기본 스티커를 경로에서 찾을 수 없습니다: ${path}`);
	};
	img.src = path;
	});
}
initDefaultStickers();
window.deleteTrack = deleteTrack;
window.addNewTrack = addNewTrack;
window.selectActiveRow = selectActiveRow;
window.updateTrackData = updateTrackData;
window.triggerBgUpload = triggerBgUpload;
window.triggerAudioUpload = triggerAudioUpload;
// ==============================================
// [신설] 캔버스 스티커 드래그 및 마우스 물리 반응 제어 엔진
// ==============================================
function getCanvasMousePos(canvas, evt) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (evt.clientX - rect.left) * (canvas.width / rect.width),
    y: (evt.clientY - rect.top) * (canvas.height / rect.height)
  };
}
function openSpectrumControls() {
  const currentTrack = window.tracks[window.activeSlotIndex];
  if (!currentTrack) return;  
  switchSidebarPanel('spectrum');
  const btnMenuSpectrum = document.getElementById('btnMenuSpectrum');
  if (btnMenuSpectrum) btnMenuSpectrum.classList.add('active');
  const scaleSlider = document.getElementById('spectrumScale');
  const scaleVal = document.getElementById('spectrumScaleVal');
  const colorPicker = document.getElementById('spectrumColor');
  const reflectBtn = document.getElementById('btnSpectrumReflection');
  const scale = currentTrack.spectrumScale !== undefined ? currentTrack.spectrumScale : 1.0;
  if (scaleSlider) scaleSlider.value = scale;
  if (scaleVal) scaleVal.innerText = `${Math.round(scale * 100)}%`;  
  if (colorPicker) colorPicker.value = currentTrack.spectrumColor || '#5865f2';  
  if (reflectBtn) {
    const reflect = currentTrack.spectrumReflection !== undefined ? currentTrack.spectrumReflection : true;
    if (reflect) {
      reflectBtn.classList.add('active');
      reflectBtn.innerText = '반사효과 ON';
    } else {
      reflectBtn.classList.remove('active');
      reflectBtn.innerText = '반사효과 OFF';
    }
  }
}
// ====================================
// [마우스 드래그 앤 드롭 자막 연동 엔진 시작]
// ====================================
let isDraggingSticker = false;
let isDraggingSpectrum = false;
let isDraggingSubtitle = false;// 자막 드래그 활성 플래그
let draggingSubIndex = -1;// 현재 드래그 중인 자막 슬롯 인덱스 기억소
let dragOffsetX = 0;
let dragOffsetY = 0;
function handleCanvasMouseDown(e) {
  const pos = getCanvasMousePos(canvas, e);
  const currentTrack = window.tracks[window.activeSlotIndex];
  if (!currentTrack) return;
  const scaleY = canvas.height / 720;
  // ----------------------------------------------------
  // 모드 A : 스티커 레이어 전용 드래그 엔진
  // ----------------------------------------------------
  if (window.activeEditingLayer === 'stickers' && currentTrack.stickers) {
    let clickedStickerIdx = -1;
    for (let i = currentTrack.stickers.length - 1; i >= 0; i--) {
      const s = currentTrack.stickers[i];
      let naturalW = s.img.videoWidth || s.img.width || 300;
      let naturalH = s.img.videoHeight || s.img.height || 168;
      const w = naturalW * s.scale;
      const h = naturalH * s.scale;
      if (pos.x >= s.x - w / 2 && pos.x <= s.x + w / 2 &&
          pos.y >= s.y - h / 2 && pos.y <= s.y + h / 2) {
        clickedStickerIdx = i;
        dragOffsetX = pos.x - s.x;
        dragOffsetY = pos.y - s.y;
        break;
      }
    }
    if (clickedStickerIdx > -1) {
      isDraggingSticker = true;
      selectSticker(clickedStickerIdx); 
    }
  }
  // ----------------------------------------------------
  // 모드 B : 스펙트럼 레이어 전용 드래그 엔진
  // ----------------------------------------------------
  else if (window.activeEditingLayer === 'spectrum') {
    const specX = currentTrack.spectrumX !== null ? currentTrack.spectrumX : canvas.width / 2;
    const specY = currentTrack.spectrumY !== null ? currentTrack.spectrumY : canvas.height - 90 * scaleY;    
    if (Math.abs(pos.y - specY) < 30 * scaleY) {
      isDraggingSpectrum = true;
      dragOffsetX = pos.x - specX;
      dragOffsetY = pos.y - specY;
      openSpectrumControls(); 
    }
  }
  // ----------------------------------------------------
  // 모드 C : 자막 레이어 전용 드래그 엔진 (스티커 레이어가 막고 있더라도 드래그 감지 성공)
  // ----------------------------------------------------
  else if (window.activeEditingLayer === 'subtitles' && currentTrack.subtitles) {
    let clickedSubIdx = -1;
    ctx.save();
    for (let i = currentTrack.subtitles.length - 1; i >= 0; i--) {
      const sub = currentTrack.subtitles[i];
      if (!sub.text) continue; // 내용물이 완전히 비었을 땐 논클릭 패스
      const fontSize = Math.round(26 * scaleY * sub.scale);
      ctx.font = `bold ${fontSize}px 'Malgun Gothic', sans-serif`;      
      const textWidth = ctx.measureText(sub.text).width;
      const textHeight = fontSize;
      const subX = sub.x !== null ? sub.x : canvas.width / 2;
      const subY = sub.y !== null ? sub.y : canvas.height - (220 * scaleY) + (i * (fontSize + 18 * scaleY));
      if (pos.x >= subX - textWidth / 2 - 15 && pos.x <= subX + textWidth / 2 + 15 &&
          pos.y >= subY - textHeight / 2 - 15 && pos.y <= subY + textHeight / 2 + 15) {
        clickedSubIdx = i;
        dragOffsetX = pos.x - subX;
        dragOffsetY = pos.y - subY;
        break;
      }
    }
    ctx.restore();
    if (clickedSubIdx > -1) {
      isDraggingSubtitle = true;
      draggingSubIndex = clickedSubIdx;      
      currentTrack.selectedSubIndex = clickedSubIdx;
      syncSubtitleControls();
      renderTimelineTable();
    }
  }
}
function handleCanvasMouseMove(e) {
  const pos = getCanvasMousePos(canvas, e);
  const currentTrack = window.tracks[window.activeSlotIndex];
  if (!currentTrack) return;
  if (isDraggingSticker && currentTrack.selectedStickerIndex > -1) {
    const sticker = currentTrack.stickers[currentTrack.selectedStickerIndex];
    sticker.x = pos.x - dragOffsetX;
    sticker.y = pos.y - dragOffsetY;
    drawStaticFrame(); 
  } else if (isDraggingSpectrum) {
    currentTrack.spectrumX = pos.x - dragOffsetX;
    currentTrack.spectrumY = pos.y - dragOffsetY;
    drawStaticFrame();
  } else if (isDraggingSubtitle && draggingSubIndex > -1) {
    const sub = currentTrack.subtitles[draggingSubIndex];
    sub.x = pos.x - dragOffsetX;
    sub.y = pos.y - dragOffsetY;
    drawStaticFrame();
  }
}
function handleCanvasMouseUp() {
  isDraggingSticker = false;
  isDraggingSpectrum = false;
  isDraggingSubtitle = false; // 플래그 오프
  draggingSubIndex = -1;
}
function handleCanvasMouseLeave() {
  isDraggingSticker = false;
  isDraggingSpectrum = false;
  isDraggingSubtitle = false; // 플래그 오프
  draggingSubIndex = -1;
}
canvas.addEventListener('mousedown', handleCanvasMouseDown);
canvas.addEventListener('mousemove', handleCanvasMouseMove);
canvas.addEventListener('mouseup', handleCanvasMouseUp);
canvas.addEventListener('mouseleave', handleCanvasMouseLeave);
// ===================================================
// 다크/라이트 실시간 테마 제어 및 쿠키(LocalStorage) 연동 엔진
// ===================================================
const btnThemeToggle = document.getElementById('btnThemeToggle');
function initTheme() {
  if (!btnThemeToggle) return;  
  const savedTheme = localStorage.getItem('studio-theme') || 'dark';
  const icon = btnThemeToggle.querySelector('i');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
    if (icon) {
      icon.className = 'bi bi-moon-stars-fill'; // 다크 테마일 땐 달 아이콘icon.style.color = '#ffeb3b';      
    }
  } else {
    document.body.classList.remove('dark-theme');
    if (icon) {
      icon.className = 'bi bi-sun-fill'; // 라이트 테마일 땐 해 아이콘icon.style.color = '#ff9800';      
    }
  }
  drawStaticFrame();
}
if (btnThemeToggle) {
  btnThemeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark-theme');
    const icon = btnThemeToggle.querySelector('i');
    localStorage.setItem('studio-theme', isDark ? 'dark' : 'light');
    if (isDark) {
      if (icon) {
        icon.className = 'bi bi-moon-stars-fill';        
      }
    } else {
      if (icon) {
        icon.className = 'bi bi-sun-fill';        
      }
    }
    drawStaticFrame();
  });
}
// ====================================
//     [실시간 전체 미리보기 함수 시작]
// ====================================
window.isPreviewPlaying = false; // 실시간 미리보기 가동 플래그
window.activePreviewQueue = [];   // 미리보기용 독립 대기열 배열
function startPreview() {
  window.activePreviewQueue = [];
  window.tracks.forEach((track, idx) => {
    if (track.audioUrl && (track.img || track.video)) {
      window.activePreviewQueue.push(idx);
    }
  });
  if (window.activePreviewQueue.length === 0) {
    alert(" : 미리보기 재생할 수 있는 트랙이 없습니다. 배경과 오디오를 먼저 등록해 주세요.");
    return;
  }
  window.isPreviewPlaying = true;
  initAudioAnalysis();
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  const firstSlot = window.activePreviewQueue[0];
  selectActiveRow(firstSlot);
  audioPlayerLocal.play().catch(e => console.warn("오디오 미리보기 시작 실패:", e));
  updateAnimation();
  document.getElementById('btnPreviewPlay').style.display = 'none';
  document.getElementById('btnPreviewStop').style.display = 'inline-block';
}
function stopPreview() {
  window.isPreviewPlaying = false;
  window.activePreviewQueue = [];
  audioPlayerLocal.pause();
  const current = window.tracks[window.activeSlotIndex];
  if (current && current.video) current.video.pause();
  document.getElementById('btnPreviewPlay').style.display = 'inline-block';
  document.getElementById('btnPreviewStop').style.display = 'none';
  checkReady();
}

initTheme();

// ----------------------------------------------------
//        [트랙별 슬롯 클릭 시 작동될 연동 브릿지 함수]
// ----------------------------------------------------
function selectTrackSubtitleSlot(trackIdx, subIdx) {
  window.tracks[trackIdx].selectedSubIndex = subIdx;
  selectActiveRow(trackIdx); // 해당 행 활성화
  setEditingLayer('subtitles'); // 작업 타겟을 '자막' 레이어로 전환
}
window.selectTrackSubtitleSlot = selectTrackSubtitleSlot;
const btnDeleteActiveSticker = document.getElementById('btnDeleteActiveSticker');
if (btnDeleteActiveSticker) {
  btnDeleteActiveSticker.addEventListener('click', removeActiveSticker);
}
const btnPreviewPlay = document.getElementById('btnPreviewPlay');
if (btnPreviewPlay) {
  btnPreviewPlay.addEventListener('click', startPreview);
}
const btnPreviewStop = document.getElementById('btnPreviewStop');
if (btnPreviewStop) {
  btnPreviewStop.addEventListener('click', stopPreview);
}
// ----------------------------------------------------
//        [스펙트럼 옵션 바인딩 - 안전 가이드 적용]
// ----------------------------------------------------
const spectrumScale = document.getElementById('spectrumScale');
if (spectrumScale) {
  spectrumScale.addEventListener('input', (e) => {
    const currentTrack = window.tracks[window.activeSlotIndex];
    if (currentTrack) {
      const val = parseFloat(e.target.value);
      currentTrack.spectrumScale = val;
      document.getElementById('spectrumScaleVal').innerText = `${Math.round(val * 100)}%`;
      drawStaticFrame();
    }
  });
}
const btnSpectrumReflection = document.getElementById('btnSpectrumReflection');
if (btnSpectrumReflection) {
  btnSpectrumReflection.addEventListener('click', (e) => {
    const currentTrack = window.tracks[window.activeSlotIndex];
    if (currentTrack) {
      const reflect = currentTrack.spectrumReflection !== undefined ? currentTrack.spectrumReflection : true;
      currentTrack.spectrumReflection = !reflect;
      
      const btn = e.currentTarget;
      if (currentTrack.spectrumReflection) {
        btn.classList.add('active');
        btn.innerText = '반사효과 ON';
      } else {
        btn.classList.remove('active');
        btn.innerText = '반사효과 OFF';
      }
      drawStaticFrame();
    }
  });
}
const spectrumColor = document.getElementById('spectrumColor');
if (spectrumColor) {
  spectrumColor.addEventListener('input', (e) => {
    const currentTrack = window.tracks[window.activeSlotIndex];
    if (currentTrack) {
      currentTrack.spectrumColor = e.target.value;
      drawStaticFrame();
    }
  });
}
// ====================================
//      [화면 바운스 UI 스크립트 시작]
// ====================================
window.bounceLevel = 0; 
const btnBounceOff = document.getElementById('btnBounceOff');
const btnBounce1 = document.getElementById('btnBounce1');
const btnBounce2 = document.getElementById('btnBounce2');
const btnBounce3 = document.getElementById('btnBounce3');
function changeBounceLevel(level, activeBtn) {
  window.bounceLevel = level;  
  [btnBounceOff, btnBounce1, btnBounce2, btnBounce3].forEach(btn => {
    if (btn) btn.classList.remove('active');
  });
  if (activeBtn) activeBtn.classList.add('active');  
  drawStaticFrame();
}
if (btnBounceOff) btnBounceOff.addEventListener('click', () => changeBounceLevel(0, btnBounceOff));
if (btnBounce1) btnBounce1.addEventListener('click', () => changeBounceLevel(1, btnBounce1));
if (btnBounce2) btnBounce2.addEventListener('click', () => changeBounceLevel(2, btnBounce2));
if (btnBounce3) btnBounce3.addEventListener('click', () => changeBounceLevel(3, btnBounce3));
// ====================================
//      [사이드바 메뉴 패널 스위칭 시작]
// ====================================
function switchSidebarPanel(panelId) {
  const panelStickers = document.getElementById('panelStickers');
  const panelSpectrum = document.getElementById('panelSpectrum');
  const panelSubtitles = document.getElementById('panelSubtitles');  
  if (panelStickers) {
    panelStickers.style.display = 'block';
  }
  if (panelId === 'spectrum') {
    if (panelSpectrum) panelSpectrum.style.display = 'block';
    if (panelSubtitles) panelSubtitles.style.display = 'none';
  } else if (panelId === 'subtitles') {
    if (panelSpectrum) panelSpectrum.style.display = 'none';
    if (panelSubtitles) panelSubtitles.style.display = 'block';
  }
}
const btnMenuSpectrum = document.getElementById('btnMenuSpectrum');
if (btnMenuSpectrum) {
  btnMenuSpectrum.addEventListener('click', () => {
    const panelSpectrum = document.getElementById('panelSpectrum');
    const isAlreadyOpen = panelSpectrum && panelSpectrum.style.display === 'block';
    if (isAlreadyOpen) {
      switchSidebarPanel('stickers');
      btnMenuSpectrum.classList.remove('active');
    } else {
      switchSidebarPanel('spectrum');
      btnMenuSpectrum.classList.add('active');
    }
  });
}
// ====================================
//     [스티커 개별 바운스 리스너 시작]
// ====================================
const logoBounceSlider = document.getElementById('logoBounce');
if (logoBounceSlider) {
  logoBounceSlider.addEventListener('input', (e) => {
    const currentTrack = window.tracks[window.activeSlotIndex];
    if (currentTrack && currentTrack.selectedStickerIndex > -1) {
      const val = parseInt(e.target.value);
      // 0 ~ 10 수치를 0.0 ~ 1.0 배율로 보간해 줍니다 (10단일 때 오버 바운딩 100% 적용)
      currentTrack.stickers[currentTrack.selectedStickerIndex].bounce = val / 10;
      document.getElementById('logoBounceVal').innerText = `${val}단`;
      drawStaticFrame();
    }
  });
}
function updateTrackSubtitleText(idx, val) {
  const track = window.tracks[idx];
  if (!track || !track.subtitles) return; // 트랙이나 자막 배열이 없으면 즉시 스킵해 다운을 막습니다.
  const subIdx = track.selectedSubIndex !== undefined ? track.selectedSubIndex : 0;
  if (!track.subtitles[subIdx]) return; // 해당 인덱스 슬롯이 없으면 스킵
  track.subtitles[subIdx].text = val;
  if (idx === window.activeSlotIndex) {
    const leftInput = document.getElementById('subTextInput');
    if (leftInput) leftInput.value = val;
  }
  drawStaticFrame();
}
function syncSubtitleControls() {
  const currentTrack = window.tracks[window.activeSlotIndex];
  if (!currentTrack || !currentTrack.subtitles) return;
  const subIdx = currentTrack.selectedSubIndex !== undefined ? currentTrack.selectedSubIndex : 0;
  const sub = currentTrack.subtitles[subIdx];
  if (!sub) return;
  const textInput = document.getElementById('subTextInput');
  if (textInput) textInput.value = sub.text || "";
  const scaleSlider = document.getElementById('subScale');
  const scaleVal = document.getElementById('subScaleVal');
  if (scaleSlider) scaleSlider.value = sub.scale;
  if (scaleVal) scaleVal.innerText = `${Math.round(sub.scale * 100)}%`;
  const rotSlider = document.getElementById('subRotation');
  const rotVal = document.getElementById('subRotationVal');
  if (rotSlider) rotSlider.value = sub.rotation !== undefined ? sub.rotation : 0;
  if (rotVal) rotVal.innerText = `${sub.rotation !== undefined ? sub.rotation : 0}°`;
  const colorFill = document.getElementById('subColorFill');
  const colorFill2 = document.getElementById('subColorFill2');
  const colorStroke = document.getElementById('subColorStroke');
  if (colorFill) colorFill.value = sub.colorFill || '#ffffff';
  if (colorFill2) colorFill2.value = sub.colorFill2 || '#ffffff';
  if (colorStroke) colorStroke.value = sub.colorStroke || '#000000';
  const gradToggle = document.getElementById('btnSubGradientToggle');
  if (gradToggle) {
    if (sub.gradient) gradToggle.classList.add('active');
    else gradToggle.classList.remove('active');
  }
  const bgToggle = document.getElementById('btnSubBgToggle');
  if (bgToggle) {
    if (sub.hasBg) {
      bgToggle.classList.add('active');
      bgToggle.innerText = 'ON';
    } else {
      bgToggle.classList.remove('active');
      bgToggle.innerText = 'OFF';
    }
  }
  const colorBg = document.getElementById('subColorBg');
  if (colorBg) colorBg.value = sub.colorBg || '#151726';
  const strokeSlider = document.getElementById('subStrokeWidth');
  const strokeVal = document.getElementById('subStrokeVal');
  if (strokeSlider) strokeSlider.value = sub.strokeWidth !== undefined ? sub.strokeWidth : 4;
  if (strokeVal) strokeVal.innerText = `${sub.strokeWidth !== undefined ? sub.strokeWidth : 4}px`;
  const alphaSlider = document.getElementById('subBgAlpha');
  const alphaVal = document.getElementById('subBgAlphaVal');
  if (alphaSlider) alphaSlider.value = sub.bgAlpha !== undefined ? sub.bgAlpha : 0.7;
  if (alphaVal) alphaVal.innerText = `${Math.round((sub.bgAlpha !== undefined ? sub.bgAlpha : 0.7) * 100)}%`;
}
// ----------------------------------------------------
//     [신설] 활성 작업 레이어 토글 및 사이드바 동시 연동 리스너
// ----------------------------------------------------
function setEditingLayer(layer) {
  window.activeEditingLayer = layer;
  ['btnLayerStickers', 'btnLayerSubtitles', 'btnLayerSpectrum'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.classList.remove('active');
  });  
  const targetId = `btnLayer${layer.charAt(0).toUpperCase() + layer.slice(1)}`;
  const activeBtn = document.getElementById(targetId);
  if (activeBtn) activeBtn.classList.add('active');
  if (layer === 'stickers') {
    switchSidebarPanel('stickers');
  } else if (layer === 'subtitles') {
    switchSidebarPanel('subtitles');
    syncSubtitleControls();
  } else if (layer === 'spectrum') {
    switchSidebarPanel('spectrum');
    openSpectrumControls();
  }
  drawStaticFrame();
}
window.setEditingLayer = setEditingLayer;
const btnLayerStickers = document.getElementById('btnLayerStickers');
if (btnLayerStickers) btnLayerStickers.addEventListener('click', () => setEditingLayer('stickers'));
const btnLayerSubtitles = document.getElementById('btnLayerSubtitles');
if (btnLayerSubtitles) btnLayerSubtitles.addEventListener('click', () => setEditingLayer('subtitles'));
const btnLayerSpectrum = document.getElementById('btnLayerSpectrum');
if (btnLayerSpectrum) btnLayerSpectrum.addEventListener('click', () => setEditingLayer('spectrum'));
// ----------------------------------------------------
//     [신설] 자막 튜닝용 고급 설정 연동 리스너 군
// ----------------------------------------------------
const subTextInputField = document.getElementById('subTextInput');
if (subTextInputField) {
  subTextInputField.addEventListener('input', (e) => {
    const currentTrack = window.tracks[window.activeSlotIndex];
    if (currentTrack) {
      const subIdx = currentTrack.selectedSubIndex;
      currentTrack.subtitles[subIdx].text = e.target.value;
      renderTimelineTable();
      drawStaticFrame();
    }
  });
  subTextInputField.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      drawStaticFrame();
    }
  });
}
const subScaleSlider = document.getElementById('subScale');
if (subScaleSlider) {
  subScaleSlider.addEventListener('input', (e) => {
    const currentTrack = window.tracks[window.activeSlotIndex];
    if (currentTrack) {
      const subIdx = currentTrack.selectedSubIndex;
      const val = parseFloat(e.target.value);
      currentTrack.subtitles[subIdx].scale = val;
      document.getElementById('subScaleVal').innerText = `${Math.round(val * 100)}%`;
      drawStaticFrame();
    }
  });
}
const subRotationSlider = document.getElementById('subRotation');
if (subRotationSlider) {
  subRotationSlider.addEventListener('input', (e) => {
    const currentTrack = window.tracks[window.activeSlotIndex];
    if (currentTrack) {
      const subIdx = currentTrack.selectedSubIndex;
      const val = parseInt(e.target.value);
      currentTrack.subtitles[subIdx].rotation = val;
      document.getElementById('subRotationVal').innerText = `${val}°`;
      drawStaticFrame();
    }
  });
}
const subColorFillPicker = document.getElementById('subColorFill');
if (subColorFillPicker) {
  subColorFillPicker.addEventListener('input', (e) => {
    const currentTrack = window.tracks[window.activeSlotIndex];
    if (currentTrack) {
      const subIdx = currentTrack.selectedSubIndex;
      currentTrack.subtitles[subIdx].colorFill = e.target.value;
      drawStaticFrame();
    }
  });
}
const subColorFillPicker2 = document.getElementById('subColorFill2');
if (subColorFillPicker2) {
  subColorFillPicker2.addEventListener('input', (e) => {
    const currentTrack = window.tracks[window.activeSlotIndex];
    if (currentTrack) {
      const subIdx = currentTrack.selectedSubIndex;
      currentTrack.subtitles[subIdx].colorFill2 = e.target.value;
      drawStaticFrame();
    }
  });
}
const subColorStrokePicker = document.getElementById('subColorStroke');
if (subColorStrokePicker) {
  subColorStrokePicker.addEventListener('input', (e) => {
    const currentTrack = window.tracks[window.activeSlotIndex];
    if (currentTrack) {
      const subIdx = currentTrack.selectedSubIndex;
      currentTrack.subtitles[subIdx].colorStroke = e.target.value;
      drawStaticFrame();
    }
  });
}
const btnSubGradientToggle = document.getElementById('btnSubGradientToggle');
if (btnSubGradientToggle) {
  btnSubGradientToggle.addEventListener('click', (e) => {
    const currentTrack = window.tracks[window.activeSlotIndex];
    if (currentTrack) {
      const subIdx = currentTrack.selectedSubIndex;
      const sub = currentTrack.subtitles[subIdx];
      sub.gradient = !sub.gradient;
      
      if (sub.gradient) {
        e.currentTarget.classList.add('active');
      } else {
        e.currentTarget.classList.remove('active');
      }
      drawStaticFrame();
    }
  });
}
const btnSubBgToggle = document.getElementById('btnSubBgToggle');
if (btnSubBgToggle) {
  btnSubBgToggle.addEventListener('click', (e) => {
    const currentTrack = window.tracks[window.activeSlotIndex];
    if (currentTrack) {
      const subIdx = currentTrack.selectedSubIndex;
      const sub = currentTrack.subtitles[subIdx];
      sub.hasBg = !sub.hasBg;
      
      if (sub.hasBg) {
        e.currentTarget.classList.add('active');
        e.currentTarget.innerText = 'ON';
      } else {
        e.currentTarget.classList.remove('active');
        e.currentTarget.innerText = 'OFF';
      }
      drawStaticFrame();
    }
  });
}
const subColorBgPicker = document.getElementById('subColorBg');
if (subColorBgPicker) {
  subColorBgPicker.addEventListener('input', (e) => {
    const currentTrack = window.tracks[window.activeSlotIndex];
    if (currentTrack) {
      const subIdx = currentTrack.selectedSubIndex;
      currentTrack.subtitles[subIdx].colorBg = e.target.value;
      drawStaticFrame();
    }
  });
}
const subStrokeWidthSlider = document.getElementById('subStrokeWidth');
if (subStrokeWidthSlider) {
  subStrokeWidthSlider.addEventListener('input', (e) => {
    const currentTrack = window.tracks[window.activeSlotIndex];
    if (currentTrack) {
      const subIdx = currentTrack.selectedSubIndex;
      const val = parseInt(e.target.value);
      currentTrack.subtitles[subIdx].strokeWidth = val;
      document.getElementById('subStrokeVal').innerText = `${val}px`;
      drawStaticFrame();
    }
  });
}
const subBgAlphaSlider = document.getElementById('subBgAlpha');
if (subBgAlphaSlider) {
  subBgAlphaSlider.addEventListener('input', (e) => {
    const currentTrack = window.tracks[window.activeSlotIndex];
    if (currentTrack) {
      const subIdx = currentTrack.selectedSubIndex;
      const val = parseFloat(e.target.value);
      currentTrack.subtitles[subIdx].bgAlpha = val;
      document.getElementById('subBgAlphaVal').innerText = `${Math.round(val * 100)}%`;
      drawStaticFrame();
    }
  });
}
window.updateTrackSubtitleText = updateTrackSubtitleText;
window.syncSubtitleControls = syncSubtitleControls;

// 뼈대 데이터 최초 갱신
initParticles();
renderTimelineTable();
drawStaticFrame();