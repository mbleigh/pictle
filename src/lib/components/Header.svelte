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
	import { onMount } from 'svelte';

	import Info from './Info.svelte';
	import Settings from './Settings.svelte';
	import Changelog from './Changelog.svelte';

	export let num: number | undefined = undefined;

	let settingsVisible = false;
	let changelogVisible = false;

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
		<button
			on:click={() => {
				logEvent('click_show_changelog');
				changelogVisible = true;
			}}
			class="ml-2"
			title="Changelog"
		>
			<svg
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
					d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
				/>
			</svg>
		</button>
		<h1 class="uppercase font-bold text-4xl text-gray-50 flex-1 tracking-widest text-center">
			Pictle
			{#if num}
				<span class="font-light tracking-tight">{num}</span>
			{/if}
		</h1>
		<div class="h-6 w-6" />
		<!-- <div class="h-6 w-6 ml-2" /> -->
		<button
			class="h-6 w-6 ml-2"
			on:click={() => {
				logEvent('click_show_settings');
				settingsVisible = true;
			}}
		>
			<svg
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
					d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
				/>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
				/>
			</svg>
		</button>
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
{#if changelogVisible}
	<div
		transition:fade={{ duration: 200 }}
		on:click={(e) => {
			if (e.target === e.currentTarget) {
				changelogVisible = false;
			}
		}}
		class="fixed inset-0 text-center bg-black bg-opacity-50 flex flex-col justify-center items-center z-50"
	>
		<Changelog
			on:close={() => {
				changelogVisible = false;
			}}
		/>
	</div>
{/if}
{#if settingsVisible}
	<div
		transition:fade={{ duration: 200 }}
		on:click={(e) => {
			if (e.target === e.currentTarget) {
				settingsVisible = false;
			}
		}}
		class="fixed inset-0 text-center bg-black bg-opacity-50 flex flex-col justify-center items-center z-50"
	>
		<Settings
			on:close={() => {
				settingsVisible = false;
			}}
		/>
	</div>
{/if}
