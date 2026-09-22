var BrickGame = window.BrickGame || {};

(function() {
  var COLS = BrickGame.BOARD_COLS;
  var ROWS = BrickGame.BOARD_ROWS;

  var canvas = document.getElementById('game-canvas');
  var ctx = canvas.getContext('2d');

  var scoreDisplay = document.getElementById('score-display');
  var levelDisplay = document.getElementById('level-display');
  var linesDisplay = document.getElementById('lines-display');

   var board = BrickGame.createBoard();
   // Game state variables
   var score = 0;
   var lines = 0;
   var level = 1;
   // Update HUD display elements
   function updateHUD() {
       scoreDisplay.textContent = score;
       levelDisplay.textContent = level;
       linesDisplay.textContent = lines;
   }
    var isPaused = false;
    var isGameOver = false;
    var cellSize = 0;
    var pointerState = {};
    updateHUD();
   // Tetromino definitions
   var TETROMINOES = [
     {type:'I', shape:[[1,1,1,1]]},
     {type:'O', shape:[[1,1],[1,1]]},
     {type:'T', shape:[[0,1,0],[1,1,1]]},
     {type:'S', shape:[[0,1,1],[1,1,0]]},
     {type:'Z', shape:[[1,1,0],[0,1,1]]},
     {type:'J', shape:[[1,0,0],[1,1,1]]},
     {type:'L', shape:[[0,0,1],[1,1,1]]}
   ];
   function randomTetromino(){ return TETROMINOES[Math.floor(Math.random()*TETROMINOES.length)]; }


  function resizeCanvas() {
    var screen = canvas.parentElement;

    var device = document.querySelector('.device');
    if (device) device.style.zoom = '';

    var maxW = screen.clientWidth || 280;
    cellSize = Math.floor(maxW / COLS);
    var canvasW = cellSize * COLS;
    var canvasH = cellSize * ROWS;

    var dpr = window.devicePixelRatio || 1;
    canvas.width = canvasW * dpr;
    canvas.height = canvasH * dpr;
    canvas.style.width = canvasW + 'px';
    canvas.style.height = canvasH + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    draw();

    if (device) {
      var vh = window.innerHeight || document.documentElement.clientHeight;
      var vw = window.innerWidth || document.documentElement.clientWidth;
      var dh = device.offsetHeight;
      var dw = device.offsetWidth;
      var s = 1;
      if (dh > vh) s = Math.min(s, vh / dh);
      if (dw > vw) s = Math.min(s, vw / dw);
      if (s < 1) device.style.zoom = s;
    }
  }

  function draw() {
    var lcdBg = '#9ead86';
    var gridLine = '#8a9d76';
    var blockFill = '#2a3a1a';

    ctx.fillStyle = lcdBg;
    ctx.fillRect(0, 0, COLS * cellSize, ROWS * cellSize);

    ctx.strokeStyle = gridLine;
    ctx.lineWidth = 0.5;
    for (var r = 0; r <= ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * cellSize);
      ctx.lineTo(COLS * cellSize, r * cellSize);
      ctx.stroke();
    }
    for (var c = 0; c <= COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * cellSize, 0);
      ctx.lineTo(c * cellSize, ROWS * cellSize);
      ctx.stroke();
    }

    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        if (board[r][c] !== 0) {
          drawBlock(c, r, blockFill);
        }
      }
    }
    // Draw active falling piece
    if (BrickGame.activePiece) {
      var p = BrickGame.activePiece;
      var shape = p.shape;
      for (var pr = 0; pr < shape.length; pr++) {
        for (var pc = 0; pc < shape[pr].length; pc++) {
          if (!shape[pr][pc]) continue;
          drawBlock(p.col + pc, p.row + pr, blockFill);
        }
      }
    }
  }

  function drawBlock(col, row, color) {
    var x = col * cellSize;
    var y = row * cellSize;
    var inset = 1;

    ctx.fillStyle = color;
    ctx.fillRect(x + inset, y + inset, cellSize - inset * 2, cellSize - inset * 2);

    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(x + inset, y + inset, cellSize - inset * 2, 2);
    ctx.fillRect(x + inset, y + inset, 2, cellSize - inset * 2);

    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(x + inset, y + cellSize - inset - 2, cellSize - inset * 2, 2);
    ctx.fillRect(x + cellSize - inset - 2, y + inset, 2, cellSize - inset * 2);
  }

  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('orientationchange', function() {
    setTimeout(resizeCanvas, 150);
  });

  resizeCanvas();

  BrickGame.canvas = canvas;
  BrickGame.ctx = ctx;
  BrickGame.board = board;
  BrickGame.draw = draw;
   BrickGame.resizeCanvas = resizeCanvas;

   // Phase 2: piece logic and game loop
   BrickGame.activePiece = null;

   // Spawn a new I piece near top-center
     function spawnPiece() {
       var tet = randomTetromino();
       var shape = tet.shape.map(function(row){ return row.slice(); });
       var col = Math.floor((COLS - shape[0].length) / 2);
       var piece = {
         type: tet.type,
         shape: shape,
         row: 0,
         col: col,
         rotation: 0
       };
        // If the piece collides immediately, the game is over
        if (!canMove(piece,0,0)) {
          isGameOver = true;
          pointerState = {};
          var overlay = document.getElementById('game-over-overlay');
         if (overlay) overlay.style.display = 'flex';
         BrickGame.activePiece = null;
         return;
       }
       BrickGame.activePiece = piece;
     }

   // Collision detection
   function canMove(piece, dRow, dCol) {
     var shape = piece.shape;
     for (var r = 0; r < shape.length; r++) {
       for (var c = 0; c < shape[r].length; c++) {
         if (!shape[r][c]) continue;
         var newRow = piece.row + r + dRow;
         var newCol = piece.col + c + dCol;
         if (newCol < 0 || newCol >= COLS) return false;
         if (newRow < 0 || newRow >= ROWS) return false;
         if (board[newRow][newCol] !== 0) return false;
       }
     }
     return true;
   }

    // Rotate a matrix clockwise
    function rotateMatrix(m) {
        var rows = m.length;
        var cols = m[0].length;
        var result = [];
        for (var c = 0; c < cols; c++) {
            result[c] = [];
            for (var r = rows - 1; r >= 0; r--) {
                result[c][rows - 1 - r] = m[r][c];
            }
        }
        return result;
    }

    // Attempt to rotate the active piece (clockwise)
    function rotateActivePiece() {
        var piece = BrickGame.activePiece;
        if (!piece) return false;
        var newShape = rotateMatrix(piece.shape);
        var newCol = piece.col;
        var newRow = piece.row;

        // Simple wall adjustment
        if (newCol + newShape[0].length > COLS) {
            newCol = COLS - newShape[0].length;
        }
        if (newCol < 0) {
            newCol = 0;
        }
        if (newRow + newShape.length > ROWS) {
            // rotation would go out of bottom – reject
            return false;
        }

        // Test collision with board using temporary piece
        var temp = {shape: newShape, row: newRow, col: newCol};
        if (canMove(temp, 0, 0)) {
            piece.shape = newShape;
            piece.col = newCol;
            piece.row = newRow;
            piece.rotation = (piece.rotation + 1) % 4;
            return true;
        }
        return false;
    }

    function clearCompletedLines() {
        // Scan each row; if every cell is non‑zero the row is full and must be cleared.
        // Returns the number of rows cleared.
        var cleared = 0;
        // Iterate from bottom to top so that row indices stay consistent after removal.
        for (var r = ROWS - 1; r >= 0; r--) {
            var full = true;
            for (var c = 0; c < COLS; c++) {
                if (board[r][c] === 0) { full = false; break; }
            }
            if (full) {
                // Remove this row and prepend an empty row at the top.
                board.splice(r, 1);
                board.unshift(new Array(COLS).fill(0));
                cleared++;
                // Adjust r to stay on the same visual row after splice.
                r++; // will be decremented again by the loop's r--
            }
        }
        return cleared;
    }

    function hardDrop() {
        var piece = BrickGame.activePiece;
        if (!piece) return;
        // Move piece down until it cannot move further
        while (canMove(piece, 1, 0)) {
            piece.row++;
        }
        // Lock the piece at its final position
        lockPiece();
    }

    function lockPiece() {
      var piece = BrickGame.activePiece;
      if (!piece) return;
      var shape = piece.shape;
      for (var r = 0; r < shape.length; r++) {
        for (var c = 0; c < shape[r].length; c++) {
          if (!shape[r][c]) continue;
          board[piece.row + r][piece.col + c] = 1;
        }
      }
      BrickGame.activePiece = null;

      // --- line detection & clearing ---
      var cleared = clearCompletedLines();
      if (cleared > 0) {
        // scoring table: index = cleared lines
        var scoreTable = [0,100,300,500,800];
        score += scoreTable[cleared] || 0;
        lines += cleared;
        // level progression: every 10 lines
        var newLevel = Math.floor(lines / 10) + 1;
        if (newLevel !== level) {
          level = newLevel;
          fallDelay = Math.max(100, 1000 - (level - 1) * 100);
        }
        updateHUD();
      }

      // spawn next piece after handling clear/score
      spawnPiece();
    }

    function moveLeft() {
      if (isPaused || isGameOver) return;
      var piece = BrickGame.activePiece;
      if (piece && canMove(piece, 0, -1)) {
        piece.col--;
      }
    }

    function moveDown() {
      if (isPaused || isGameOver) return;
      var piece = BrickGame.activePiece;
      if (piece && canMove(piece, 1, 0)) {
        piece.row++;
      } else {
        lockPiece();
      }
    }

    function moveRight() {
      if (isPaused || isGameOver) return;
      var piece = BrickGame.activePiece;
      if (piece && canMove(piece, 0, 1)) {
        piece.col++;
      }
    }

    function rotatePiece() {
      if (isPaused || isGameOver) return;
      rotateActivePiece();
    }

    function doHardDrop() {
      if (isPaused || isGameOver) return;
      hardDrop();
    }

   function gameTick() {
     var piece = BrickGame.activePiece;
     if (piece) {
       if (canMove(piece, 1, 0)) {
         piece.row++;
       } else {
         lockPiece();
       }
     }
      BrickGame.draw();
    }

    function processInputRepeat(state, timestamp) {
      for (var k in state) {
        if (['ArrowLeft','ArrowRight','ArrowDown','left','right','down'].indexOf(k) === -1) continue;
        if (timestamp >= state[k].next) {
          if (k === 'ArrowLeft' || k === 'left') moveLeft();
          else if (k === 'ArrowRight' || k === 'right') moveRight();
          else if (k === 'ArrowDown' || k === 'down') moveDown();
          state[k].next += 100;
        }
      }
    }

    // Input handling
   function handleKey(e) {
     if (!BrickGame.activePiece) return;
     var piece = BrickGame.activePiece;
     switch (e.key) {
       case 'ArrowLeft':
         e.preventDefault();
         if (canMove(piece, 0, -1)) piece.col--;
         break;
       case 'ArrowRight':
         e.preventDefault();
         if (canMove(piece, 0, 1)) piece.col++;
         break;
        case 'ArrowDown':
          e.preventDefault();
          if (canMove(piece, 1, 0)) {
            piece.row++;
          } else {
            lockPiece();
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          rotateActivePiece();
          break;
     }
     BrickGame.draw();
   }

   // Start the game loop and input listeners
    // Start the persistent requestAnimationFrame game loop
    var lastFall = performance.now();
    var fallDelay = 600; // ms per automatic fall
    function gameLoop(timestamp) {
    // pause / game‑over handling
    if (isGameOver) {
        BrickGame.draw();
        return;
    }
    if (isPaused) {
        BrickGame.draw();
        requestAnimationFrame(gameLoop);
        return;
    }
        // gravity
        if (timestamp - lastFall >= fallDelay) {
            if (BrickGame.activePiece) {
                if (canMove(BrickGame.activePiece, 1, 0)) {
                    BrickGame.activePiece.row++;
                } else {
                    lockPiece();
                }
            }
            lastFall = timestamp;
        }
        // handle held keys and pointer buttons (left/right/down repeat)
        processInputRepeat(keyState, timestamp);
        processInputRepeat(pointerState, timestamp);
        BrickGame.draw();
        requestAnimationFrame(gameLoop);
    }
    requestAnimationFrame(gameLoop);
    // Keyboard input handling (single listeners)
    var keyState = {};
    var keyRepeatDelay = 200; // ms before repeat starts
    var keyRepeatInterval = 100; // ms between repeats

    window.addEventListener('keydown', function(e) {
        var key = e.key;
        if (key === 'p') {
            isPaused = !isPaused;
            if (isPaused) {
                pointerState = {};
            }
            var overlay = document.getElementById('pause-overlay');
            if (overlay) overlay.style.display = isPaused ? 'flex' : 'none';
            return;
        }
        // Hard drop (Space) – single press only
        if (key === ' ') {
            if (keyState[key]) return; // ignore repeat while held
            e.preventDefault();
            if (!isPaused && !isGameOver && BrickGame.activePiece) {
                hardDrop();
            }
            // Prevent further repeats of Space
            keyState[key] = {next: Infinity};
            return;
        }
        if (key === 'Enter') {
            if (isGameOver) {
                // Reset board
                board = BrickGame.createBoard();
                BrickGame.board = board;
                // Reset core stats
                score = 0;
                lines = 0;
                level = 1;
                fallDelay = 600; // reset gravity to initial speed
                isGameOver = false;
                isPaused = false;
                // Hide overlays
                var pauseOverlay = document.getElementById('pause-overlay');
                if (pauseOverlay) pauseOverlay.style.display = 'none';
                var gameOverOverlay = document.getElementById('game-over-overlay');
                if (gameOverOverlay) gameOverOverlay.style.display = 'none';
                // Reset HUD
                updateHUD();
                // Spawn fresh piece
                spawnPiece();
            }
            // No further processing for Enter
            return;
        }
        if (keyState[key]) return; // already tracking
        e.preventDefault();
        keyState[key] = {next: performance.now() + keyRepeatDelay};

        // immediate action (ignore if game over)
        if (isGameOver) {
            return;
        }
        // immediate action
        if (key === 'ArrowLeft') {
            moveLeft();
        } else if (key === 'ArrowRight') {
            moveRight();
        } else if (key === 'ArrowDown') {
            moveDown();
        } else if (key === 'ArrowUp') {
            rotatePiece();
        }
    });

    window.addEventListener('keyup', function(e) {
        var key = e.key;
        if (keyState[key]) {
            delete keyState[key];
        }
    });
    // Button controls for on-screen UI (pointer events)
    var pointerRepeatDelay = 200;
    var pointerRepeatInterval = 100;

    function setupPointerButton(btn, action, repeatKey) {
      if (!btn) return;
      btn.addEventListener('pointerdown', function(e) {
        e.preventDefault();
        if (isPaused || isGameOver) return;
        action();
        if (repeatKey) {
          pointerState[repeatKey] = {
            next: performance.now() + pointerRepeatDelay,
            pointerId: e.pointerId
          };
        }
      });
      if (repeatKey) {
        var stopRepeat = function(e) {
          e.preventDefault();
          if (pointerState[repeatKey] && pointerState[repeatKey].pointerId === e.pointerId) {
            delete pointerState[repeatKey];
          }
        };
        btn.addEventListener('pointerup', stopRepeat);
        btn.addEventListener('pointerleave', stopRepeat);
        btn.addEventListener('pointercancel', stopRepeat);
      }
    }

    setupPointerButton(document.getElementById('btn-left'), moveLeft, 'left');
    setupPointerButton(document.getElementById('btn-right'), moveRight, 'right');
    setupPointerButton(document.getElementById('btn-down'), moveDown, 'down');
    setupPointerButton(document.getElementById('btn-rotate'), rotatePiece, null);
    setupPointerButton(document.getElementById('btn-drop'), doHardDrop, null);

    // Spawn the initial piece and draw
   spawnPiece();
   BrickGame.draw();

})();
