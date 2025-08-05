# Publishing Web Panel to VS Code Marketplace

## Prerequisites

1. Create a Visual Studio Marketplace publisher account at https://marketplace.visualstudio.com/manage
2. Install vsce (Visual Studio Code Extension manager):
   ```bash
   npm install -g @vscode/vsce
   ```

## Before Publishing

1. Update placeholder values in `package.json`:
   - Replace `your-publisher-name` with your actual publisher ID
   - Replace `yourusername` with your GitHub username
   - Update repository URLs to point to your repository

2. Update `LICENSE` file:
   - Replace `[Your Name]` with your actual name

3. Add an icon for your extension:
   - Create a 128x128px PNG icon
   - Save it as `icon.png` in the project root
   - The icon path is already referenced in package.json

## Building the Extension

1. Install dependencies:
   ```bash
   npm install
   ```

2. Compile TypeScript:
   ```bash
   npm run compile
   ```

3. Run tests (optional):
   ```bash
   npm test
   ```

## Creating the VSIX Package

```bash
vsce package
```

This creates a `.vsix` file that can be:
- Uploaded to the marketplace
- Shared directly with users
- Installed locally for testing

## Publishing to Marketplace

1. Login to vsce with your publisher account:
   ```bash
   vsce login your-publisher-name
   ```

2. Publish the extension:
   ```bash
   vsce publish
   ```

   Or publish a specific version:
   ```bash
   vsce publish 0.0.1
   ```

## Testing Before Publishing

1. Install the VSIX locally:
   ```bash
   code --install-extension vscode-web-panel-0.0.1.vsix
   ```

2. Test all features:
   - Open Dashboard Panel command
   - Sidebar view functionality
   - URL navigation
   - Error handling

## Post-Publishing

1. Push the tag to GitHub:
   ```bash
   git push origin main --tags
   ```

2. Create a GitHub release with the VSIX file

3. Monitor the extension page for user feedback

## Updating the Extension

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Commit changes
4. Create new tag: `git tag -a v0.0.2 -m "Version 0.0.2"`
5. Run `vsce publish` again

## Marketplace Link

Once published, your extension will be available at:
https://marketplace.visualstudio.com/items?itemName=your-publisher-name.vscode-web-panel