var BrickGame = window.BrickGame || {};

BrickGame.BOARD_COLS = 10;
BrickGame.BOARD_ROWS = 20;

BrickGame.createBoard = function() {
  var board = [];
  for (var r = 0; r < BrickGame.BOARD_ROWS; r++) {
    board[r] = [];
    for (var c = 0; c < BrickGame.BOARD_COLS; c++) {
      board[r][c] = 0;
    }
  }
  return board;
};
