import basicSsl from "@vitejs/plugin-basic-ssl"
import { defineConfig } from "astro/config"

// Astro integration imports

import sitemap from "@astrojs/sitemap"
import compress from "astro-compress"
import { VitePWA } from "vite-plugin-pwa"

// Helper imports
import { manifest, seoConfig } from "./utils/seoConfig"

import react from "@astrojs/react"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
	site: seoConfig.baseURL,
	integrations: [
		tailwindcss({
			configFile: "./tailwind.config.js",
			applyBaseStyles: false
		}),
		sitemap(),
		compress(),
		react()
	],
	vite: {
		plugins: [
			basicSsl(),
			VitePWA({
				registerType: "autoUpdate",
				manifest,
				workbox: {
					globDirectory: "dist",
					globPatterns: [
						"**/*.{js,css,svg,png,jpg,jpeg,gif,webp,woff,woff2,ttf,eot,ico}"
					],
					// Don't fallback on document based (e.g. `/some-page`) requests
					// This removes an errant console.log message from showing up.
					navigateFallback: null
				}
			}),
			tailwindcss()
		],
		server: {
			https: true
		}
	}
})
