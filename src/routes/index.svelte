<script lang="ts">
	import Header, { showError } from '$lib/components/Header.svelte';

	import { check, checkAll } from '$lib/check';
	import { onMount } from 'svelte';
	import { logEvent } from '$lib/firebase';

	import JSConfetti from 'js-confetti';
	import { scale, fade, slide } from 'svelte/transition';
	import '../app.css';
	import { State, generateGrid, stateClasses } from '$lib/grid';
	import { currentUser } from '$lib/auth';

	const MAX_GIMMES = 3;
	const EMOJI_STATE = ['⬛', '🟨', '🟩'];
	const EMOJI_NUMBERS = '0️⃣ 1️⃣ 2️⃣ 3️⃣ 4️⃣ 5️⃣ 6️⃣ 7️⃣ 8️⃣ 9️⃣ 🔟'.split(' ');
	const ONE_DAY_MS = 86400000;
	const PUZZLE_200_START = 1642003200000; // 2022-01-22T16:00:00Z (8am PT)
	const keys = ['qwertyuiop'.split(''), 'asdfghjkl'.split(''), 'zxcvbnm'.split('')];

	function puzzleStartTime(num: number): number {
		return PUZZLE_200_START + (num - 200) * ONE_DAY_MS;
	}
	let num = 200 + Math.floor((Date.now() - PUZZLE_200_START) / ONE_DAY_MS);
	setInterval(async () => {
		const newNum = 200 + Math.floor((Date.now() - PUZZLE_200_START) / ONE_DAY_MS);
		if (newNum !== num) {
			num = newNum;
			await activatePuzzle(newNum);
		}
	}, 5000);
	let pic: number[][] | undefined;
	let word: string | undefined;
	let ready = false;
	$: {
		ready = word && pic?.length === 6;
	}

	let grid: State[][] = [];
	$: if (ready) {
		grid = generateGrid({ guesses, word, pic, wip });
	}

	let wip: string = '';
	let guesses: string[] = [];
	let gimmes: number[] = [];
	let shaking = false;
	let winState: boolean = false;
	$: winState = guesses.length >= 5;
	let countdownSeconds: number = 0;
	let countdownInterval: any = null;
	let streak = 0;
	$: if (winState) {
		if (!localStorage[`puzzle_${num}`])
			localStorage[`puzzle_${num}`] = JSON.stringify({ word, pic, guesses, gimmes });
		countdownSeconds = Math.max((puzzleStartTime(num + 1) - Date.now()) / 1000, 0);
		if (!countdownInterval) {
			countdownInterval = setInterval(() => {
				countdownSeconds = Math.max((puzzleStartTime(num + 1) - Date.now()) / 1000, 0);
			}, 1000);
		}

		let puz = num;
		while (localStorage[`puzzle_${puz}`]) {
			streak++;
			puz--;
		}
	}
	let showInfo: boolean = false;

	interface StoredState {
		word?: string;
		guesses?: string[];
		wip?: string;
		gimmes: number[];
	}

	async function activatePuzzle(id: number) {
		const response: { word: string; pic: string } = await (
			await fetch(`https://pictle-default-rtdb.firebaseio.com/puzzles/${id}.json`)
		).json();

		word = response.word;
		pic = response.pic.split(' ').map((line) => line.split('').map((n) => parseInt(n, 10)));
		guesses = [];
		wip = '';
		gimmes = [];
	}

	onMount(async () => {
		if (!localStorage['visited']) {
			showInfo = true;
			localStorage['visited'] = 'true';
		}

		await activatePuzzle(num);

		const stored: StoredState = JSON.parse(localStorage['guesses'] || 'null');
		if (stored && stored.word === word) {
			guesses = stored.guesses;
			wip = stored.wip;
			gimmes = stored.gimmes;
		}
	});

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

	function keyClasses({
		key,
		word,
		guesses,
		wip
	}: {
		key: string;
		word?: string;
		guesses?: string[];
		wip?: string;
	}): string {
		let out = '';

		if (word?.[(wip || '').length] === key) {
			out = 'border bg-green-500 border-green-700';
		} else if (word?.includes(key)) {
			out = 'border bg-yellow-500 border-amber-700';
		} else {
			out = 'bg-gray-500';
		}

		const guessletters = guesses.join('');
		if (guessletters.includes(key)) {
			out += ' opacity-70 bg-opacity-30';
		}
		return out;
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
			new JSConfetti().addConfetti({
				confettiColors: ['#4ade80', '#fde047']
			});
			logEvent('solved_puzzle', { gimmes_used: gimmes.length });
		}
		saveState();
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
		logEvent('share');
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
		const message = `🖼️ Pictle ${num} 🔠${uniqueLetters}/26${
			gimmes.length > 0 ? `🤌${gimmes.length}/3` : ''
		}${streak > 1 ? ` 🔥 ${streak}` : ''}\n\n${emojiGrid.join('\n')}`;
		if (false && navigator.share) {
			await navigator.share({
				text: message
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
		new JSConfetti().addConfetti({
			emojis: ['🤬'],
			emojiSize: 64,
			confettiNumber: 80
		});
		submit(true);
		e.target.blur();
	}
</script>

<svelte:window on:keydown={handleKey} />

<div class="flex flex-col h-full">
	<Header {num} />

	{#if !ready}
		<div class="flex-1 flex flex-col items-center justify-center text-3xl text-gray-600">
			Loading...
		</div>
	{:else}
		<main class="flex-1 items-center flex flex-col justify-center">
			{#if winState}
				<div class="text-2xl mt-4" transition:scale={{ duration: 500 }}>
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
					out:fade={{ duration: 200 }}
					on:click={gimme}
					class="border rounded-lg py-2 px-4 text-lg uppercase font-bold {gimmes.length < MAX_GIMMES
						? 'border-gray-300 text-white'
						: 'border-gray-600 text-gray-600'}">Gimme ({MAX_GIMMES - gimmes.length} left)</button
				>
			{:else}
				<div class="text-center" transition:scale={{ duration: 500 }}>
					<h1 class="text-2xl font-bold mb-3 flex items-center justify-center">
						{#if streak <= 1}
							You solved it!
						{:else}
							<b class="mr-2 text-green-400">{streak}</b> in a row!
						{/if}
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
		<div class="mb-2 mt-4" out:slide={{ duration: 200 }}>
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
								{
									key,
									word,
									guesses,
									wip
								}
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
