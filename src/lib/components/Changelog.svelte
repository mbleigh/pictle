<script lang="ts">
	import { logEvent } from '$lib/firebase';

	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();
</script>

<div class="bg-gray-900 rounded-lg p-3 border-2 border-gray-500 m-6 max-w-sm relative text-left">
	<button
		on:click={() => {
			dispatch('close');
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
	<h1 class="text-3xl font-bold mb-3">Changelog</h1>
	<h2 class="text-green-300 font-bold text-xl mb-2">January 25, 2022</h2>
	<ul class="list-disc pl-6 text-sm marker:text-green-300">
		<li>Added a <b>Reset</b> button to restart the current puzzle.</li>
		<li>Added a unique letter score counter.</li>
		<li>Max letter score is now calculated for each puzzle.</li>
	</ul>
</div>
