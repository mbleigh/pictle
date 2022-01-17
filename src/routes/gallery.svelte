<script lang="ts">
	import '../app.css';
	import Header from '$lib/components/Header.svelte';
	import { onMount } from 'svelte';
	import { generateGrid, State, stateClasses } from '$lib/grid';

	let pics: { word: string; grid: State[][] }[];
	onMount(async () => {
		pics = await Promise.all(
			[202, 203, 204, 205].map(async (num) => {
				const { pic, word } = await (
					await fetch(`https://pictle-default-rtdb.firebaseio.com/puzzles/${num}.json`)
				).json();
				return {
					word,
					grid: generateGrid({
						pic: pic.split(' ').map((l) => l.split('').map((n) => parseInt(n, 10))),
						word,
						guesses: [],
						wip: ''
					})
				};
			})
		);
	});

	$: console.log(pics);
</script>

<div class="flex flex-col h-full">
	<Header />

	<div class="flex flex-wrap">
		{#each pics || [] as pic}
			<div class="mx-10 mt-10">
				{#each pic.grid as row}
					<div class="text-center flex justify-center">
						{#each row as cell}
							<div
								class="border w-8 h-8 mr-1 mb-1 {stateClasses({
									char: ' ',
									done: true,
									state: cell.desired,
									desired: cell.desired
								})}"
							/>
						{/each}
					</div>
				{/each}
				<h2 class="font-bold text-2xl uppercase text-center">{pic.word}</h2>
			</div>
		{/each}
	</div>
</div>
