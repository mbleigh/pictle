<script context="module" lang="ts">
	let error = writable<string | null>(null);
	let errorTimeout: any;

	export async function showError(message: string) {
		if (errorTimeout) {
			clearTimeout(errorTimeout);
		}
		error.set(message);
		errorTimeout = setTimeout(() => {
			error.set(null);
		}, 1500);
		logEvent('show_error', { message });
	}

	let showInfoStore = writable<boolean>(false);
	export async function showInfo() {
		showInfoStore.set(true);
	}
	export async function hideInfo() {
		showInfoStore.set(false);
	}
</script>

<script lang="ts">
	import { logEvent } from '$lib/firebase';
	import { fade } from 'svelte/transition';
	import { writable } from 'svelte/store';
	import Info from './Info.svelte';
	import { onMount } from 'svelte';

	export let num: number | undefined = undefined;

	onMount(() => {
		if (!localStorage['visited']) {
			showInfo();
			localStorage['visited'] = 'true';
		}
	});
</script>

<header class="border-b border-b-gray-700 p-4 flex items-center justify-center">
	<div class="max-w-md w-full mx-auto flex items-center justify-center">
		<button
			on:click={() => {
				logEvent('click_show_info');
				showInfo();
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
			Pictle
			{#if num}
				<span class="font-light tracking-tight">{num}</span>
			{/if}
		</h1>
		<div class="h-6 w-6" />
	</div>
</header>

{#if $error}
	<div
		transition:fade={{ duration: 200 }}
		class="fixed inset-0 text-center pointer-events-none z-40"
	>
		<div
			class="inline-block bg-gray-900 rounded-lg px-6 mt-24 py-4 text-xl text-red-500 flex-grow-0"
		>
			{@html $error}
		</div>
	</div>
{/if}

{#if $showInfoStore}
	<div
		transition:fade={{ duration: 200 }}
		on:click={(e) => {
			if (e.target === e.currentTarget) {
				hideInfo();
			}
		}}
		class="fixed inset-0 text-center bg-black bg-opacity-50 flex flex-col justify-center items-center z-50"
	>
		<Info
			on:close={() => {
				hideInfo();
			}}
		/>
	</div>
{/if}
