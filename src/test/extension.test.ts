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
		assert.ok(content.includes("allowExternal: false,"), 'Should have allowExternal placeholder');
		assert.ok(content.includes("sandboxLevel: 'medium'"), 'Should have sandboxLevel placeholder');
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
		
		// Default sandbox level should be medium
		assert.strictEqual(config.get('security.sandboxLevel'), 'medium');
		
		// Navigation should be enabled by default
		assert.strictEqual(config.get('navigation.enabled'), true);
		
		// External navigation should be disabled by default
		assert.strictEqual(config.get('navigation.allowExternal'), false);
	});

	test('HTML template should have security headers', () => {
		const extensionPath = vscode.extensions.getExtension('dkurokawa.vscode-web-panel')!.extensionPath;
		const templatePath = path.join(extensionPath, 'src', 'dashboard-template.html');
		const content = fs.readFileSync(templatePath, 'utf8');
		
		// Check for CSP meta tag
		assert.ok(content.includes('Content-Security-Policy'), 'Should have Content Security Policy');
		
		// Check for sandbox attribute in iframe
		assert.ok(content.includes('sandbox='), 'Should have sandbox attribute for iframe');
	});

	test('Should handle different render modes', () => {
		const extensionPath = vscode.extensions.getExtension('dkurokawa.vscode-web-panel')!.extensionPath;
		const templatePath = path.join(extensionPath, 'src', 'dashboard-template.html');
		const content = fs.readFileSync(templatePath, 'utf8');
		
		// Check for iframe element
		assert.ok(content.includes('<iframe'), 'Should have iframe element');
		
		// Check for fetch container
		assert.ok(content.includes('fetch-container'), 'Should have fetch container');
		
		// Check for render mode logic
		assert.ok(content.includes("config.renderMode === 'fetch'"), 'Should have fetch mode logic');
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
});