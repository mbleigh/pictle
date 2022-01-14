<script lang="ts">
	import { onMount } from 'svelte';
	import { solvable } from '$lib/words';

	import '../app.css';
	import { checkAll } from '$lib/check';

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
	let valids = [[], [], [], [], [], []];

	onMount(() => {
		if (localStorage.getItem('_drawgrid')) {
			grid = JSON.parse(localStorage.getItem('_drawgrid'));
		}
	});

	function toggle(y: number, x: number) {
		grid[y][x] = (grid[y][x] + 1) % 3;
		grid = [...grid];
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
			localStorage.setItem('_drawgrid', JSON.stringify(grid));
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
</script>

<div class="text-center text-xl font-bold mt-8">
	Seed word: <input
		type="text"
		class="bg-gray-800 border border-gray-600 rounded text-xl"
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

<textarea value={JSON.stringify(grid)} class="bg-gray-800 h-48 w-48 font-mono" />
