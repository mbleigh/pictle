<script lang="ts">
	import { onMount, tick } from 'svelte';
	import '../app.css';
	import { checkAll } from '$lib/check';
	import '$lib/fireboot';
	import { currentUser } from '$lib/auth';
	import JSConfetti from 'js-confetti';
	import { setUserId } from 'firebase/analytics';
	import Gallery from './gallery.svelte';

	let grid = [
		[0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0],
		[2, 2, 2, 2, 2]
	];
	const defaultGrid = JSON.stringify(grid);
	let seed = '';
	let pid = '';
	let valids = [[], [], [], [], [], []];
	let submitText = 'Submit';

	onMount(() => {
		if (localStorage.getItem('_draw')) {
			const { grid: g, seed: s, pid: p } = JSON.parse(localStorage.getItem('_draw'));
			grid = g;
			seed = s;
			pid = p;
		}
	});

	function toggle(y: number, x: number) {
		grid[y][x] = (grid[y][x] + 1) % 3;
		grid = [...grid];
	}

	async function submit() {
		submitText = 'Sending...';
		const result = await fetch(
			`https://pictle-default-rtdb.firebaseio.com/puzzles/${pid}.json?auth=${await $currentUser.user.getIdToken()}`,
			{
				method: 'PUT',
				body: JSON.stringify({
					id: parseInt(pid, 10),
					word: seed,
					pic: grid.map((l) => l.join('')).join(' ')
				})
			}
		);
		submitText = 'Submit';
		if (result.ok) {
			new JSConfetti().addConfetti();
		} else {
			alert(await result.text());
		}
	}

	function cellClasses(val: number): string {
		switch (val) {
			case 0:
				return 'border-gray-700';
			case 1:
				return 'bg-yellow-500 border-amber-500';
			case 2:
				return 'bg-green-500 border-green-700';
		}
	}

	$: {
		if (typeof localStorage !== 'undefined' && JSON.stringify(grid) !== defaultGrid) {
			localStorage.setItem('_draw', JSON.stringify({ grid, seed, pid }));
		}

		if (seed.length === 5) {
			check();
		}
	}

	function check() {
		const out = [];
		grid.forEach((row, i) => {
			valids[i] = checkAll(seed, row);
		});
	}

	function reset() {
		seed = '';
		pid = '';
		grid = JSON.parse(defaultGrid);
		check();
	}
</script>

<div class="text-center text-xl font-bold mt-8">
	ID: <input
		type="text"
		class="bg-gray-800 border border-gray-600 rounded text-xl w-12 mr-4"
		maxlength="3"
		bind:value={pid}
	/>

	Word:
	<input
		type="text"
		class="bg-gray-800 border border-gray-600 rounded text-xl w-20"
		maxlength="5"
		bind:value={seed}
	/>
</div>

<div class="my-8">
	{#each grid as row, y}
		<div class="text-center mb-2 flex justify-center">
			{#each row as cell, x}
				<div
					on:click={() => toggle(y, x)}
					class="mx-1 border-2  w-16 h-16 flex justify-center items-center text-3xl uppercase font-bold {cellClasses(
						cell
					)}"
				/>
			{/each}
			<div
				class="mx-1 border-2  w-16 h-16 flex justify-center items-center text-3xl uppercase font-bold"
				title={valids[y].slice(0, 15).join(' ')}
			>
				{valids[y].length}
			</div>
		</div>
	{/each}
</div>

<div class="text-center">
	{#if $currentUser.user?.email == 'mbleigh@gmail.com'}
		<button
			on:click|preventDefault={submit}
			class="bg-green-500 text-2xl uppercase font-bold px-5 py-2 rounded mx-auto"
			>{submitText}</button
		>
	{/if}
	<button
		on:click|preventDefault={reset}
		class="border border-red-300 text-2xl text-red-100 uppercase font-bold px-5 py-2 rounded mx-auto"
		>Reset</button
	>
</div>
