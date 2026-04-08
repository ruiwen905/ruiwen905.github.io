/* js/vocab.js
   Spaced Repetition System (SRS) for vocab + phonics tracking.

   STAGES:
     0 — Grey   — New, never seen
     1 — Active — Score 0–5. +1 correct, -1 wrong. 5 consecutive without wrong → instant Stage 4 ✓
                  5 pts (non-consecutive) → Stage 2 next day
     2 — Yellow — Starts at 2 pts. Next day after Stage 1. Need +3 consecutive correct (→5 = green)
                  Green → Stage 3 in 7 days
     3 — Yellow — Starts at 3 pts. 7 days after Stage 2 green. Need +2 correct (→5 = green)
                  Green → Stage 4 in 30 days
     4 — Yellow — Starts at 3 pts. 30 days after Stage 3 green. Need +2 correct (→5 = green)
                  Green with ✓ = MASTERED

   COLORS:  grey=0  yellow=in-progress  green=stage complete  green+tick=mastered
*/

window.VocabTracker = (() => {

  const STAGE_START_SCORE = [0, 0, 2, 3, 3];  // initial score when entering each stage
  const STAGE_TARGET      = 5;                  // score needed to complete a stage
  const STAGE_DELAY_DAYS  = [0, 0, 1, 7, 30];  // days before stage becomes available

  /* ── HELPERS ── */
  function dayStr(d = new Date()) {
    return d.toISOString().split('T')[0];
  }
  function daysDiff(from, to = new Date()) {
    const f = typeof from === 'string' ? new Date(from) : from;
    return Math.floor((to - f) / 86400000);
  }
  function todayStr() { return dayStr(); }

  /* ── GET / INIT WORD ENTRY ── */
  function getEntry(kidKey, word, category) {
    const APP = State.getApp();
    if (!APP.vocab) APP.vocab = {};
    if (!APP.vocab[kidKey]) APP.vocab[kidKey] = {};
    const wKey = (word || '').toLowerCase().trim();
    if (!wKey) return null;
    if (!APP.vocab[kidKey][wKey]) {
      APP.vocab[kidKey][wKey] = {
        word: wKey,
        display: word,
        category: category || 'vocab',  // 'phonics' | 'sight' | 'calendar' | 'vocab'
        stage: 0,
        score: 0,
        consecutive: 0,   // current correct-in-a-row streak in this stage
        neverWrong: true, // no wrong answer yet in Stage 1
        stageGreenDate: null,   // date this stage reached score=5
        nextStageAvailable: null,
        mastered: false,
        masteredDate: null,
        lastSeen: null,
        totalCorrect: 0,
        totalWrong: 0,
      };
    }
    return APP.vocab[kidKey][wKey];
  }

  /* ── RECORD AN ANSWER ── */
  function record(kidKey, word, category, correct) {
    if (!kidKey || !word) return;
    const APP = State.getApp();
    const e   = getEntry(kidKey, word, category);
    if (!e || e.mastered) return;

    e.lastSeen = todayStr();

    // Promote from Stage 0 on first correct
    if (e.stage === 0 && correct) {
      e.stage = 1; e.score = 0; e.consecutive = 0; e.neverWrong = true;
    }
    if (e.stage === 0) { State.save(); return; } // wrong on never-seen, ignore

    // Check if this stage is available yet
    if (!isAvailable(e)) { State.save(); return; }

    if (correct) {
      e.totalCorrect++;
      e.consecutive++;
      e.score = Math.min(STAGE_TARGET, e.score + 1);

      // Stage 1 special: 5 consecutive correct → instant master
      if (e.stage === 1 && e.neverWrong && e.consecutive >= STAGE_TARGET) {
        e.mastered = true;
        e.masteredDate = todayStr();
        e.stage = 4;
        e.score = STAGE_TARGET;
        e.stageGreenDate = todayStr();
        State.save(); return;
      }

      // Stage complete (score = 5)
      if (e.score >= STAGE_TARGET) {
        e.stageGreenDate = todayStr();
        if (e.stage === 4) {
          e.mastered = true;
          e.masteredDate = todayStr();
        } else {
          const nextStage = e.stage + 1;
          const delay = STAGE_DELAY_DAYS[nextStage];
          const avail = new Date();
          avail.setDate(avail.getDate() + delay);
          e.nextStageAvailable = dayStr(avail);
          // Don't advance stage yet — wait until available
        }
      }
    } else {
      e.totalWrong++;
      e.consecutive = 0;
      e.neverWrong = false;
      e.score = Math.max(STAGE_START_SCORE[e.stage], e.score - 1);
    }

    // Auto-advance stage if green date passed and delay met
    advanceIfReady(e);

    State.save();
  }

  /* ── AUTO-ADVANCE STAGE ── */
  function advanceIfReady(e) {
    if (e.mastered || e.stage >= 4) return;
    if (e.score < STAGE_TARGET) return;
    if (!e.nextStageAvailable) return;
    if (daysDiff(e.nextStageAvailable) < 0) return; // not yet

    const nextStage = e.stage + 1;
    e.stage = nextStage;
    e.score = STAGE_START_SCORE[nextStage];
    e.consecutive = 0;
    e.stageGreenDate = null;
    e.nextStageAvailable = null;
  }

  function isAvailable(e) {
    if (e.stage === 0) return false;
    if (e.stage === 1) return true;
    // For stages 2–4: check nextStageAvailable from PREVIOUS stage
    // (handled by advanceIfReady) — once advanced, always available
    return true;
  }

  /* ── TICK WORD (called at app start / daily) ── */
  function tickAll() {
    const APP = State.getApp();
    if (!APP.vocab) return;
    APP.kids.forEach(k => {
      const book = APP.vocab[k.key];
      if (!book) return;
      Object.values(book).forEach(e => {
        if (!e.mastered) advanceIfReady(e);
      });
    });
    State.save();
  }

  /* ── QUERY HELPERS ── */
  function getBook(kidKey) {
    const APP = State.getApp();
    return (APP.vocab && APP.vocab[kidKey]) ? Object.values(APP.vocab[kidKey]) : [];
  }

  function todayWords(kidKey) {
    // Words due for review today or that are new (stage 0 or 1 never seen today)
    const today = todayStr();
    return getBook(kidKey).filter(e => {
      if (e.mastered) return false;
      if (e.stage === 0) return true;
      if (e.stage === 1 && e.lastSeen !== today) return true;
      if (e.nextStageAvailable && e.nextStageAvailable <= today) return true;
      if (e.stageGreenDate && isAvailable(e)) return true;
      return e.lastSeen !== today && e.stage > 0;
    }).slice(0, 10); // max 10/day
  }

  function stageColor(e) {
    if (!e || e.stage === 0) return 'grey';
    if (e.mastered) return 'green';
    if (e.score >= STAGE_TARGET) return 'green';
    if (e.score > STAGE_START_SCORE[e.stage]) return 'yellow';
    return 'grey';
  }

  function stageLabel(e) {
    if (!e) return 'New';
    if (e.mastered) return '✓ Mastered';
    const labels = ['New','Learning','Review','Weekly','Monthly'];
    return labels[e.stage] || '';
  }

  function progressPct(e) {
    if (!e) return 0;
    const start = STAGE_START_SCORE[e.stage] || 0;
    const range = STAGE_TARGET - start;
    const cur   = Math.max(0, e.score - start);
    return Math.min(100, Math.round((cur / range) * 100));
  }

  return { record, getBook, todayWords, getEntry, tickAll, stageColor, stageLabel, progressPct, dayStr };
})();
