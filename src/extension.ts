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
				this._extensionUri,
				vscode.Uri.file('/'), // Allow access to all local files
				vscode.Uri.file('/Users/kurokawadaisuke/projects') // Add specific project directory
			]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		// Webviewからのメッセージを処理
		webviewView.webview.onDidReceiveMessage(async (msg) => {
			// file://リクエストを受けて安全なURLに変換して返す
			if (msg && msg.type === 'resolveFileUrl' && msg.fileUrl) {
				try {
					// file://パスを抽出（file:// の後のパスを取得）
					let filePath = msg.fileUrl;
					if (filePath.startsWith('file://')) {
						// file:// を除去
						filePath = filePath.substring(7);
					}
					console.log('Converting file path:', filePath);
					const uri = vscode.Uri.file(filePath);
					const webviewUri = webviewView.webview.asWebviewUri(uri).toString();
					console.log('Converted to webview URI:', webviewUri);
					webviewView.webview.postMessage({ type: 'resolvedFileUrl', webviewUrl: webviewUri });
				} catch (e) {
					console.error('Error converting file URL:', e);
					webviewView.webview.postMessage({ type: 'resolvedFileUrl', webviewUrl: '' });
				}
			}
			// 外部URLをブラウザで開く
			else if (msg && msg.type === 'openExternal' && msg.url) {
				try {
					await vscode.env.openExternal(vscode.Uri.parse(msg.url));
				} catch (e) {
					console.error('Error opening external URL:', e);
				}
			}
		});
	}

	private _getHtmlForWebview(_webview: vscode.Webview) {
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
				localResourceRoots: [
					extensionUri, 
					vscode.Uri.file('/'),
					vscode.Uri.file('/Users/kurokawadaisuke/projects') // Add specific project directory
				]
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
		const webview = this._panel.webview;
		this._panel.title = 'Dashboard Panel';
		this._panel.webview.html = this._getHtmlForWebview(webview);

		// Webviewからのメッセージを処理
		webview.onDidReceiveMessage(async (msg) => {
			// file://リクエストを受けて安全なURLに変換して返す
			if (msg && msg.type === 'resolveFileUrl' && msg.fileUrl) {
				try {
					// file://パスを抽出（file:// の後のパスを取得）
					let filePath = msg.fileUrl;
					if (filePath.startsWith('file://')) {
						// file:// を除去
						filePath = filePath.substring(7);
					}
					console.log('Converting file path:', filePath);
					const uri = vscode.Uri.file(filePath);
					const webviewUri = webview.asWebviewUri(uri).toString();
					console.log('Converted to webview URI:', webviewUri);
					webview.postMessage({ type: 'resolvedFileUrl', webviewUrl: webviewUri });
				} catch (e) {
					console.error('Error converting file URL:', e);
					webview.postMessage({ type: 'resolvedFileUrl', webviewUrl: '' });
				}
			}
			// 外部URLをブラウザで開く
			else if (msg && msg.type === 'openExternal' && msg.url) {
				try {
					await vscode.env.openExternal(vscode.Uri.parse(msg.url));
				} catch (e) {
					console.error('Error opening external URL:', e);
				}
			}
		});
	}

	private _getHtmlForWebview(_webview: vscode.Webview) {
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