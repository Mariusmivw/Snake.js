const instream = process.stdin;
const outstream = process.stdout;

instream.setRawMode(true);
// instream.resume();
instream.setEncoding('utf8');
const a = require('http');

instream.on('data', (key) => {
	if (key === '\u0003') interupt();
	switch (key) {
		case '\033[A':
			pendingMoves.push(3); 0b11
			break;
		case '\033[B':
			pendingMoves.push(2); 0b10
			break;
		case '\033[C':
			pendingMoves.push(0); 0b00
			break;
		case '\033[D':
			pendingMoves.push(1); 0b01
			break;
		default:
			// console.log({key});
			break;
	}
});

const color = [255, 255, 255];
const snakeChar = '█';
const oldLastMoves = [0, 0]; // right, right
const lastMoves = [0, 0]; // right, right
const pendingMoves = [];
const fieldOffset = [0, 2];
const snakePos = [2, 0];
const snakeBackPos = [0, 0];
const fruitPos = [10, 10];
let mainInterval;
// outstream.write('\n\r');

function oldDrawSnake(clearDir) {
	outstream.cursorTo(snakePos[0], snakePos[1] + 2);
	outstream.write(snakeChar);
	for (const move of oldLastMoves) {
		if (move === 0) outstream.moveCursor(-2, 0);
		// else if (move === 1) outstream.moveCursor(0, 0);
		else if (move === 2) outstream.moveCursor(-1, -1);
		else if (move === 3) outstream.moveCursor(-1, 1);
		outstream.write(snakeChar);
	}
	if (undefined !== clearDir) {
		if (clearDir === 0) outstream.moveCursor(-2, 0);
		// else if (clearDir === 1) outstream.moveCursor(0, 0);
		else if (clearDir === 2) outstream.moveCursor(-1, -1);
		else if (clearDir === 3) outstream.moveCursor(-1, 1);
		outstream.write(' ')
	}
}

function oldUpdate() {
	let move = oldLastMoves[0];
	const init = move; // only for debug info
	let pendingMove = move;
	while (undefined !== pendingMove && (pendingMove & 2) === (move & 2)) pendingMove = pendingMoves.shift();
	if (undefined !== pendingMove) move = pendingMove;
	oldLastMoves.unshift(move);
	pendingMoves.length = 0;

	outstream.cursorTo(0, 0);
	console.log('lastMoves:', oldLastMoves.slice(0, -1), '; move:', move, '; init:', init)

	if (move === 0) snakePos[0]++;
	else if (move === 1) snakePos[0]--;
	else if (move === 2) snakePos[1]++;
	else if (move === 3) snakePos[1]--;
	oldDrawSnake(oldLastMoves.pop());
}

function drawSnakeAndFruit() {
	const relPosList = [[0, 0]];
	const moveSnake = (x, y) => {
		outstream.moveCursor(x-1, y);
		const prev = relPosList[relPosList.length - 1];
		relPosList.push([prev[0] + x, prev[1] + y]);
	};
	
	outstream.cursorTo(fruitPos[0] + fieldOffset[0], fruitPos[1] + fieldOffset[1]);
	outstream.write('\x1b[38;2;255;0;0m■\x1b[0m');

	outstream.cursorTo(snakeBackPos[0] + fieldOffset[0], snakeBackPos[1] + fieldOffset[1]);
	outstream.write(' ');

	for (const move of lastMoves) {
		if (move === 0) moveSnake(1, 0);
		else if (move === 1) moveSnake(-1, 0);
		else if (move === 2) moveSnake(0, 1);
		else if (move === 3) moveSnake(0, -1);
		outstream.write(snakeChar);
	}
	return relPosList;
}

function gameOver() {
	outstream.cursorTo(...fieldOffset);
	outstream.write('\x1b[J');
	outstream.write('Game Over');
	clearInterval(mainInterval);
}

function update() {
	let move = lastMoves[lastMoves.length - 1];
	const init = move; // only for debug info
	let pendingMove = move;
	while (undefined !== pendingMove && (pendingMove & 2) === (move & 2)) pendingMove = pendingMoves.shift();
	if (undefined !== pendingMove) move = pendingMove;
	lastMoves.push(move);
	pendingMoves.length = 0;

	outstream.cursorTo(0, 0);
	console.log('lastMoves:', lastMoves.slice(1), '; move:', move, '; init:', init)

	const relPosList = drawSnakeAndFruit();
	const dupes = duplicates(relPosList);
	if (dupes && (dupes[0] !== 0 || dupes[1] !== relPosList.length-1)) {
		gameOver();
	}
	const relHeadPos = relPosList[relPosList.length-1];
	const windowSize = outstream.getWindowSize();

	windowSize[0] -= fieldOffset[0];
	windowSize[1] -= fieldOffset[1];
	if (snakeBackPos[0] + relHeadPos[0] === fruitPos[0] &&
	    snakeBackPos[1] + relHeadPos[1] === fruitPos[1])
	{
		fruitPos[0] = Math.floor(Math.random() * windowSize[0]) + 1;
		fruitPos[1] = Math.floor(Math.random() * windowSize[1]) + 1;
	}
	else if (((a)=>a<0||a>windowSize[0])(snakeBackPos[0] + relHeadPos[0]) ||
	         ((a)=>a<0||a>windowSize[1])(snakeBackPos[1] + relHeadPos[1]))
	{
		gameOver();
	}
	else {
		const oldest = lastMoves.shift();
		if (oldest === 0) snakeBackPos[0]++;
		else if (oldest === 1) snakeBackPos[0]--;
		else if (oldest === 2) snakeBackPos[1]++;
		else if (oldest === 3) snakeBackPos[1]--;
	}

}

function duplicates(list2d) {
	for (let i = 0; i < list2d.length - 1; i++) {
		for (let j = i + 1; j < list2d.length; j++) {
			if (list2d[i].length !== list2d[j].length) continue;
			let k = 0;
			for (; k < list2d[i].length; k++) {
				if (list2d[i][k] !== list2d[j][k]) break;
			}
			if (k === list2d[i].length) return [i, j];
		}
	}
	return false;
}

function getCursorPosAsync() {
	return new Promise((resolve, reject) => {
		instream.once('data', (key) => {
			const m = key.match(/\033\[(\d+);(\d+)R/);
			if (m) resolve([parseInt(m[2]), parseInt(m[1])]);
			else reject();
		})
		instream.write('\033[6n');
	});
}

function interupt() {
	outstream.write('\033[2J');
	outstream.cursorTo(0, 0);
	process.exit();
}

function clearScreen() {
	return getCursorPosAsync().then((cursorPos) => {
		const windowSize = outstream.getWindowSize();
		outstream.write('\n\r'.repeat(windowSize[1]));
		outstream.cursorTo(0, 0);
	});
}

clearScreen()
	.then(()=>outstream.write(`\x1b[0m`))
	.then(()=>mainInterval=setInterval(update, 1000/5));
// console.log(outstream.getWindowSize())
// outstream.cursorTo(0,3)
// outstream.write('\u033[0J')

// setInterval(update, 1000/2);


// keyEmitter.on('\u0001b[A')
// outstream.moveCursor()
// outstream.write(snakeChar);
// outstream.write('a\nb')
// outstream.write('\033[0;0H');
// outstream.write('c')