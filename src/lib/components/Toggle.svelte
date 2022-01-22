<script lang="ts">
	export let checked = false;
</script>

<button
	on:click={() => {
		checked = !checked;
	}}
	type="button"
	class="{checked
		? 'bg-green-500'
		: 'bg-gray-200'} relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
	role="switch"
	aria-checked="false"
>
	<span class="sr-only">Use setting</span>
	<span
		aria-hidden="true"
		class="{checked
			? 'translate-x-5'
			: 'translate-x-0'} pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200"
	/>
</button>
