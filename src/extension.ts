import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

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

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
		
export function activate(context: vscode.ExtensionContext) {
	console.log('WebPanel extension is now active!');

	// Register webview view provider for sidebar
	const provider = new WebPanelViewProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider('webpanel.webView', provider)
	);

	// Register command to open web panel
	const disposable = vscode.commands.registerCommand('webpanel.openWebPanel', () => {
		WebPanel.createOrShow(context.extensionUri);
	});

	context.subscriptions.push(disposable);
}
		} catch (error) {
export function deactivate() {}
			// Fallback: return basic error page
/**
 * Provider for webpanel webview view in sidebar
 */
class WebPanelViewProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = 'webpanel.webView';

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
		// ...existing code...
	}
}
class DashboardPanel {
/**
 * Manages webpanel webview panels
 */
class WebPanel {
	public static currentPanel: WebPanel | undefined;
	public static readonly viewType = 'webpanel.webPanel';

	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
	private _disposables: vscode.Disposable[] = [];

	public static createOrShow(extensionUri: vscode.Uri) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		// If we already have a panel, show it
		if (WebPanel.currentPanel) {
			WebPanel.currentPanel._panel.reveal(column);
			return;
		}

		// Otherwise, create a new panel
		const panel = vscode.window.createWebviewPanel(
			WebPanel.viewType,
			'WebPanel',
			column || vscode.ViewColumn.One,
			{
				enableScripts: true,
				retainContextWhenHidden: true,
			}
		);

		WebPanel.currentPanel = new WebPanel(panel, extensionUri);
	}

	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		this._panel = panel;
		this._extensionUri = extensionUri;

		// Set the webview's initial html content
		this._update();

		// Listen for when the panel is disposed
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
	}

	public dispose() {
		WebPanel.currentPanel = undefined;

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
		this._panel.title = 'WebPanel';
		this._panel.webview.html = this._getHtmlForWebview(webview);
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		// ...existing code...
	}
}
		body {
			padding: 20px;
			font-family: var(--vscode-font-family);
			background-color: var(--vscode-editor-background);
			color: var(--vscode-editor-foreground);
		}
		.dashboard-container {
			width: 100%;
			height: 80vh;
			border: 1px solid var(--vscode-panel-border);
			border-radius: 4px;
			overflow: hidden;
		}
		iframe {
			width: 100%;
			height: 100%;
			border: none;
		}
		.status {
			margin-bottom: 10px;
			padding: 10px;
			background-color: var(--vscode-textBlockQuote-background);
			border-left: 4px solid var(--vscode-textBlockQuote-border);
		}
		.loading {
			display: flex;
			align-items: center;
			justify-content: center;
			height: 200px;
			font-size: 16px;
		}
	</style>
</head>
<body>
	<h1>Dashboard Panel</h1>
	<div class="status">
		<strong>Target:</strong> http://localhost:3019/dashboard
	</div>
	<div class="dashboard-container">
		<div class="loading" id="loading">
			Loading dashboard from localhost:3019...
		</div>
		<iframe 
			id="dashboard-frame" 
			src="http://localhost:3019/dashboard"
			style="display: none;"
			onload="document.getElementById('loading').style.display='none'; this.style.display='block';"
			onerror="document.getElementById('loading').innerHTML='Failed to load dashboard. Make sure service is running on port 3019.';">
		</iframe>
	</div>
	
	<script>
		// Handle iframe load errors
		setTimeout(() => {
			const iframe = document.getElementById('dashboard-frame');
			const loading = document.getElementById('loading');
			
			// If iframe hasn't loaded after 5 seconds, show error
			if (iframe.style.display === 'none') {
				loading.innerHTML = '❌ Could not connect to localhost:3019/dashboard<br>Please make sure your dashboard service is running.';
			}
		}, 5000);
	</script>
</body>
</html>`;
	}
}
