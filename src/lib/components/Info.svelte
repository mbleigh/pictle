<script lang="ts">
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
	<h1 class="text-3xl font-bold mb-3">What is Pictle?</h1>
	<p class="mb-4">
		Pictle is a challenging companion game for the wonderful <a
			class="link"
			href="https://www.powerlanguage.co.uk/wordle/"
			target="_blank">Wordle</a
		>. Using Wordle rules, you must create a picture inspired by the Wordle puzzle from 7 days ago.
	</p>
	<p class="font-bold mb-4">
		The same word can't be used twice, and you get bragging rights for using more unique letters.
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
