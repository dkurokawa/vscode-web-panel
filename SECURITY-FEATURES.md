# Security Features for Web Panel

## Proposed Security Settings

### 1. Content Security Policy (CSP)
Add CSP headers to control what resources can be loaded:

```typescript
// In extension.ts
const csp = webview.cspSource;
const nonce = getNonce();

// Strict CSP - only allow same-origin
const strictCSP = `
    default-src 'none';
    frame-src ${csp} https: http:;
    img-src ${csp} https: http: data:;
    script-src 'nonce-${nonce}';
    style-src ${csp} 'unsafe-inline';
`;

// Relaxed CSP - allow external resources
const relaxedCSP = `
    default-src 'none';
    frame-src *;
    img-src * data:;
    script-src 'unsafe-inline' 'unsafe-eval' *;
    style-src 'unsafe-inline' *;
`;
```

### 2. Sandbox Attributes for iframe
Control what the embedded content can do:

```html
<!-- Strict sandbox - very limited -->
<iframe 
    sandbox="allow-scripts allow-same-origin"
    src="...">
</iframe>

<!-- Medium sandbox - allow forms and popups within frame -->
<iframe 
    sandbox="allow-scripts allow-same-origin allow-forms allow-popups-to-escape-sandbox"
    src="...">
</iframe>

<!-- Relaxed sandbox - most features allowed -->
<iframe 
    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
    src="...">
</iframe>
```

### 3. Navigation Control
Intercept and control navigation:

```javascript
// Block all external navigation
window.addEventListener('click', (e) => {
    const target = e.target;
    if (target.tagName === 'A' && target.href) {
        if (!isAllowedDomain(target.href)) {
            e.preventDefault();
            showBlockedMessage();
        }
    }
});

// Domain whitelist
const allowedDomains = [
    'localhost',
    '127.0.0.1',
    'github.com',
    // User-configured domains
];
```

### 4. Configuration Settings
Add these to package.json:

```json
"contributes": {
    "configuration": {
        "title": "Web Panel",
        "properties": {
            "web-panel.security.level": {
                "type": "string",
                "enum": ["strict", "medium", "relaxed"],
                "default": "medium",
                "description": "Security level for web content"
            },
            "web-panel.security.allowedDomains": {
                "type": "array",
                "default": ["localhost", "127.0.0.1"],
                "description": "List of allowed domains"
            },
            "web-panel.security.blockExternalNavigation": {
                "type": "boolean",
                "default": true,
                "description": "Block navigation to external sites"
            },
            "web-panel.security.sandboxMode": {
                "type": "string",
                "enum": ["strict", "medium", "relaxed", "none"],
                "default": "medium",
                "description": "Sandbox restrictions for embedded content"
            }
        }
    }
}
```

### 5. Implementation Example

```typescript
class WebPanelViewProvider {
    private getSecuritySettings() {
        const config = vscode.workspace.getConfiguration('web-panel');
        return {
            level: config.get('security.level', 'medium'),
            allowedDomains: config.get('security.allowedDomains', ['localhost']),
            blockExternal: config.get('security.blockExternalNavigation', true),
            sandboxMode: config.get('security.sandboxMode', 'medium')
        };
    }

    private getSandboxAttributes(mode: string): string {
        switch (mode) {
            case 'strict':
                return 'sandbox="allow-scripts allow-same-origin"';
            case 'medium':
                return 'sandbox="allow-scripts allow-same-origin allow-forms allow-popups-to-escape-sandbox"';
            case 'relaxed':
                return 'sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"';
            case 'none':
                return '';
            default:
                return 'sandbox="allow-scripts allow-same-origin allow-forms"';
        }
    }
}
```

## Benefits

1. **Strict Mode**: Maximum security, only local content
2. **Medium Mode**: Balance between security and functionality  
3. **Relaxed Mode**: Full functionality with minimal restrictions
4. **User Control**: Users can configure based on their needs

## Recommendations

- Default to "medium" security level
- Always use sandbox for iframes
- Provide clear documentation about security implications
- Show warnings when using relaxed security settings