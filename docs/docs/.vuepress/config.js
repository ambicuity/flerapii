import { viteBundler } from "@vuepress/bundler-vite"
import { sitemapPlugin } from "@vuepress/plugin-sitemap"
import { defaultTheme } from "@vuepress/theme-default"
import { defineUserConfig } from "vuepress"

const sitemapHostname = process.env.DOCS_HOSTNAME ?? "https://flerapii.qixing1217.top" // user might change this later

export default defineUserConfig({
  base: "/",
  lang: "en-US",
  title: "Flerapii",
  description: "An open-source browser extension to aggregate and manage all your API relay accounts.",

  head: [
    ["link", { rel: "icon", type: "image/png", sizes: "16x16", href: "/16.png" }],
    ["link", { rel: "icon", type: "image/png", sizes: "32x32", href: "/32.png" }],
    ["link", { rel: "icon", type: "image/png", sizes: "48x48", href: "/48.png" }],
    ["link", { rel: "apple-touch-icon", sizes: "128x128", href: "/128.png" }],
    // Add custom fonts for Gujarati-Python theme
    ["link", { rel: "preconnect", href: "https://fonts.googleapis.com" }],
    ["link", { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: true }],
    ["link", { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" }]
  ],

  theme: defaultTheme({
    logo: "/512.png",
    colorMode: "dark",
    colorModeSwitch: false, // Force dark mode like Gujarati Python
    
    navbar: [
      "/",
      "/get-started",
      "/changelog",
      "/faq",
      {
        text: 'Guides',
        children: [
          { text: 'Supported Tools', link: '/supported-export-tools' },
          { text: 'Supported Sites', link: '/supported-sites' },
          { text: 'Cloudflare Helper', link: '/cloudflare-helper' },
          { text: 'Quick Export', link: '/quick-export' },
          { text: 'Auto Refresh', link: '/auto-refresh' },
          { text: 'Auto Check-in', link: '/auto-checkin' },
          { text: 'Auto Detect', link: '/auto-detect' },
          { text: 'Redemption Assistant', link: '/redemption-assist' },
          { text: 'WebDAV Sync', link: '/webdav-sync' },
          { text: 'Data Management', link: '/data-management' },
          { text: 'New API Model Sync', link: '/new-api-model-sync' },
          { text: 'New API Channel Mgmt', link: '/new-api-channel-management' },
          { text: 'Octopus Channel Mgmt', link: '/octopus-channel-management' },
          { text: 'CLIProxyAPI Integration', link: '/cliproxyapi-integration' },
          { text: 'Model Redirect', link: '/model-redirect' },
          { text: 'Sorting Priority', link: '/sorting-priority' },
          { text: 'Permissions', link: '/permissions' },
          { text: 'Privacy', link: '/privacy' }
        ]
      }
    ]
  }),

  plugins: [
    sitemapPlugin({
      hostname: sitemapHostname,
      excludePaths: ["/404.html"],
      devServer: true
    }),
  ],

  bundler: viteBundler()
})
