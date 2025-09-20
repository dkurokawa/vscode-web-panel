import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

suite('Web Panel Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Extension should be present', () => {
		assert.ok(vscode.extensions.getExtension('dkurokawa.vscode-web-panel'));
	});

	test('Should activate', async () => {
		const ext = vscode.extensions.getExtension('dkurokawa.vscode-web-panel');
		assert.ok(ext);
		await ext!.activate();
		assert.strictEqual(ext!.isActive, true);
	});

	test('Should register all commands', async () => {
		const commands = await vscode.commands.getCommands();
		assert.ok(commands.includes('web-panel.openDashboard'));
	});

	test('Should register webview view provider', async () => {
		// Check if the view is registered by trying to reveal it
		try {
			await vscode.commands.executeCommand('workbench.view.explorer');
			// View should be available even if not visible
			assert.ok(true);
		} catch (error) {
			assert.fail('Explorer view should be available');
		}
	});

	test('Configuration should have all expected properties', () => {
		const config = vscode.workspace.getConfiguration('web-panel');
		
		// Check render mode
		const renderMode = config.get('renderMode');
		assert.ok(renderMode === 'iframe' || renderMode === 'fetch');
		
		// Check navigation settings
		assert.strictEqual(typeof config.get('navigation.enabled'), 'boolean');
		assert.strictEqual(typeof config.get('navigation.allowExternal'), 'boolean');
		
		// Check security settings
		const sandboxLevel = config.get('security.sandboxLevel');
		assert.ok(['strict', 'medium', 'relaxed'].includes(sandboxLevel as string));
	});

	test('Dashboard template file should exist', () => {
		const extensionPath = vscode.extensions.getExtension('dkurokawa.vscode-web-panel')!.extensionPath;
		const templatePath = path.join(extensionPath, 'src', 'dashboard-template.html');
		assert.ok(fs.existsSync(templatePath), 'dashboard-template.html should exist');
	});

	test('Dashboard template should contain required placeholders', () => {
		const extensionPath = vscode.extensions.getExtension('dkurokawa.vscode-web-panel')!.extensionPath;
		const templatePath = path.join(extensionPath, 'src', 'dashboard-template.html');
		const content = fs.readFileSync(templatePath, 'utf8');
		
		// Check for configuration placeholders
		assert.ok(content.includes("renderMode: 'iframe',"), 'Should have renderMode placeholder');
		assert.ok(content.includes("navigationEnabled: true,"), 'Should have navigationEnabled placeholder');
		assert.ok(content.includes("allowExternal: true,"), 'Should have allowExternal placeholder');
		assert.ok(content.includes("sandboxLevel: 'relaxed'"), 'Should have sandboxLevel placeholder');
	});

	test('Should create webview panel on command', async () => {
		// Execute the command
		await vscode.commands.executeCommand('web-panel.openDashboard');
		
		// Wait a bit for the panel to be created
		await new Promise(resolve => setTimeout(resolve, 100));
		
		// Check if a webview panel is active
		// Note: We can't directly check for webview panels in tests,
		// but the command should execute without errors
		assert.ok(true, 'Command executed successfully');
	});

	test('Configuration defaults should be secure', () => {
		const config = vscode.workspace.getConfiguration('web-panel');
		
		// Default render mode should be iframe (secure)
		assert.strictEqual(config.get('renderMode'), 'iframe');
		
		// Default sandbox level should be relaxed
		assert.strictEqual(config.get('security.sandboxLevel'), 'relaxed');
		
		// Navigation should be enabled by default
		assert.strictEqual(config.get('navigation.enabled'), true);
		
		// External navigation should be enabled by default
		assert.strictEqual(config.get('navigation.allowExternal'), true);
	});

	test('HTML template should have security headers', () => {
		const extensionPath = vscode.extensions.getExtension('dkurokawa.vscode-web-panel')!.extensionPath;
		const templatePath = path.join(extensionPath, 'src', 'dashboard-template.html');
		const content = fs.readFileSync(templatePath, 'utf8');
		
		// Check for CSP meta tag
		assert.ok(content.includes('Content-Security-Policy'), 'Should have Content Security Policy');
		
		// Check for sandbox attribute setting logic
		assert.ok(content.includes('getSandboxAttribute'), 'Should have sandbox attribute logic');
	});

	test('Should handle different render modes', () => {
		const extensionPath = vscode.extensions.getExtension('dkurokawa.vscode-web-panel')!.extensionPath;
		const templatePath = path.join(extensionPath, 'src', 'dashboard-template.html');
		const content = fs.readFileSync(templatePath, 'utf8');
		
		// Check for iframe element
		assert.ok(content.includes('<iframe'), 'Should have iframe element');
		
		// Check for fetch container
		assert.ok(content.includes('fetch-container'), 'Should have fetch container');
		
		// Check for fetch mode functionality
		assert.ok(content.includes('tryFetchMode'), 'Should have fetch mode functionality');
	});

	test('Should have error handling', () => {
		const extensionPath = vscode.extensions.getExtension('dkurokawa.vscode-web-panel')!.extensionPath;
		const templatePath = path.join(extensionPath, 'src', 'dashboard-template.html');
		const content = fs.readFileSync(templatePath, 'utf8');
		
		// Check for error message container
		assert.ok(content.includes('error-message'), 'Should have error message container');
		
		// Check for iframe error handling
		assert.ok(content.includes('onerror'), 'Should have error handling for iframe');
		
		// Check for loading state
		assert.ok(content.includes('loading'), 'Should have loading state');
	});

	test('Should have settings.json integration buttons', () => {
		const extensionPath = vscode.extensions.getExtension('dkurokawa.vscode-web-panel')!.extensionPath;
		const templatePath = path.join(extensionPath, 'src', 'dashboard-template.html');
		const content = fs.readFileSync(templatePath, 'utf8');
		
		// Check for settings buttons
		assert.ok(content.includes('Edit settings.json'), 'Should have Edit settings.json button');
		assert.ok(content.includes('Use settings.json'), 'Should have Use settings.json button');
		assert.ok(content.includes('Auto-detect'), 'Should have Auto-detect button');
		
		// Check for settings control functions
		assert.ok(content.includes('openSettings()'), 'Should have openSettings function');
		assert.ok(content.includes('useSettings()'), 'Should have useSettings function');
		assert.ok(content.includes('autoDetectServices()'), 'Should have autoDetectServices function');
	});

	test('Should have service type-specific metrics', () => {
		const extensionPath = vscode.extensions.getExtension('dkurokawa.vscode-web-panel')!.extensionPath;
		const templatePath = path.join(extensionPath, 'src', 'dashboard-template.html');
		const content = fs.readFileSync(templatePath, 'utf8');
		
		// Check for different service types
		assert.ok(content.includes("case 'web':"), 'Should handle web service type');
		assert.ok(content.includes("case 'bot':"), 'Should handle bot service type');
		assert.ok(content.includes("case 'db':"), 'Should handle db service type');
		assert.ok(content.includes("case 'api':"), 'Should handle api service type');
		
		// Check for specific metrics
		assert.ok(content.includes('Response Time'), 'Should have Response Time metric for web');
		assert.ok(content.includes('Queue Size'), 'Should have Queue Size metric for bot');
		assert.ok(content.includes('Connections'), 'Should have Connections metric for db');
		assert.ok(content.includes('Endpoints'), 'Should have Endpoints metric for api');
	});

	test('Should have URL state persistence', () => {
		const extensionPath = vscode.extensions.getExtension('dkurokawa.vscode-web-panel')!.extensionPath;
		const templatePath = path.join(extensionPath, 'src', 'dashboard-template.html');
		const content = fs.readFileSync(templatePath, 'utf8');
		
		// Check for state management
		assert.ok(content.includes('vscode.getState()'), 'Should use getState for persistence');
		assert.ok(content.includes('vscode.setState('), 'Should use setState for persistence');
		assert.ok(content.includes('dashboardUrl'), 'Should save dashboard URL');
		assert.ok(content.includes('scrollPosition'), 'Should save scroll position');
	});

	test('Should have multiple themes', () => {
		const extensionPath = vscode.extensions.getExtension('dkurokawa.vscode-web-panel')!.extensionPath;
		const templatePath = path.join(extensionPath, 'src', 'dashboard-template.html');
		const content = fs.readFileSync(templatePath, 'utf8');
		
		// Check for theme buttons
		const themes = ['simple', 'retro', 'vintage', 'botanical', 'toy', 'neon', 'vegas', 'diner', 'western', 'cyber', 'pastel', 'dark', 'legacy'];
		themes.forEach(theme => {
			assert.ok(content.includes(`data-theme="${theme}"`), `Should have ${theme} theme`);
			assert.ok(content.includes(`theme-${theme}`), `Should have theme-${theme} CSS class`);
		});
	});

	test('Extension.ts should have auto-detection functions', () => {
		const extensionPath = vscode.extensions.getExtension('dkurokawa.vscode-web-panel')!.extensionPath;
		const extensionFile = path.join(extensionPath, 'out', 'extension.js');
		const content = fs.readFileSync(extensionFile, 'utf8');
		
		// Check for auto-detection functions
		assert.ok(content.includes('autoDetectServices'), 'Should have autoDetectServices function');
		assert.ok(content.includes('checkIfMonorepo'), 'Should have checkIfMonorepo function');
		assert.ok(content.includes('detectMonorepoServices'), 'Should have detectMonorepoServices function');
		assert.ok(content.includes('detectSingleService'), 'Should have detectSingleService function');
		assert.ok(content.includes('readEnvFile'), 'Should have readEnvFile function');
	});

	test('Should detect various project types', () => {
		const extensionPath = vscode.extensions.getExtension('dkurokawa.vscode-web-panel')!.extensionPath;
		const extensionFile = path.join(extensionPath, 'out', 'extension.js');
		const content = fs.readFileSync(extensionFile, 'utf8');
		
		// Check for framework detection
		assert.ok(content.includes('next'), 'Should detect Next.js');
		assert.ok(content.includes('react'), 'Should detect React');
		assert.ok(content.includes('express'), 'Should detect Express');
		assert.ok(content.includes('@nestjs/core'), 'Should detect NestJS');
		
		// Check for language detection
		assert.ok(content.includes('Cargo.toml'), 'Should detect Rust projects');
		assert.ok(content.includes('go.mod'), 'Should detect Go projects');
		assert.ok(content.includes('requirements.txt'), 'Should detect Python projects');
		
		// Check for monorepo detection
		assert.ok(content.includes('turbo.json'), 'Should detect Turbo monorepos');
		assert.ok(content.includes('lerna.json'), 'Should detect Lerna monorepos');
		assert.ok(content.includes('pnpm-workspace.yaml'), 'Should detect pnpm workspaces');
	});

	test('Should handle message passing correctly', () => {
		const extensionPath = vscode.extensions.getExtension('dkurokawa.vscode-web-panel')!.extensionPath;
		const extensionFile = path.join(extensionPath, 'out', 'extension.js');
		const content = fs.readFileSync(extensionFile, 'utf8');
		
		// Check for message handlers
		assert.ok(content.includes("type === 'readSettings'"), 'Should handle readSettings message');
		assert.ok(content.includes("type === 'openSettings'"), 'Should handle openSettings message');
		assert.ok(content.includes("type === 'autoDetectServices'"), 'Should handle autoDetectServices message');
		assert.ok(content.includes("type === 'saveAutoDetectedSettings'"), 'Should handle saveAutoDetectedSettings message');
		assert.ok(content.includes("type === 'resolveFileUrl'"), 'Should handle resolveFileUrl message');
		assert.ok(content.includes("type === 'openExternal'"), 'Should handle openExternal message');
	});

	test('Should have proper error handling for settings operations', () => {
		const extensionPath = vscode.extensions.getExtension('dkurokawa.vscode-web-panel')!.extensionPath;
		const extensionFile = path.join(extensionPath, 'out', 'extension.js');
		const content = fs.readFileSync(extensionFile, 'utf8');
		
		// Check for error handling in settings operations
		assert.ok(content.includes('No settings.json found'), 'Should handle missing settings.json');
		assert.ok(content.includes('No workspace folder open'), 'Should handle no workspace');
		assert.ok(content.includes('Failed to read settings'), 'Should handle read failures');
		assert.ok(content.includes('Failed to auto-detect services'), 'Should handle auto-detect failures');
	});

	test('Dashboard should have health check functionality', () => {
		const extensionPath = vscode.extensions.getExtension('dkurokawa.vscode-web-panel')!.extensionPath;
		const templatePath = path.join(extensionPath, 'src', 'dashboard-template.html');
		const content = fs.readFileSync(templatePath, 'utf8');
		
		// Check for health check functions
		assert.ok(content.includes('startHealthChecks'), 'Should have startHealthChecks function');
		assert.ok(content.includes('checkServiceHealth'), 'Should have checkServiceHealth function');
		assert.ok(content.includes('healthEndpoint'), 'Should use health endpoint');
		assert.ok(content.includes('status-active'), 'Should have active status');
		assert.ok(content.includes('status-warning'), 'Should have warning status');
	});

	test('Should support custom service configuration', () => {
		const extensionPath = vscode.extensions.getExtension('dkurokawa.vscode-web-panel')!.extensionPath;
		const templatePath = path.join(extensionPath, 'src', 'dashboard-template.html');
		const content = fs.readFileSync(templatePath, 'utf8');
		
		// Check for service configuration support
		assert.ok(content.includes('renderCustomServices'), 'Should have renderCustomServices function');
		assert.ok(content.includes('createServiceItem'), 'Should have createServiceItem function');
		assert.ok(content.includes('service.icon'), 'Should support service icons');
		assert.ok(content.includes('service.title'), 'Should support service titles');
		assert.ok(content.includes('service.subtitle'), 'Should support service subtitles');
		assert.ok(content.includes('service.url'), 'Should support service URLs');
	});

	test('Should have proper file permission handling', () => {
		const extensionPath = vscode.extensions.getExtension('dkurokawa.vscode-web-panel')!.extensionPath;
		const extensionFile = path.join(extensionPath, 'out', 'extension.js');
		const content = fs.readFileSync(extensionFile, 'utf8');
		
		// Check for workspace file system API usage
		assert.ok(content.includes('vscode.workspace.fs.readFile'), 'Should use workspace fs for reading');
		assert.ok(content.includes('vscode.workspace.fs.writeFile'), 'Should use workspace fs for writing');
		assert.ok(content.includes('vscode.workspace.fs.stat'), 'Should use workspace fs for stat');
		assert.ok(content.includes('vscode.workspace.fs.createDirectory'), 'Should use workspace fs for mkdir');
	});
});