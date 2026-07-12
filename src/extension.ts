import * as vscode from 'vscode';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
	console.log('Web Panel extension is now active!');

	// Register webview view provider for sidebar
	const provider = new DashboardViewProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider('web-panel.dashboardView', provider)
	);

	// Register command to open dashboard panel
	const disposable = vscode.commands.registerCommand('web-panel.openDashboard', () => {
		DashboardPanel.createOrShow(context.extensionUri);
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}

/**
 * Build the set of local resource roots the webview is allowed to read from.
 * Limited to the extension's own files plus any open workspace folders so the
 * webview cannot read arbitrary files on disk.
 */
function getLocalResourceRoots(extensionUri: vscode.Uri): vscode.Uri[] {
	const roots: vscode.Uri[] = [extensionUri];
	for (const folder of vscode.workspace.workspaceFolders ?? []) {
		roots.push(folder.uri);
	}
	return roots;
}

/**
 * Read the dashboard HTML template and inject the user's configuration.
 * Shared by the sidebar view and the editor panel.
 */
function getDashboardHtml(extensionUri: vscode.Uri): string {
	const htmlPath = vscode.Uri.joinPath(extensionUri, 'src', 'dashboard-template.html');
	const htmlContent = fs.readFileSync(htmlPath.fsPath, 'utf8');

	const config = vscode.workspace.getConfiguration('web-panel');
	const renderMode = config.get<string>('renderMode', 'iframe');
	const navigationEnabled = config.get<boolean>('navigation.enabled', true);
	const allowExternal = config.get<boolean>('navigation.allowExternal', false);
	const sandboxLevel = config.get<string>('security.sandboxLevel', 'medium');

	// Replace configuration placeholders in the JavaScript config object
	return htmlContent
		.replace('renderMode: \'iframe\',', `renderMode: '${renderMode}',`)
		.replace('navigationEnabled: true,', `navigationEnabled: ${navigationEnabled},`)
		.replace('allowExternal: false,', `allowExternal: ${allowExternal},`)
		.replace('sandboxLevel: \'medium\'', `sandboxLevel: '${sandboxLevel}'`);
}

const DEFAULT_SERVICES = {
	"web-panel.services": [
		{ "icon": "🌐", "title": "My Web Service", "subtitle": "Main application server", "type": "web", "url": "http://localhost:3000", "healthEndpoint": "/health" },
		{ "icon": "🤖", "title": "Bot Service", "subtitle": "Background worker", "type": "bot", "url": "http://localhost:3001", "healthEndpoint": "/health" },
		{ "icon": "🗄️", "title": "Database", "subtitle": "PostgreSQL main database", "type": "db", "url": "http://localhost:5432", "healthEndpoint": "/health" },
		{ "icon": "🔌", "title": "API Gateway", "subtitle": "REST API endpoints", "type": "api", "url": "http://localhost:8080", "healthEndpoint": "/health" }
	]
};

/**
 * Handle a message posted from the dashboard webview.
 * Shared by the sidebar view and the editor panel so both behave identically.
 */
async function handleWebviewMessage(webview: vscode.Webview, msg: any): Promise<void> {
	// Convert file:// requests to safe URLs and return
	if (msg && msg.type === 'resolveFileUrl' && msg.fileUrl) {
		try {
			let filePath = msg.fileUrl;
			if (filePath.startsWith('file://')) {
				filePath = filePath.substring(7);
			}
			const uri = vscode.Uri.file(filePath);
			const webviewUri = webview.asWebviewUri(uri).toString();
			webview.postMessage({ type: 'resolvedFileUrl', webviewUrl: webviewUri });
		} catch (e) {
			console.error('Error converting file URL:', e);
			webview.postMessage({ type: 'resolvedFileUrl', webviewUrl: '' });
		}
	}
	// Open external URL in browser
	else if (msg && msg.type === 'openExternal' && msg.url) {
		try {
			await vscode.env.openExternal(vscode.Uri.parse(msg.url));
		} catch (e) {
			console.error('Error opening external URL:', e);
		}
	}
	// Read settings.json
	else if (msg && msg.type === 'readSettings') {
		try {
			const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
			if (workspaceFolder) {
				const settingsPath = vscode.Uri.joinPath(workspaceFolder.uri, '.vscode', 'settings.json');
				try {
					const settingsContent = await vscode.workspace.fs.readFile(settingsPath);
					const settingsText = Buffer.from(settingsContent).toString('utf8');
					webview.postMessage({ type: 'settingsData', settings: settingsText });
				} catch (e) {
					webview.postMessage({ type: 'settingsData', settings: null, error: 'No settings.json found' });
				}
			} else {
				webview.postMessage({ type: 'settingsData', settings: null, error: 'No workspace folder open' });
			}
		} catch (e) {
			console.error('Error reading settings:', e);
			webview.postMessage({ type: 'settingsData', settings: null, error: 'Failed to read settings' });
		}
	}
	// Open settings.json in editor
	else if (msg && msg.type === 'openSettings') {
		try {
			const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
			if (workspaceFolder) {
				const settingsPath = vscode.Uri.joinPath(workspaceFolder.uri, '.vscode', 'settings.json');
				// Create default settings if file doesn't exist
				try {
					await vscode.workspace.fs.stat(settingsPath);
				} catch {
					const vscodePath = vscode.Uri.joinPath(workspaceFolder.uri, '.vscode');
					try {
						await vscode.workspace.fs.createDirectory(vscodePath);
					} catch {}

					const settingsContent = JSON.stringify(DEFAULT_SERVICES, null, 4);
					await vscode.workspace.fs.writeFile(settingsPath, Buffer.from(settingsContent, 'utf8'));
				}

				const document = await vscode.workspace.openTextDocument(settingsPath);
				await vscode.window.showTextDocument(document);
			}
		} catch (e) {
			console.error('Error opening settings:', e);
		}
	}
	// Auto-detect services
	else if (msg && msg.type === 'autoDetectServices') {
		try {
			const services = await autoDetectServices();
			webview.postMessage({ type: 'detectedServices', services });
		} catch (e) {
			console.error('Error auto-detecting services:', e);
			webview.postMessage({ type: 'detectedServices', services: [], error: 'Failed to auto-detect services' });
		}
	}
	// Save auto-detected settings
	else if (msg && msg.type === 'saveAutoDetectedSettings' && msg.settings) {
		try {
			const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
			if (workspaceFolder) {
				const settingsPath = vscode.Uri.joinPath(workspaceFolder.uri, '.vscode', 'settings.json');

				const vscodePath = vscode.Uri.joinPath(workspaceFolder.uri, '.vscode');
				try {
					await vscode.workspace.fs.createDirectory(vscodePath);
				} catch {}

				let existingSettings: any = {};
				try {
					const existingContent = await vscode.workspace.fs.readFile(settingsPath);
					existingSettings = JSON.parse(Buffer.from(existingContent).toString('utf8'));
				} catch {}

				const newSettings = JSON.parse(msg.settings);
				const mergedSettings = { ...existingSettings, ...newSettings };

				const settingsContent = JSON.stringify(mergedSettings, null, 4);
				await vscode.workspace.fs.writeFile(settingsPath, Buffer.from(settingsContent, 'utf8'));

				vscode.window.showInformationMessage('Auto-detected services saved to settings.json');
			}
		} catch (e) {
			console.error('Error saving auto-detected settings:', e);
			vscode.window.showErrorMessage('Failed to save auto-detected settings');
		}
	}
}

/**
 * Provider for dashboard webview view in sidebar
 */
class DashboardViewProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = 'web-panel.dashboardView';

	private _view?: vscode.WebviewView;

	constructor(
		private readonly _extensionUri: vscode.Uri,
	) { }

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		this._view = webviewView;

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: getLocalResourceRoots(this._extensionUri)
		};

		webviewView.webview.html = getDashboardHtml(this._extensionUri);

		// Handle messages from webview
		webviewView.webview.onDidReceiveMessage((msg) => handleWebviewMessage(webviewView.webview, msg));
	}
}

/**
 * Manages dashboard webview panels
 */
class DashboardPanel {
	public static currentPanel: DashboardPanel | undefined;
	public static readonly viewType = 'web-panel.dashboardPanel';

	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
	private _disposables: vscode.Disposable[] = [];

	public static createOrShow(extensionUri: vscode.Uri) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		// If we already have a panel, show it
		if (DashboardPanel.currentPanel) {
			DashboardPanel.currentPanel._panel.reveal(column);
			return;
		}

		// Otherwise, create a new panel
		const panel = vscode.window.createWebviewPanel(
			DashboardPanel.viewType,
			'Dashboard Panel',
			column || vscode.ViewColumn.One,
			{
				enableScripts: true,
				retainContextWhenHidden: true,
				localResourceRoots: getLocalResourceRoots(extensionUri)
			}
		);

		DashboardPanel.currentPanel = new DashboardPanel(panel, extensionUri);
	}

	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		this._panel = panel;
		this._extensionUri = extensionUri;

		// Set the webview's initial html content
		this._update();

		// Register the message handler once for the lifetime of the panel.
		// (Previously this lived in _update() and leaked a new listener on every
		// view-state change.)
		this._panel.webview.onDidReceiveMessage(
			(msg) => handleWebviewMessage(this._panel.webview, msg),
			null,
			this._disposables
		);

		// Listen for when the panel is disposed
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// Refresh the content when the panel becomes visible again
		this._panel.onDidChangeViewState(
			_e => {
				if (this._panel.visible) {
					this._update();
				}
			},
			null,
			this._disposables
		);
	}

	public dispose() {
		DashboardPanel.currentPanel = undefined;

		// Clean up our resources
		this._panel.dispose();

		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

	private _update() {
		this._panel.title = 'Dashboard Panel';
		this._panel.webview.html = getDashboardHtml(this._extensionUri);
	}
}

// Auto-detect services in the workspace
async function autoDetectServices(): Promise<any[]> {
	const services: any[] = [];
	const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
	if (!workspaceFolder) {
		return services;
	}

	try {
		// Check if it's a monorepo
		const isMonorepo = await checkIfMonorepo(workspaceFolder.uri);
		
		if (isMonorepo) {
			// Detect services in monorepo
			services.push(...await detectMonorepoServices(workspaceFolder.uri));
		} else {
			// Detect single service
			const service = await detectSingleService(workspaceFolder.uri, '');
			if (service) {
				services.push(service);
			}
		}
		
		return services;
	} catch (e) {
		console.error('Error in autoDetectServices:', e);
		return services;
	}
}

// Check if the project is a monorepo
async function checkIfMonorepo(rootUri: vscode.Uri): Promise<boolean> {
	try {
		// Check for common monorepo indicators
		const indicators = [
			'lerna.json',
			'pnpm-workspace.yaml',
			'rush.json',
			'nx.json',
			'turbo.json'
		];
		
		for (const indicator of indicators) {
			try {
				await vscode.workspace.fs.stat(vscode.Uri.joinPath(rootUri, indicator));
				return true;
			} catch {}
		}
		
		// Check for common monorepo directories
		const dirs = ['packages', 'apps', 'services'];
		for (const dir of dirs) {
			try {
				const dirUri = vscode.Uri.joinPath(rootUri, dir);
				const dirStat = await vscode.workspace.fs.stat(dirUri);
				if (dirStat.type === vscode.FileType.Directory) {
					return true;
				}
			} catch {}
		}
		
		// Check if package.json has workspaces
		try {
			const packageJson = await readJsonFile(vscode.Uri.joinPath(rootUri, 'package.json'));
			if (packageJson.workspaces) {
				return true;
			}
		} catch {}
		
		return false;
	} catch {
		return false;
	}
}

// Detect services in a monorepo
async function detectMonorepoServices(rootUri: vscode.Uri): Promise<any[]> {
	const services: any[] = [];
	
	// Common monorepo directories
	const monoDirs = ['packages', 'apps', 'services', 'api', 'web'];
	
	for (const dir of monoDirs) {
		try {
			const dirUri = vscode.Uri.joinPath(rootUri, dir);
			const entries = await vscode.workspace.fs.readDirectory(dirUri);
			
			for (const [name, type] of entries) {
				if (type === vscode.FileType.Directory) {
					const service = await detectSingleService(vscode.Uri.joinPath(dirUri, name), name);
					if (service) {
						services.push(service);
					}
				}
			}
		} catch {}
	}
	
	return services;
}

// Detect a single service
async function detectSingleService(serviceUri: vscode.Uri, serviceName: string): Promise<any | null> {
	try {
		const projectName = serviceName || vscode.workspace.name || 'Service';
		let type = 'web'; // default
		let port = 3000; // default
		let icon = '🌐'; // default
		
		// Read .env file for port
		const envData = await readEnvFile(serviceUri);
		if (envData.PORT) {
			port = parseInt(envData.PORT) || port;
		}
		
		// Check package.json
		try {
			const packageJson = await readJsonFile(vscode.Uri.joinPath(serviceUri, 'package.json'));
			
			// Detect type based on dependencies
			const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
			
			// Framework detection
			if (deps['next'] || deps['react'] || deps['vue'] || deps['@angular/core'] || deps['svelte']) {
				type = 'web';
				icon = '🌐';
			} else if (deps['express'] || deps['fastify'] || deps['@nestjs/core'] || deps['koa'] || deps['hapi']) {
				type = 'api';
				icon = '🔌';
			} else if (deps['bull'] || deps['bullmq'] || deps['node-cron'] || deps['agenda']) {
				type = 'bot';
				icon = '🤖';
			} else if (deps['typeorm'] || deps['sequelize'] || deps['prisma'] || deps['mongoose']) {
				// Has ORM but check if it's mainly a DB service
				if (packageJson.name && packageJson.name.includes('db')) {
					type = 'db';
					icon = '🗄️';
				}
			}
			
			// Override with scripts detection
			if (packageJson.scripts) {
				if (packageJson.scripts.dev && packageJson.scripts.dev.includes('next')) {
					type = 'web';
					port = envData.PORT || 3000;
				} else if (packageJson.scripts.start && packageJson.scripts.start.includes('node')) {
					type = 'api';
					port = envData.PORT || 3001;
				}
			}
			
			// Use package name as service name if available
			if (packageJson.name) {
				serviceName = packageJson.name.split('/').pop() || serviceName;
			}
		} catch {}
		
		// Check for other project files
		try {
			// Rust project
			await vscode.workspace.fs.stat(vscode.Uri.joinPath(serviceUri, 'Cargo.toml'));
			type = 'api';
			icon = '🦀';
			port = envData.PORT || 8080;
		} catch {}
		
		try {
			// Go project
			await vscode.workspace.fs.stat(vscode.Uri.joinPath(serviceUri, 'go.mod'));
			type = 'api';
			icon = '🐹';
			port = envData.PORT || 8080;
		} catch {}
		
		try {
			// Python project
			const pyFiles = ['requirements.txt', 'Pipfile', 'pyproject.toml'];
			for (const pyFile of pyFiles) {
				try {
					await vscode.workspace.fs.stat(vscode.Uri.joinPath(serviceUri, pyFile));
					type = 'api';
					icon = '🐍';
					port = envData.PORT || 5000;
					break;
				} catch {}
			}
		} catch {}
		
		// Check docker-compose.yml for services
		try {
			const dockerCompose = await readYamlFile(vscode.Uri.joinPath(serviceUri, 'docker-compose.yml'));
			if (dockerCompose.services) {
				// Look for database services
				for (const [serviceName, config] of Object.entries(dockerCompose.services)) {
					if (serviceName.includes('postgres') || serviceName.includes('mysql') || serviceName.includes('mongo') || serviceName.includes('redis')) {
						type = 'db';
						icon = '🗄️';
						port = 5432; // Default PostgreSQL port
					}
				}
			}
		} catch {}
		
		// Generate service config
		return {
			icon,
			title: formatServiceName(serviceName || projectName),
			subtitle: `${type.charAt(0).toUpperCase() + type.slice(1)} service on port ${port}`,
			type,
			url: `http://localhost:${port}`,
			healthEndpoint: '/health'
		};
		
	} catch (e) {
		console.error('Error detecting service:', e);
		return null;
	}
}

// Read and parse .env file
async function readEnvFile(uri: vscode.Uri): Promise<any> {
	const envData: any = {};
	
	try {
		const envPath = vscode.Uri.joinPath(uri, '.env');
		const content = await vscode.workspace.fs.readFile(envPath);
		const lines = Buffer.from(content).toString('utf8').split('\n');
		
		for (const line of lines) {
			const trimmed = line.trim();
			if (trimmed && !trimmed.startsWith('#')) {
				const [key, value] = trimmed.split('=');
				if (key && value) {
					envData[key.trim()] = value.trim().replace(/["']/g, '');
				}
			}
		}
	} catch {}
	
	// Also check .env.local
	try {
		const envLocalPath = vscode.Uri.joinPath(uri, '.env.local');
		const content = await vscode.workspace.fs.readFile(envLocalPath);
		const lines = Buffer.from(content).toString('utf8').split('\n');
		
		for (const line of lines) {
			const trimmed = line.trim();
			if (trimmed && !trimmed.startsWith('#')) {
				const [key, value] = trimmed.split('=');
				if (key && value) {
					envData[key.trim()] = value.trim().replace(/["']/g, '');
				}
			}
		}
	} catch {}
	
	return envData;
}

// Read and parse JSON file
async function readJsonFile(uri: vscode.Uri): Promise<any> {
	const content = await vscode.workspace.fs.readFile(uri);
	return JSON.parse(Buffer.from(content).toString('utf8'));
}

// Read and parse YAML file (simple implementation)
async function readYamlFile(uri: vscode.Uri): Promise<any> {
	const content = await vscode.workspace.fs.readFile(uri);
	const text = Buffer.from(content).toString('utf8');
	
	// Very basic YAML parsing for docker-compose
	// This is not a full YAML parser but works for simple cases
	const result: any = {};
	const lines = text.split('\n');
	let currentSection: string | null = null;
	let currentService: string | null = null;
	
	for (const line of lines) {
		const trimmed = line.trim();
		if (trimmed === 'services:') {
			currentSection = 'services';
			result.services = {};
		} else if (currentSection === 'services' && trimmed && !trimmed.startsWith('-')) {
			if (line.match(/^\s{2}\w+:/)) {
				currentService = trimmed.replace(':', '');
				result.services[currentService] = {};
			}
		}
	}
	
	return result;
}

// Format service name for display
function formatServiceName(name: string): string {
	// Remove common prefixes
	name = name.replace(/^@[\w-]+\//, ''); // Remove npm scope
	
	// Convert kebab-case or snake_case to Title Case
	return name
		.replace(/[-_]/g, ' ')
		.split(' ')
		.map(word => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}
