# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## VS Code Web Panel Extension

This is a VS Code extension that displays web dashboards directly within VS Code using webview panels or sidebar views. The extension allows users to embed any web-based dashboard (Grafana, Kibana, custom dashboards, etc.) into their development environment.

## Development Commands

### Build and Development
```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode (auto-compile on changes)
npm run watch

# Run linter
npm run lint

# Run tests
npm test

# Package extension for distribution
vsce package
```

### Testing the Extension
1. Press F5 in VS Code to launch a new Extension Development Host window
2. The extension will be automatically loaded in the new window
3. Use Command Palette to run "Open Dashboard Panel" command
4. For local testing, run the test server: `node test-dashboard-server.js` (runs on port 3019)

## Architecture Overview

### Extension Structure
- **Entry Point**: `src/extension.ts` - Registers commands and providers
- **DashboardPanel**: Manages floating webview panels (singleton pattern)
- **DashboardViewProvider**: Manages sidebar webview in Explorer
- **HTML Template**: `src/dashboard-template.html` - Webview content template

### Key Design Patterns
1. **Singleton Panel**: Only one dashboard panel instance allowed at a time
2. **Dynamic Configuration**: Settings injected into HTML at runtime via template replacement
3. **Two Render Modes**:
   - `iframe`: Secure, respects CSP, but may be blocked by some sites
   - `fetch`: Works with all sites but less secure (fetches and injects content)

### Configuration System
The extension uses VS Code's configuration API with these settings:
- `web-panel.renderMode`: "iframe" | "fetch"
- `web-panel.navigation.enabled`: boolean
- `web-panel.navigation.allowExternal`: boolean
- `web-panel.security.sandboxLevel`: "strict" | "medium" | "relaxed"

Configuration is read at runtime and injected into the webview HTML.

## Important Implementation Details

### Webview Security
- Content Security Policy (CSP) is set based on configuration
- Sandbox attributes control iframe permissions
- State persistence uses `vscode.setState()` to remember last URL

### URL Handling
- Default URL: Shows built-in animated dashboard if no URL specified
- URL validation: Basic checks for http/https protocols
- Navigation: Can be disabled via configuration

### Error Handling
- Graceful fallback when sites block iframe embedding
- User-friendly error messages in the webview
- Console logging for debugging

## Publishing Process

Before publishing to VS Code Marketplace:
1. Update `package.json`: Replace placeholder publisher name and repository URLs
2. Update `LICENSE`: Replace placeholder name
3. Add 128x128px `icon.png` to project root
4. Update version number and CHANGELOG.md
5. Run `vsce package` to create VSIX file
6. Publish with `vsce publish`

## Testing Checklist

When making changes, test:
1. Both render modes (iframe and fetch)
2. All security sandbox levels
3. Navigation enable/disable
4. Panel creation and disposal
5. Sidebar view functionality
6. Configuration changes (require reload)
7. Error scenarios (blocked sites, invalid URLs)

## Known Limitations

1. Some sites block iframe embedding (X-Frame-Options)
2. Authentication must be handled within the webview
3. No navigation history between sessions
4. Configuration changes require webview reload

## Common Tasks

### Adding a New Configuration Option
1. Add to `package.json` contributes.configuration.properties
2. Update `getWebviewContent()` in extension.ts to read the new setting
3. Update dashboard-template.html to use the new configuration
4. Add tests for the new configuration

### Debugging Webview Issues
1. Open Developer Tools on the webview (right-click → Inspect)
2. Check console for errors
3. Verify CSP headers aren't blocking resources
4. Test with both render modes to isolate issues

### Testing with Different Dashboards
Use the test server (`node test-dashboard-server.js`) or try:
- Local development servers (http://localhost:3000)
- Public dashboards that allow embedding
- Switch to fetch mode for sites that block iframes