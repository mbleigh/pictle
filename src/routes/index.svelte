<script lang="ts">
	import Header, { showError } from '$lib/components/Header.svelte';

	import { check, checkAll, highLetterScore } from '$lib/check';
	import { onMount } from 'svelte';
	import { logEvent } from '$lib/firebase';

	import JSConfetti from 'js-confetti';
	import { scale, fade, slide } from 'svelte/transition';
	import '../app.css';
	import { State, generateGrid, stateClasses } from '$lib/grid';
	import { currentUser } from '$lib/auth';
	import { dbGet, dbSet } from '$lib/db';

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
	let saveTime: number | undefined;
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
		if (!localStorage[`puzzle_${num}`]) {
			localStorage[`puzzle_${num}`] = JSON.stringify({ word, pic, guesses, gimmes });
			syncRemoteSolves();
		}
		countdownSeconds = Math.max((puzzleStartTime(num + 1) - Date.now()) / 1000, 0);
		if (!countdownInterval) {
			countdownInterval = setInterval(() => {
				countdownSeconds = Math.max((puzzleStartTime(num + 1) - Date.now()) / 1000, 0);
			}, 1000);
		}

		let puz = num;
		streak = 0;
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
		saveTime: number;
	}

	async function activatePuzzle(id: number) {
		const response: { word: string; pic: string; max: number } = await dbGet(`puzzles/${id}`);

		word = response.word;
		pic = response.pic.split(' ').map((line) => line.split('').map((n) => parseInt(n, 10)));
		guesses = [];
		wip = '';
		gimmes = [];
		maxScore = response.max || 25;
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
			saveTime = stored.saveTime;
		}
	});

	let remoteSynced = false;
	$: if ($currentUser.user && !remoteSynced) {
		syncRemoteState();
	}

	async function syncRemoteState() {
		if (!$currentUser.user) return;
		const state: StoredState = await dbGet<StoredState>(`players/${$currentUser.user.uid}/state`);
		if (
			state &&
			state.word === word &&
			(!saveTime || state.saveTime > saveTime || state.guesses.length > guesses.length)
		) {
			wip = state.wip || '';
			gimmes = state.gimmes || [];
			word = state.word || '';
			guesses = state.guesses || [];
			saveTime = state.saveTime;
		}

		return syncRemoteSolves();
	}

	async function syncRemoteSolves() {
		if (!$currentUser.user) return;
		const solves = (await dbGet(`players/${$currentUser.user.uid}/solves`)) || {};

		for (let i = 202; i <= num; i++) {
			const val = localStorage[`puzzle_${i}`];
			const solve = solves[i];
			if (solve && !val) {
				localStorage[`puzzle_${i}`] = JSON.stringify({
					gimmes: solve.gimmes || [],
					guesses: solve.guesses || [],
					word: solve.word,
					id: i
				});
			}
			if (val) {
				const solve = JSON.parse(val);
				solves[i] = { id: i, gimmes: solve.gimmes, guesses: solve.guesses, word: solve.word };
			}
		}
		if (Object.keys(solves).length) {
			await dbSet(`players/${$currentUser.user.uid}/solves`, solves);
		}
	}

	let maxScore: number = 0;

	let uniqueLetters: number = 0;
	let letterFrequencies: Record<string, number> = {};
	$: {
		letterFrequencies = {};
		(guesses.length === 5 ? guesses : [...guesses, wip]).forEach((guess, i) => {
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

	let timer;
	function saveState() {
		if (timer) clearTimeout(timer);
		timer = setTimeout(async () => {
			saveTime = Date.now();

			const state = {
				wip,
				guesses,
				word,
				gimmes,
				saveTime
			};

			localStorage['guesses'] = JSON.stringify(state);
			if ($currentUser.user) {
				await dbSet(`players/${$currentUser.user.uid}/state`, state);
			}
		}, 500);
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
			saveState();
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

		if (gimme) {
			logEvent('used_gimme', { word });
		} else {
			logEvent('correct_guess', { word, guess: wip });
		}
		guesses = [...guesses, wip];
		wip = '';
		if (guesses.length === 5) {
			new JSConfetti().addConfetti({
				confettiColors: ['#4ade80', '#fde047']
			});
			logEvent('solved_puzzle', { word, gimmes_used: gimmes.length });
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
		const message = `🖼️ Pictle ${num} 🔠 ${uniqueLetters}/${maxScore}${
			gimmes.length > 0 ? `🤌 ${gimmes.length}/3` : ''
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

	let gimmePrimed = false;
	function gimme(e) {
		if (gimmes.length >= MAX_GIMMES) {
			showError('No gimmes remain.');
			return;
		}

		if (gimmePrimed) {
			const valid = checkAll(word, pic[guesses.length], 'solvable');
			wip = valid[Math.floor(Math.random() * valid.length)];
			gimmes = [...gimmes, guesses.length];
			submit(true);
			gimmePrimed = false;
			e.target.blur();
			return;
		}

		gimmePrimed = true;
		setTimeout(() => {
			gimmePrimed = false;
		}, 3000);
	}

	let resetPrimed = false;
	function reset(e) {
		if (gimmes.length > 0) {
			showError("Can't reset once gimmes are used.");
			return;
		} else if (guesses.length === 0) {
			return;
		}

		if (resetPrimed) {
			guesses = [];
			wip = '';
			gimmes = [];
			saveState();
			resetPrimed = false;
			return;
		}

		resetPrimed = true;
		setTimeout(() => {
			resetPrimed = false;
		}, 3000);
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
			<div class="flex items-center mt-4">
				<div
					class="border-gray-700 border rounded-lg w-56 mx-auto flex items-center justify-center overflow-hidden h-20"
				>
					<div class="ml-1 rounded overflow-hidden">
						{#each pic as row}
							<div class="text-center flex justify-center">
								{#each row as cell}
									<div
										class="border border-l-0 border-t-0 border-opacity-50 w-3 h-3 {stateClasses({
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
				<div>
					<div
						class="{winState
							? 'border-green-400'
							: 'border-gray-700'} ml-2 border rounded-lg w-16 h-20 text-center py-3"
					>
						<div class="font-bold">A-Z</div>
						<div class="text-lg">
							<span class="font-bold{winState ? ' text-green-300' : ''}">{uniqueLetters}</span><span
								class="text-gray-200 text-sm">/{maxScore}</span
							>
						</div>
					</div>
				</div>
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
								)}{cell.char === ' ' ? ' text-gray-600' : ''}"
							>
								{cell.valid?.length === 1 && cell.char === ' ' && guesses.length === i
									? cell.valid
									: cell.char}
							</div>
						{/each}
					</div>
				{/each}
			</div>
			{#if !winState}
				<div out:fade={{ duration: 200 }} class="flex justify-center">
					<button
						on:click={reset}
						class="flex text-lg items-center uppercase p-2 rounded-lg border mr-3 {guesses.length ===
							0 || gimmes.length > 0
							? 'border-gray-600 text-gray-600'
							: 'border-red-100 text-red-200'}"
						><svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6 mr-2"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z"
							/>
						</svg>
						{resetPrimed ? 'Sure?' : 'Reset'}</button
					>
					<button
						on:click={gimme}
						class="flex text-lg items-center uppercase p-2 rounded-lg border {gimmes.length <
						MAX_GIMMES
							? 'border-orange-100 text-orange-200'
							: 'border-gray-600 text-gray-600'}"
						><svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6 mr-2"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11"
							/>
						</svg>
						{gimmePrimed ? 'You sure?' : `Gimme (${MAX_GIMMES - gimmes.length} left)`}</button
					>
				</div>
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
					{#if gimmes.length}
						<p
							class="mb-2 text-xl flex-1 py-3 border {gimmes.length === 0
								? 'border-green-300'
								: 'border-red-300'} rounded-lg"
						>
							<b>Gimmes:</b>
							{gimmes.length}
						</p>
					{:else}
						<p class="text-center mt-3 mb-2">Try for a higher letter score?</p>
						<button
							on:click={reset}
							class="flex text-xl items-center p-3 justify-center rounded-lg border mr-3 w-full {guesses.length ===
								0 || gimmes.length > 0
								? 'border-gray-600 text-gray-600'
								: 'border-red-100 text-red-200'}"
							><svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-6 w-6 mr-2"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z"
								/>
							</svg>
							{resetPrimed ? 'Are you sure?' : 'Restart Puzzle'}</button
						>
					{/if}
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
