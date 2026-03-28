/**
 * game.js — Boggle Game Core (TASK-00)
 *
 * 담당 범위:
 *   - Boggle 공식 16개 주사위 정의
 *   - 4x4 보드 생성 및 DOM 렌더링
 *   - 기본 상태 관리 (점수, 타이머 플레이스홀더)
 *
 * TASK-01에서 드래그 입력, TASK-02에서 사전 검증,
 * TASK-03에서 점수 계산·타이머·게임 플로우가 추가된다.
 */

'use strict';

/* ── Boggle 공식 16개 주사위 (Boggle Classic) ── */
const BOGGLE_DICE = [
  ['A', 'A', 'E', 'E', 'G', 'N'],
  ['A', 'B', 'B', 'J', 'O', 'O'],
  ['A', 'C', 'H', 'O', 'P', 'S'],
  ['A', 'F', 'F', 'K', 'P', 'S'],
  ['A', 'O', 'O', 'T', 'T', 'W'],
  ['C', 'I', 'M', 'O', 'T', 'U'],
  ['D', 'E', 'I', 'L', 'R', 'X'],
  ['D', 'E', 'L', 'R', 'V', 'Y'],
  ['D', 'I', 'S', 'T', 'T', 'Y'],
  ['E', 'E', 'G', 'H', 'N', 'W'],
  ['E', 'E', 'I', 'N', 'S', 'U'],
  ['E', 'H', 'R', 'T', 'V', 'W'],
  ['E', 'I', 'O', 'S', 'S', 'T'],
  ['E', 'L', 'R', 'T', 'T', 'Y'],
  ['H', 'I', 'M', 'N', 'Qu', 'U'],
  ['H', 'L', 'N', 'N', 'R', 'Z'],
];

/* ── 게임 상태 ── */
const state = {
  board: [],          // 16개 셀 문자 (0~15, row-major)
  score: 0,
  foundWords: [],
  currentPath: [],    // 현재 드래그 경로 (셀 인덱스 배열) — TASK-01에서 구현
  gameActive: false,
};

/* ── Fisher-Yates shuffle ── */
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Boggle 보드 생성
 * 1. 16개 주사위를 무작위로 섞는다.
 * 2. 각 주사위의 면(6면) 중 하나를 무작위로 선택한다.
 * @returns {string[]} 16개 문자 배열
 */
function createBoard() {
  const shuffledDice = shuffle(BOGGLE_DICE);
  return shuffledDice.map(die => die[Math.floor(Math.random() * die.length)]);
}

/* ── DOM 참조 ── */
const boardEl      = document.getElementById('board');
const scoreEl      = document.getElementById('score');
const timerEl      = document.getElementById('timer');
const currentWordEl = document.getElementById('current-word');
const wordListEl   = document.getElementById('word-list');
const newGameBtn   = document.getElementById('new-game-btn');

/**
 * 4x4 보드를 DOM에 렌더링한다.
 * 기존 셀을 모두 제거하고 새로 생성한다.
 */
function renderBoard() {
  boardEl.innerHTML = '';

  state.board.forEach((letter, index) => {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.index = String(index);
    cell.dataset.row = String(Math.floor(index / 4));
    cell.dataset.col = String(index % 4);
    cell.textContent = letter;
    cell.setAttribute('role', 'gridcell');
    cell.setAttribute('aria-label', `${letter}, row ${Math.floor(index / 4) + 1}, column ${index % 4 + 1}`);

    // Qu는 별도 스타일 클래스
    if (letter === 'Qu') {
      cell.classList.add('cell-qu');
    }

    boardEl.appendChild(cell);
  });
}

/**
 * 점수판 UI를 현재 상태로 갱신한다.
 */
function renderScore() {
  scoreEl.textContent = String(state.score);
}

/**
 * 찾은 단어 목록을 DOM에 추가한다.
 * @param {string} word
 * @param {number} points
 */
function addWordToList(word, points) {
  const li = document.createElement('li');
  li.innerHTML = `${word.toUpperCase()}<span class="word-score">+${points}</span>`;
  wordListEl.appendChild(li);
}

/**
 * 새 게임 시작 — 보드를 새로 생성하고 상태를 초기화한다.
 */
function startNewGame() {
  state.board = createBoard();
  state.score = 0;
  state.foundWords = [];
  state.currentPath = [];
  state.gameActive = true;

  renderBoard();
  renderScore();
  wordListEl.innerHTML = '';
  currentWordEl.textContent = '';
  timerEl.textContent = '3:00';
}

/* ── 이벤트 핸들러 ── */
newGameBtn.addEventListener('click', startNewGame);

/* ── 초기 실행 ── */
startNewGame();
