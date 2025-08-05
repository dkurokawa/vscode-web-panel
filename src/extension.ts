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
			localResourceRoots: [
				this._extensionUri
			]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		// Read the HTML template file
		const htmlPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'dashboard-template.html');
		const htmlContent = fs.readFileSync(htmlPath.fsPath, 'utf8');
		
		// Get the user's configuration
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
				localResourceRoots: [extensionUri]
			}
		);

		DashboardPanel.currentPanel = new DashboardPanel(panel, extensionUri);
	}

	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		this._panel = panel;
		this._extensionUri = extensionUri;

		// Set the webview's initial html content
		this._update();

		// Listen for when the panel is disposed
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// Update the content based on view state changes
		this._panel.onDidChangeViewState(
			e => {
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
		const webview = this._panel.webview;
		this._panel.title = 'Dashboard Panel';
		this._panel.webview.html = this._getHtmlForWebview(webview);
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		// Read the HTML template file
		const htmlPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'dashboard-template.html');
		const htmlContent = fs.readFileSync(htmlPath.fsPath, 'utf8');
		
		// Get the user's configuration
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
}