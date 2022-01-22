<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	import { logEvent } from '$lib/firebase';
	import { currentUser, signInWithGoogle, signOut } from '$lib/auth';
	import { setUserId } from 'firebase/analytics';

	const dispatch = createEventDispatcher();

	$: console.log($currentUser);
</script>

<div class="bg-gray-900 rounded-lg p-3 border-2 border-gray-500 m-6 w-80 relative text-left">
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
	<h1 class="text-3xl font-bold mb-3">Settings</h1>

	{#if $currentUser.user}
		<p class="text-sm text-center mb-3">
			Signed in as <b>{$currentUser.user.email}</b>.
		</p>
		<button
			class="rounded border border-gray-400 py-2 px-3 text-center block w-full"
			on:click={() => signOut()}>Sign Out</button
		>
	{:else}
		<p class="text-sm mb-3">
			Signing in allows you to keep your streak and preferences across devices.
		</p>
		<button
			class="rounded border border-blue-400 text-blue-300 py-2 px-3 w-full"
			on:click={() => signInWithGoogle()}>Sign in with Google</button
		>
	{/if}
</div>
