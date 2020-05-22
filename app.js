const stream = process.stdin;
stream.setRawMode(true);
stream.resume();
stream.setEncoding('utf8');

stream.on('data', (key) => {
	if (key === '\u0003') process.exit();
	switch (key) {
		case '\u001b[A':
			pendingMoves.push(3); 0b11
			break;
		case '\u001b[B':
			pendingMoves.push(2); 0b10
			break;
		case '\u001b[C':
			pendingMoves.push(0); 0b00
			break;
		case '\u001b[D':
			pendingMoves.push(1); 0b01
			break;
		default:
			// console.log({key})
			break;
	}
});

const snakeChar = '█';
const lastMoves = [0, 0]; // right, right
const pendingMoves = [];
const snakePos = [2, 0];
process.stdout.write('\n\r');

function drawSnake(clearDir) {
	process.stdout.cursorTo(snakePos[0], snakePos[1] + 2);
	process.stdout.write(snakeChar);
	for (const move of lastMoves) {
		if (move === 0) process.stdout.moveCursor(-2, 0);
		// else if (move === 1) process.stdout.moveCursor(0, 0);
		else if (move === 2) process.stdout.moveCursor(-1, -1);
		else if (move === 3) process.stdout.moveCursor(-1, 1);
		process.stdout.write(snakeChar);
	}
	if (undefined !== clearDir) {
		if (clearDir === 0) process.stdout.moveCursor(-2, 0);
		// else if (move === 1) process.stdout.moveCursor(0, 0);
		else if (clearDir === 2) process.stdout.moveCursor(-1, -1);
		else if (clearDir === 3) process.stdout.moveCursor(-1, 1);
		process.stdout.write('\0')
	}
}

function update() {
	let move = lastMoves[0];
	const init = move; // only for debug info
	let pendingMove = move;
	while (undefined !== pendingMove && (pendingMove & 2) === (move & 2)) pendingMove = pendingMoves.shift();
	if (undefined !== pendingMove) move = pendingMove;
	lastMoves.unshift(move);
	pendingMoves.length = 0;

	process.stdout.cursorTo(0, 0);
	console.log('lastMoves:', lastMoves.slice(0, -1), '; move:', move, '; init:', init)

	if (move === 0) snakePos[0]++;
	else if (move === 1) snakePos[0]--;
	else if (move === 2) snakePos[1]++;
	else if (move === 3) snakePos[1]--;
	drawSnake(lastMoves.pop());
}

process.stdout.write('\0336n')
// console.log(process.stdout.getWindowSize())
// process.stdout.cursorTo(0,3)
// process.stdout.write('\u033[0J')

setInterval(update, 1000/2);


// keyEmitter.on('\u0001b[A')
// process.stdout.moveCursor()
// process.stdout.write(snakeChar);
// process.stdout.write('a\nb')
// process.stdout.write('\u001b[0;0H');
// process.stdout.write('c')