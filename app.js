const homePage = document.getElementById("home");
const stagePage = document.getElementById("stage");
const stageContent = document.getElementById("stage-content");

// 모드 설정: "normal" 또는 "auto"
let mode = "auto"; // 필요시 "auto"로 바꿔서 자동 모드 실행
let words = [];
let currentIndex = 0;

document.addEventListener("DOMContentLoaded", async () => {
  warmUpSpeechEngine();

  const params = new URLSearchParams(window.location.search);
  const weekFile = params.get("week") || "Week01";

  try {
    const response = await fetch(`${weekFile}.txt`);
    const text = await response.text();
    words = text.split(/\r?\n/).filter(line => line.trim() !== "");
  } catch (err) {
    console.error("단어 파일을 불러오지 못했습니다:", err);
    words = [];
  }

  shuffleWords();
});

// F5 키 이벤트 → auto Mode일 때만 자동 진행
document.addEventListener("keydown", (e) => {
  if (mode === "auto" && (e.key === "F5" || e.code === "F5")) {
    e.preventDefault(); // 기본 새로고침 방지
    console.log("auto Mode 시작!");
    startAutoMode();
  }
});

// 홈 → 단계 시작
function startStage(stageNumber) {
  homePage.classList.add("hidden");
  stagePage.classList.remove("hidden");
  currentStage = stageNumber;

  if (stageNumber === 1) {
    document.getElementById("stage-main-title").textContent = "1단계: 단어 카드";
    document.getElementById("stage-subtitle").textContent = "단어와 그림을 함께 보고 익혀요";
    showStage1();
  }

  if (stageNumber === 2) {
    document.getElementById("stage-main-title").textContent = "2단계: 그림 찾기";
    document.getElementById("stage-subtitle").textContent = "단어와 맞는 그림을 골라보세요";
    showStage2();
  }
  
  if (stageNumber === 3) {
    document.getElementById("stage-main-title").textContent = "3단계: 단어 읽기";
    document.getElementById("stage-subtitle").textContent = "단어를 직접 읽어보고 따라해요";
    showStage3();
  }
  
  if (stageNumber === 4) {
    document.getElementById("stage-main-title").textContent = "4단계: 한 글자씩 듣기";
    document.getElementById("stage-subtitle").textContent = "글자를 하나씩 소리로 들어보세요";
    showStage4();
  }

  if (stageNumber === 5) {
    document.getElementById("stage-main-title").textContent = "5단계: 글자 찾기";
    document.getElementById("stage-subtitle").textContent = "단어를 구성하는 글자를 찾아 맞춰보세요";
    showStage5();
  }
}

// 홈으로 돌아가기
function goHome() {
  stagePage.classList.add("hidden");
  homePage.classList.remove("hidden");

  // progress 초기화
  const progress = document.getElementById("progress");
  if (progress) {
    progress.remove(); // DOM에서 완전히 제거
  }

  // 필요하다면 currentIndex도 초기화
  currentIndex = 0;
}

function shuffleWords() {
  for (let i = words.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [words[i], words[j]] = [words[j], words[i]];
  }
  currentIndex = 0;
}

document.addEventListener("DOMContentLoaded", () => {
  const shuffleIcon = document.getElementById("shuffle-icon");
  if (shuffleIcon) {
    shuffleIcon.onclick = () => {
      shuffleWords();

      // 흔들림 애니메이션 적용
      shuffleIcon.classList.add("shake");

      // 애니메이션 끝나면 클래스 제거 (원래 상태로 복귀)
      setTimeout(() => shuffleIcon.classList.remove("shake"), 500);
    };
  }
});


// 괄호 안 설명 제거 → 화면 표시/소리 출력용
function getDisplayWord(word) {
  return word.replace(/\(.*?\)/g, "");
}

// 그림 파일명 찾기 → 괄호 포함 그대로 사용
function getImageFile(word) {
  return `img/${word}.png`;
}

function updateProgress() {
  let progressDiv = document.getElementById("progress");
  if (!progressDiv) {
    progressDiv = document.createElement("div");
    progressDiv.id = "progress";
    progressDiv.className = "progress-indicator";
    document.body.appendChild(progressDiv);
  }
  progressDiv.textContent = `${currentIndex + 1} / ${words.length}`;
}

function createSpeakerIcon(word, delay = 2000) {
  const speakerIcon = document.createElement("div");
  speakerIcon.id = "speaker-icon";
  speakerIcon.textContent = "🔊";
  speakerIcon.className = "speaker-icon";
  speakerIcon.style.visibility = "hidden";

  speakerIcon.onclick = () => {
    // 스피커 숨김 + 화살표 숨김
    speakerIcon.style.visibility = "hidden";
    hideArrows();

    // 발음 출력
    speakWord(getDisplayWord(word));

    // 일정 시간 후 다시 표시
    setTimeout(() => {
      speakerIcon.style.visibility = "visible";
      showArrows(); // 스피커가 다시 나타날 때 화살표도 표시
    }, delay);
  };

  return speakerIcon;
}

// 단어 카드 표시
function showStage1() {
  stageContent.innerHTML = "";

  const word = words[currentIndex];
  if (!word) return;

  // 진행 상황 표시
  updateProgress();

  // 시작 시 화살표 숨김
  hideArrows();

  const container = document.createElement("div");
  container.className = "word-container";

  const img = document.createElement("img");
  img.src = getImageFile(word);                // 괄호 포함된 파일명
  img.alt = getDisplayWord(word);              // 괄호 제거된 표시
  img.style.visibility = "hidden";
  container.appendChild(img);

  const wordDiv = document.createElement("div");
  wordDiv.className = "word-card";
  wordDiv.textContent = getDisplayWord(word);  // 괄호 제거된 표시
  wordDiv.style.visibility = "hidden";
  container.appendChild(wordDiv);

  stageContent.appendChild(container);

  // 공용 스피커 아이콘 활용
  const speakerIcon = createSpeakerIcon(word);
  stageContent.appendChild(speakerIcon);

  // 순차적으로 표시
  setTimeout(() => {
    img.style.visibility = "visible"; // 그림 표시

    // 그림이 나타날 때 엔진 준비시키기
    warmUpSpeechEngine();
  }, 500);

  setTimeout(() => {
    wordDiv.style.visibility = "visible"; // 단어 표시
  }, 1000);

  setTimeout(() => {
    speakWord(getDisplayWord(word)); // 단어 발음 출력
  }, 1500);

  setTimeout(() => {
    speakerIcon.style.visibility = "visible"; // 스피커 표시

    // 모든 표시가 끝난 뒤 화살표 다시 보여주기
    showArrows();
  }, 2000);
}

function showStage2() {
  stageContent.innerHTML = "";

  const word = words[currentIndex];
  if (!word) return;

  updateProgress();

  // 시작 시 화살표 숨김
  hideArrows();

  const container = document.createElement("div");
  container.className = "stage2-container";

  const wordDiv = document.createElement("div");
  wordDiv.className = "stage2-word";
  wordDiv.textContent = getDisplayWord(word);
  container.appendChild(wordDiv);

  const imagesContainer = document.createElement("div");
  imagesContainer.className = "stage2-images";

  // 정답 그림
  const correctImg = document.createElement("img");
  correctImg.src = getImageFile(word);
  correctImg.alt = getDisplayWord(word);
  correctImg.className = "stage2-image";

  correctImg.onclick = () => {
    correctImg.classList.add("correct-circle");
    speakWord(getDisplayWord(word));

    setTimeout(() => {
      if (currentIndex < words.length - 1) {
        currentIndex++;
        showStage2();
      }
    }, 2500);
  };

  // 정답과 같은 표시 단어를 가진 모든 원본 제거
  const correctDisplay = getDisplayWord(word);
  let dummyWords = words.filter(w => getDisplayWord(w) !== correctDisplay);

  // 랜덤으로 2개 선택
  dummyWords = dummyWords.sort(() => 0.5 - Math.random()).slice(0, 2);

  const options = [correctImg];

  dummyWords.forEach(dw => {
    const img = document.createElement("img");
    img.src = getImageFile(dw);
    img.alt = getDisplayWord(dw);
    img.className = "stage2-image";

    img.onclick = () => {
      img.classList.add("wrong-square");
      speakWord(getDisplayWord(dw));
    };

    options.push(img);
  });

  options.sort(() => 0.5 - Math.random());
  options.forEach(img => imagesContainer.appendChild(img));

  container.appendChild(imagesContainer);
  stageContent.appendChild(container);

  warmUpSpeechEngine();

  setTimeout(() => {
    const speakerIcon = createSpeakerIcon(getDisplayWord(word));
    speakerIcon.style.visibility = "visible";
    stageContent.appendChild(speakerIcon);
    
    // 스피커 아이콘이 나타날 때 화살표도 다시 표시
    showArrows();
  }, 500);
}

function showStage3() {
  stageContent.innerHTML = "";

  const word = words[currentIndex];
  if (!word) return;

  // 진행 상황 표시
  updateProgress();

  // 시작 시 화살표 숨김
  hideArrows();

  // 가운데 단어 크게 표시 (1단계와 동일한 스타일 사용)
  const container = document.createElement("div");
  container.className = "word-container"; // 수직·수평 가운데 정렬
  const wordDiv = document.createElement("div");
  wordDiv.className = "word-card";        // 1단계와 동일한 글씨 크기
  wordDiv.textContent = getDisplayWord(word);
  container.appendChild(wordDiv);

  stageContent.appendChild(container);

  // 단어가 표시된 직후 엔진 준비
  warmUpSpeechEngine();

  // 공용 스피커 아이콘 활용
  setTimeout(() => {
    const speakerIcon = createSpeakerIcon(word);
    speakerIcon.style.visibility = "visible";
    stageContent.appendChild(speakerIcon);
    
    // 스피커 아이콘이 나타날 때 화살표도 다시 표시
    showArrows();
  }, 500);
}

function showStage4() {
  stageContent.innerHTML = "";

  const word = words[currentIndex];
  if (!word) return;

  // 진행 상황 표시
  updateProgress();

  // 시작 시 화살표 숨김
  hideArrows();

  const container = document.createElement("div");
  container.className = "word-container";

  const wordDiv = document.createElement("div");
  wordDiv.className = "word-card";
  container.appendChild(wordDiv);
  stageContent.appendChild(container);

  const letters = getDisplayWord(word).split("");
  const spans = [];

  letters.forEach(letter => {
    const span = document.createElement("span");
    span.textContent = letter;
    span.className = "letter";
    spans.push(span);
    wordDiv.appendChild(span);
  });

  // 엔진 준비 (전체 단어 표시 시점)
  warmUpSpeechEngine();

  // 전체 단어를 먼저 검정색으로 보여줌
  spans.forEach(span => {
    span.classList.remove("active");
  });

  if (letters.length > 1) {
    // 글자가 2개 이상일 때만 글자 단위 발음
    spans.forEach((span, i) => {
      setTimeout(() => {
        spans.forEach(s => s.classList.remove("active"));
        span.classList.add("active");
        speakWord(getDisplayWord(span.textContent));
      }, 2000 + i * 2000);
    });
  }

  // 전체 단어 발음 타이밍 계산
  // 글자가 여러 개면 마지막 글자 발음 끝난 뒤 2초 후
  // 글자가 1개면 그냥 2초 후
  const totalDelay = letters.length > 1
    ? 2000 + (letters.length * 2000)
    : 2000;

  // 전체 단어 발음 + 전체 강조
  setTimeout(() => {
    spans.forEach(span => span.classList.add("active"));
    speakWord(getDisplayWord(word));

    // 전체 발음 후 스피커 아이콘 표시
    setTimeout(() => {
      showSpeakerIconStage4(word, spans);

      // 스피커 아이콘이 나타날 때 화살표도 다시 표시
      showArrows();
    }, 1000);
  }, totalDelay);
}

function showSpeakerIconStage4(word, spans) {
  const speakerIcon = document.createElement("div");
  speakerIcon.id = "speaker-icon";
  speakerIcon.textContent = "🔊";
  speakerIcon.className = "speaker-icon";

  speakerIcon.onclick = () => {
    // 스피커 아이콘 제거 + 화살표 숨김
    speakerIcon.remove();
    hideArrows();

    // 전체 단어를 먼저 검정색으로 보여줌
    spans.forEach(span => {
      span.classList.remove("active");
    });

    const letters = getDisplayWord(word).split("");

    if (letters.length > 1) {
      // 글자가 2개 이상일 때만 글자 단위 발음
      spans.forEach((span, i) => {
        setTimeout(() => {
          spans.forEach(s => s.classList.remove("active"));
          span.classList.add("active");
          speakWord(getDisplayWord(span.textContent));
        }, 2000 + i * 2000);
      });
    }

    // 전체 단어 발음 타이밍 계산
    // 글자가 여러 개면 마지막 글자 발음 끝난 뒤 2초 후
    // 글자가 1개면 그냥 2초 후
    const totalDelay = letters.length > 1
      ? 2000 + (letters.length * 2000)
      : 2000;

    // 전체 단어 발음 + 전체 강조
    setTimeout(() => {
      spans.forEach(span => span.classList.add("active"));
      speakWord(getDisplayWord(word));

      setTimeout(() => {
        // 새 스피커 아이콘 표시
        showSpeakerIconStage4(word, spans);

        // 새 스피커 아이콘이 나타날 때 화살표도 다시 표시
        showArrows();
      }, 1000);
    }, totalDelay);
  };

  stageContent.appendChild(speakerIcon);
}

function showStage5() {
  stageContent.innerHTML = "";

  const word = words[currentIndex];
  if (!word) return;

  // 진행 상황 표시
  updateProgress();

  // 시작 시 화살표 숨김
  hideArrows();

  // 위쪽 컨테이너
  const topContainer = document.createElement("div");
  topContainer.className = "stage5-top";

  // 그림
  const img = document.createElement("img");
  img.src = getImageFile(word);
  img.alt = getDisplayWord(word);
  img.className = "word-image";
  topContainer.appendChild(img);

  // 네모 박스 (처음엔 숨김)
  const boxContainer = document.createElement("div");
  boxContainer.className = "box-container";
  boxContainer.style.visibility = "hidden";

  const boxes = [];
  for (let i = 0; i < getDisplayWord(word).length; i++) {
    const box = document.createElement("div");
    box.className = "word-box";
    boxContainer.appendChild(box);
    boxes.push(box);
  }
  topContainer.appendChild(boxContainer);
  stageContent.appendChild(topContainer);

  // 그림 표시 직후 엔진 준비
  warmUpSpeechEngine();

  // 500ms 후 네모 박스 표시
  setTimeout(() => {
    boxContainer.style.visibility = "visible";

    // 네모 박스 표시가 끝난 뒤 단어 발음 출력
    setTimeout(() => {
      speakWord(getDisplayWord(word));

      // 글자 버튼 표시
      setTimeout(() => {
        const bottomContainer = document.createElement("div");
        bottomContainer.className = "stage5-bottom";

        const letters = getDisplayWord(word).split("");

        let allLetters = [];
        words.forEach(w => allLetters.push(...getDisplayWord(w).split("")));
        allLetters = [...new Set(allLetters)];

        let dummyLetters = allLetters.filter(l => !letters.includes(l));
        dummyLetters = dummyLetters.sort(() => 0.5 - Math.random()).slice(0, Math.max(0, 7 - letters.length));

        let options = [...letters, ...dummyLetters];
        options = options.sort(() => 0.5 - Math.random());

        let currentPos = 0;

        options.forEach(letter => {
          const btn = document.createElement("div");
          btn.textContent = letter;
          btn.className = "letter-btn";

          btn.onclick = () => {
            speakWord(letter);

            if (btn.classList.contains("used")) return;

            if (letter === letters[currentPos]) {
              boxes[currentPos].textContent = letter;
              btn.classList.add("used", "correct");
              currentPos++;

              if (currentPos === letters.length) {
                setTimeout(() => {
                  if (currentIndex < words.length - 1) {
                    currentIndex++;
                    showStage5();
                  }
                }, 2500);
              }
            } else {
              btn.classList.add("wrong");
              setTimeout(() => btn.classList.remove("wrong"), 500);
            }
          };

          bottomContainer.appendChild(btn);
        });

        stageContent.appendChild(bottomContainer);

        // 글자 버튼 표시 후 스피커 아이콘 출력
        setTimeout(() => {
          const speakerIcon = createSpeakerIcon(word, 1000);
          speakerIcon.style.visibility = "visible";
          stageContent.appendChild(speakerIcon);
          
          // 스피커 아이콘이 나타날 때 화살표도 다시 표시
          showArrows();
        }, 500);

      }, 1000);
    }, 500);
  }, 500);
}

function warmUpSpeechEngine() {
  const dummy = new SpeechSynthesisUtterance("준비");
  dummy.lang = "ko-KR";
  speechSynthesis.speak(dummy);
  speechSynthesis.cancel();
}

function speakWord(text) {
  // 엔진 준비 (첫 발음 끊김 방지)
  warmUpSpeechEngine();

  if ('speechSynthesis' in window) {
    // 이전 발음 큐 초기화
    speechSynthesis.cancel();

    // 발음 객체 생성
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ko-KR";

    // 한국어 음성 선택
    const voices = speechSynthesis.getVoices();
    const koreanVoice = voices.find(v => v.lang === "ko-KR");
    if (koreanVoice) utterance.voice = koreanVoice;

    // 안정화를 위해 짧은 지연 후 발음 시작
    setTimeout(() => {
      speechSynthesis.speak(utterance);
    }, 500);
  }
}

function showCurrentStage() {
  if (currentStage === 1) {
    showStage1();
  } else if (currentStage === 2) {
    showStage2();
  } else if (currentStage === 3) {
    showStage3();
  } else if (currentStage === 4) {
    showStage4();
  } else if (currentStage === 5) {
    showStage5();
  }
}

function hideArrows() {
  document.getElementById("prevArrow").style.visibility = "hidden";
  document.getElementById("nextArrow").style.visibility = "hidden";
}

function showArrows() {
  updateArrows(); // 현재 인덱스/스테이지에 맞게 다시 표시
}

function updateArrows() {
  const prevArrow = document.getElementById("prevArrow");
  const nextArrow = document.getElementById("nextArrow");

  if (currentIndex > 0) {
    prevArrow.style.visibility = "visible";
    prevArrow.onclick = () => {
      currentIndex--;
      showCurrentStage();
    };
  } else {
    prevArrow.style.visibility = "hidden";
    prevArrow.onclick = null;
  }

  if (currentIndex < words.length - 1) {
    nextArrow.style.visibility = "visible";
    nextArrow.onclick = () => {
      currentIndex++;
      showCurrentStage();
    };
  } else {
    nextArrow.style.visibility = "hidden";
    nextArrow.onclick = null;
  }
}

// ----------------------
// Auto Mode 자동 진행
// ----------------------
async function startAutoMode() {
  await runAutoStage(1);
  await runAutoStage(2);
  await runAutoStage(3);
  await runAutoStage(4);
  await runAutoStage(5);
}

// 버튼에 포커스 효과 주고 클릭하는 헬퍼 함수
async function focusAndClickButton(stageText) {
  const buttons = document.querySelectorAll(".menu button");
  const targetButton = Array.from(buttons).find(btn => btn.textContent.includes(stageText));

  if (targetButton) {
    targetButton.classList.add("focused"); // 포커스 효과 적용
    await delay(2000);                     // 잠시 보여줌
    targetButton.click();                  // 클릭 실행
    targetButton.classList.remove("focused"); // 클릭 후 제거
  }
}

async function hoverAndClickNextArrow() {
  const nextArrow = document.getElementById("nextArrow");
  if (nextArrow) {
    // hover 효과 적용
    nextArrow.classList.add("hovered");
    await delay(800); // 0.8초 정도 보여줌

    // 클릭 실행
    nextArrow.click();

    // hover 효과 제거
    nextArrow.classList.remove("hovered");
  }
}

async function hoverAndClickHome() {
  const homeIcon = document.getElementById("home-icon");
  if (!homeIcon) {
    console.warn("home-icon 요소를 찾을 수 없습니다.");
    return;
  }
  console.warn("home-icon 요소를 찾았습니다.");
  homeIcon.classList.add("hovered"); // hover 효과 강제 적용
  await delay(800);                  // 잠시 보여줌
  homeIcon.click();                  // 클릭 실행
  homeIcon.classList.remove("hovered"); // 클릭 후 제거
}

async function runAutoStage(stageNumber) {
  await delay(2000);

  switch (stageNumber) {
    case 1:
      await focusAndClickButton("1단계");
      for (let i = 0; i < words.length; i++) {
        await delay(5000);
        await hoverAndClickNextArrow();
      }
      hoverAndClickHome();
      break;

  case 2:
    await focusAndClickButton("2단계");
    for (let i = 0; i < words.length; i++) {
      await delay(6000); // DOM 반영 대기
      // 현재 단어의 정답 그림 찾기 (표시용 단어 기준)
      const displayWord = getDisplayWord(words[i]);
      const correctImg = document.querySelector(`img[alt="${displayWord}"]`);
      if (correctImg) {
        correctImg.click(); // 실제 클릭처럼 동작
      }
    }
    await delay(3000); // DOM 반영 대기
    hoverAndClickHome();
    break;

  case 3:
    await focusAndClickButton("3단계");
    for (let i = 0; i < words.length; i++) {
      await delay(5000);
      await hoverAndClickNextArrow();
    }
    hoverAndClickHome();
    break;

  case 4:
    await focusAndClickButton("4단계");
    for (let i = 0; i < words.length; i++) {
      const letters = getDisplayWord(words[i]).split("");

      // 글자 단위 발음: 2초 후 시작 + 글자 수 × 2초
      let totalDelay = 2000 + (letters.length > 1 ? letters.length * 2000 : 0);

      // 전체 단어 발음: 마지막 글자 끝난 뒤 2초
      totalDelay += 2000;

      // 스피커 아이콘 표시: 전체 단어 발음 후 2초
      totalDelay += 2000;

      // 해당 단어 전체 흐름이 끝날 때까지 대기
      await delay(totalDelay);

      // 다음 단어로 넘어가기
      await hoverAndClickNextArrow();
    }
    hoverAndClickHome();
    break;

  case 5:
    await focusAndClickButton("5단계");
  
    for (let i = 0; i < words.length; i++) {
      const word = getDisplayWord(words[i]); // 괄호 제거된 표시용 단어
      const letters = word.split("");
  
      // 준비 시간 (단어 표시 후 2초)
      await delay(7000);
  
      for (let j = 0; j < letters.length; j++) {
        const btn = Array.from(document.querySelectorAll(".letter-btn"))
          .find(el => el.textContent === letters[j] && !el.classList.contains("used"));
  
        if (btn) {
          btn.click();
        }
  
        // 글자마다 2.5초 간격
        await delay(2500);
      }
    }
    await delay(3000);
    hoverAndClickHome();
    break;
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}