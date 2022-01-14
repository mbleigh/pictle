<script lang="ts">
	import { check, checkAll } from '$lib/check';
	import { onMount, tick } from 'svelte';

	import { fade } from 'svelte/transition';

	import '../app.css';

	const MAX_GIMMES = 3;
	const EMOJI_STATE = ['⬛', '🟨', '🟩'];
	const EMOJI_NUMBERS = '0️⃣ 1️⃣ 2️⃣ 3️⃣ 4️⃣ 5️⃣ 6️⃣ 7️⃣ 8️⃣ 9️⃣ 🔟'.split(' ');
	const ONE_DAY_MS = 86400000;
	const PUZZLE_200_START = 1641974400000;
	const keys = ['qwertyuiop'.split(''), 'asdfghjkl'.split(''), 'zxcvbnm'.split('')];

	function puzzleStartTime(num: number): number {
		return PUZZLE_200_START + (num - 200) * ONE_DAY_MS;
	}
	let num = 200 + Math.floor((Date.now() - PUZZLE_200_START) / ONE_DAY_MS);
	setInterval(() => {
		num = 200 + Math.floor((Date.now() - PUZZLE_200_START) / ONE_DAY_MS);
	}, 5000);
	let pic: number[][] | undefined;
	let word: string | undefined;
	let ready = false;
	$: {
		ready = word && pic?.length === 6;
	}

	let wip: string = '';
	let guesses: string[] = [];
	let gimmes: number[] = [];
	let shaking = false;
	let error: string | null = null;
	let errorTimeout: any = null;
	let winState: boolean = false;
	$: winState = guesses.length >= 5;
	let countdownSeconds: number = 0;
	let countdownInterval: any = null;
	$: if (winState) {
		if (!localStorage[`puzzle_${num}`])
			localStorage[`puzzle_${num}`] = JSON.stringify({ word, pic, guesses, gimmes });
		countdownSeconds = Math.max((puzzleStartTime(num + 1) - Date.now()) / 1000, 0);
		if (!countdownInterval) {
			countdownInterval = setInterval(() => {
				countdownSeconds = Math.max((puzzleStartTime(num + 1) - Date.now()) / 1000, 0);
			}, 1000);
		}
	}
	let showInfo: boolean = false;

	interface StoredState {
		word?: string;
		guesses?: string[];
		wip?: string;
		gimmes: number[];
	}

	let logEvent: (name: string, params?: Record<string, any>) => void = () => {};
	onMount(async () => {
		const { logEvent: fLogEvent } = await import('$lib/firebase');
		logEvent = fLogEvent;

		if (!localStorage['visited']) {
			showInfo = true;
			localStorage['visited'] = 'true';
		}

		const response: { word: string; pic: string } = await (
			await fetch(`https://pictle-default-rtdb.firebaseio.com/puzzles/${num}.json`)
		).json();

		word = response.word;
		pic = response.pic.split(' ').map((line) => line.split('').map((num) => parseInt(num, 10)));

		const stored: StoredState = JSON.parse(localStorage['guesses'] || 'null');
		if (stored && stored.word === word) {
			guesses = stored.guesses;
			wip = stored.wip;
			gimmes = stored.gimmes;
		}
	});

	interface State {
		char: string;
		state: number;
		wip?: boolean;
		done?: boolean;
		desired: number;
	}

	let grid: State[][];
	$: if (ready) {
		grid = [[], [], [], [], [], []];
		for (let y = 0; y < 6; y++) {
			for (let x = 0; x < 5; x++) {
				if (y === 5) {
					grid[y][x] = { char: word[x], state: 2, done: true, desired: pic[y][x] };
				} else if (guesses[y]) {
					const char = guesses[y][x];
					let state = 0;
					if (word[x] === char) {
						state = 2;
					} else if (word.includes(char)) {
						state = 1;
					}
					grid[y][x] = { char, state, done: true, wip: false, desired: pic[y][x] };
				} else if (y === guesses.length) {
					const char = wip[x] || ' ';
					let state = 0;
					if (word[x] === char) {
						state = 2;
					} else if (word.includes(char)) {
						state = 1;
					}
					grid[y][x] = { char, state, wip: true, done: false, desired: pic[y][x] };
				} else {
					grid[y][x] = { char: ' ', state: 0, desired: pic[y][x] };
				}
			}
		}
	}

	let uniqueLetters: number = 0;
	let letterFrequencies: Record<string, number> = {};
	$: {
		letterFrequencies = {};
		guesses.forEach((guess, i) => {
			if (gimmes.includes(i)) return;
			for (const letter of guess.split('')) {
				letterFrequencies[letter] = letterFrequencies[letter] || 0;
				letterFrequencies[letter]++;
			}
		});
		letterFrequencies = { ...letterFrequencies };
		uniqueLetters = Object.keys(letterFrequencies).length;
	}

	function stateClasses({ state, done, wip, char, desired }: State): string {
		if (wip) {
			console.log(state, done);
		}

		const desiredBorder = ['border-gray-500', 'border-amber-500', 'border-green-700'][desired];

		if (state === 0 && !wip && !done) {
			return 'border-gray-700';
		} else if (state === 0 && wip && char === ' ') {
			return desiredBorder;
		} else if (state === 0 && wip) {
			return `${desiredBorder} bg-gray-700`;
		} else if (state === 0 && done) {
			return 'border-gray-500';
		} else if (state === 1 && wip) {
			console.log('state 1 wip');
			return `text-yellow-500 bg-gray-700 ${desiredBorder}`;
		} else if (state === 1 && done) {
			console.log('state 1 done');
			return 'bg-yellow-500 border-amber-500';
		} else if (state === 2 && wip) {
			return `text-green-300 bg-gray-700 ${desiredBorder}`;
		} else if (state === 2 && done) {
			return 'bg-green-500 border-green-700';
		}
	}

	function keyClasses(key: string, word?: string): string {
		if ((word || '').includes(key)) {
			return 'border bg-green-500 border-green-700';
		} else {
			return 'bg-gray-500';
		}
	}

	function saveState() {
		localStorage['guesses'] = JSON.stringify({
			wip,
			guesses,
			word,
			gimmes
		});
	}

	function type(key: string) {
		if (wip.length < 5) {
			wip = wip + key.toLowerCase();
			saveState();
		}
	}

	function backspace() {
		if (wip.length > 0) {
			wip = wip.substring(0, wip.length - 1);
		}
	}

	function shake() {
		shaking = true;
		setTimeout(() => {
			shaking = false;
		}, 1000);
	}

	function submit(gimme = false) {
		if (wip.length !== 5) {
			return;
		}

		if (guesses.includes(wip)) {
			shake();
			showError("You've already used that word.");
			return;
		}

		const message = check(word, wip, pic[guesses.length]);
		if (message) {
			shake();
			showError(message);
			return;
		}

		logEvent(gimme ? 'used_gimme' : 'correct_guess');
		guesses = [...guesses, wip];
		wip = '';
		if (guesses.length === 5) {
			logEvent('solved_puzzle', { gimmes_used: gimmes.length });
		}
		saveState();
	}

	function showError(message: string) {
		if (errorTimeout) {
			clearTimeout(errorTimeout);
		}
		error = message;
		errorTimeout = setTimeout(() => {
			error = null;
		}, 1500);
		logEvent('show_error', { message });
	}

	function handleKey(event: KeyboardEvent) {
		if (event.key === 'Delete' || event.key === 'Backspace') {
			backspace();
		} else if (event.key.match(/^[a-z]$/i) && !event.altKey && !event.ctrlKey && !event.metaKey) {
			type(event.key);
		} else if (event.key === 'Enter') {
			submit();
		}
	}

	let shareText = 'Share';
	async function share() {
		const emojiGrid = grid.map((row, i) =>
			row
				.map((cell) => {
					if (cell.desired > 0 || gimmes.includes(i)) {
						return EMOJI_STATE[cell.desired];
					} else {
						return EMOJI_NUMBERS[Math.min(letterFrequencies[cell.char], 10)];
					}
				})
				.join('')
		);
		const message = `🖼️ Pictle ${num} 🤌${gimmes.length}/3 🔠${uniqueLetters}/26\n\n${emojiGrid.join(
			'\n'
		)}`;
		if (navigator.share) {
			await navigator.share({
				text: message,
				title: `Pictle - Daily Wordle companion game`,
				url: 'https://pictle.web.app'
			});
		} else {
			await navigator.clipboard.writeText(message);
			shareText = 'Copied';
			setTimeout(() => {
				shareText = 'Share';
			}, 2000);
		}
	}

	function gimme(e) {
		if (gimmes.length >= MAX_GIMMES) {
			showError('No gimmes remain.');
			return;
		}
		const valid = checkAll(word, pic[guesses.length], 'solvable');
		wip = valid[Math.floor(Math.random() * valid.length)];
		gimmes = [...gimmes, guesses.length];
		submit(true);
		e.target.blur();
	}
</script>

<svelte:window on:keydown={handleKey} />

<div class="flex flex-col h-full">
	<header class="border-b border-b-gray-700 p-4 flex items-center justify-center">
		<div class="max-w-md w-full mx-auto flex items-center justify-center">
			<button
				on:click={() => {
					showInfo = true;
				}}
				title="Info"
				><svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg></button
			>
			<h1 class="uppercase font-bold text-4xl text-gray-50 flex-1 tracking-widest text-center">
				Pictle <span class="font-light tracking-tight">{num}</span>
			</h1>
			<div class="h-6 w-6" />
		</div>
	</header>

	{#if !ready}
		<div class="flex-1 flex flex-col items-center justify-center text-3xl text-gray-600">
			Loading...
		</div>
	{:else}
		<main class="flex-1 items-center flex flex-col justify-center">
			{#if winState}
				<div class="text-2xl mt-4">
					<span>Next puzzle:</span>
					<time class="font-bold" datetime={new Date(puzzleStartTime(num + 1)).toISOString()}
						>{Math.floor(countdownSeconds / 60 / 60)
							.toString()
							.padStart(2, '0')}:{Math.floor((countdownSeconds / 60) % 60)
							.toString()
							.padStart(2, '0')}:{Math.floor(countdownSeconds % 60)
							.toString()
							.padStart(2, '0')}</time
					>
				</div>
			{/if}
			<div
				class="border-gray-700 border rounded-lg w-72 mx-auto mt-4 flex items-center justify-center overflow-hidden"
			>
				<div class="">
					{#each pic as row}
						<div class="text-center flex justify-center">
							{#each row as cell}
								<div
									class="border border-l-0 border-t-0 w-3 h-3 {stateClasses({
										char: ' ',
										done: true,
										state: cell,
										desired: cell
									})}"
								/>
							{/each}
						</div>
					{/each}
				</div>
				<div class="text-3xl font-bold uppercase flex-1 text-center tracking-widest">{word}</div>
			</div>

			<div class="my-3">
				{#each grid as row, i}
					<div
						class="text-center mb-1 flex justify-center"
						class:shake={i === guesses.length && shaking}
					>
						{#each row as cell}
							<div
								class="mx-0.5 border-2 w-14 h-14 flex justify-center items-center text-2xl uppercase font-bold {stateClasses(
									cell
								)}"
							>
								{cell.char}
							</div>
						{/each}
					</div>
				{/each}
			</div>
			{#if !winState}
				<button
					on:click={gimme}
					class="border rounded-lg py-2 px-4 text-lg uppercase font-bold {gimmes.length < MAX_GIMMES
						? 'border-gray-300 text-white'
						: 'border-gray-600 text-gray-600'}">Gimme ({MAX_GIMMES - gimmes.length} left)</button
				>
			{:else}
				<div class="text-center">
					<h1 class="text-2xl font-bold mb-3 flex items-center justify-center">
						You Solved It!
						<button
							class="bg-green-600 text-xl py-1 px-3 ml-4 rounded flex items-center"
							on:click={share}
							><svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5 mr-2"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"
								/>
							</svg>
							{shareText}</button
						>
					</h1>
					<p
						class="mb-2 text-xl flex-1 py-3 border {gimmes.length === 0
							? 'border-green-300'
							: 'border-red-300'} rounded-lg"
					>
						<b>Gimmes:</b>
						{gimmes.length}
					</p>
					<p class="mb-4 text-xl flex-1 py-3 border border-gray-600 rounded-lg">
						<b>Unique Letters:</b>
						{uniqueLetters}
					</p>
				</div>
			{/if}
		</main>
	{/if}
	{#if !winState}
		<div class="mb-2 mt-4">
			{#each keys as row, y}
				<div class="flex justify-center mb-1">
					{#if y === 2}
						<button
							on:click={() => submit()}
							class="bg-gray-500 w-16 h-12 text-md font-bold text-center py-3 rounded mx-0.5"
						>
							ENTER
						</button>
					{/if}
					{#each row as key}
						<button
							on:click={() => {
								type(key);
							}}
							class="w-8 h-12 text-xl font-bold text-center py-2 rounded mx-0.5 uppercase {keyClasses(
								key,
								word
							)}"
						>
							{key}
						</button>
					{/each}
					{#if y === 2}
						<button
							on:click={() => {
								backspace();
							}}
							class="bg-gray-500 w-16 h-12 text-2xl font-bold text-center py-2 rounded mx-0.5"
						>
							⌫
						</button>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

{#if error}
	<div transition:fade={{ duration: 200 }} class="fixed inset-0 text-center pointer-events-none">
		<div
			class="inline-block bg-gray-900 rounded-lg px-6 mt-24 py-4 text-xl text-red-500 flex-grow-0"
		>
			{@html error}
		</div>
	</div>
{/if}

{#if showInfo}
	<div
		transition:fade={{ duration: 200 }}
		class="fixed inset-0 text-center bg-black bg-opacity-50 flex flex-col justify-center items-center"
	>
		<div
			class="bg-gray-900 rounded-lg p-3 border-2 border-gray-500 m-6 max-w-sm relative text-left"
		>
			<button
				on:click={() => {
					showInfo = false;
				}}
				class="absolute right-2 top-2"
				><svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg></button
			>
			<h1 class="text-3xl font-bold mb-3">What is Pictle?</h1>
			<p class="mb-4">
				Pictle is a challenging companion game for the wonderful <a
					class="link"
					href="https://www.powerlanguage.co.uk/wordle/"
					target="_blank">Wordle</a
				>. Using Wordle rules, you must create a picture inspired by the Wordle puzzle from 7 days
				ago.
			</p>
			<p class="font-bold mb-4">
				The same word can't be used twice, and you get bragging rights for using more unique
				letters.
			</p>
			<p class="mb-6">
				If you get stuck on a line, the &ldquo;Gimme&rdquo; button will solve up to three lines
				automatically.
			</p>
			<p class="text-center text-sm font-bold">
				Created by <a class="link" href="https://twitter.com/mbleigh" target="_blank">@mbleigh</a>,
				powered by
				<a class="link" href="https://firebase.google.com/" target="_blank">Firebase</a>.
			</p>
		</div>
	</div>
{/if}
