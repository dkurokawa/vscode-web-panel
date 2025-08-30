# Change Log

All notable changes to the "vscode-web-panel" extension will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2025-01-30

### Added
- "Use this theme" button below demo dashboard notice
- Ability to copy current HTML theme with clipboard API
- Visual feedback when theme is copied successfully

## [0.3.0] - 2025-01-10

### Added
- 13 visual themes (Simple, Retro, Vintage, Botanical, Toy, Neon, Casino, Diner, Western, Cyber, Pastel, Dark, Legacy)
- URL history feature - remembers last 5 visited URLs
- Support for file:// URLs using fetch mode
- Auto-detection and handling of embeddable alternatives for popular sites
- Custom dropdown for URL history with better positioning control
- Collapsible demo dashboard notice

### Changed
- Improved theme switcher layout with 3-column grid
- Enhanced error handling for blocked iframe content
- Smaller font sizes for theme buttons (10px)
- All Japanese text translated to English for international OSS release
- Better handling of X-Frame-Options restrictions

### Fixed
- File URL display issues in webview
- Theme button layout consistency across different themes
- Performance issues with Toy theme animations
- URL input field visibility and positioning

## [0.1.0] - 2025-01-06

### Added
- Enhanced security features with configurable sandbox levels
- Navigation controls with external URL protection
- Multiple render modes (iframe and fetch)
- Comprehensive configuration system
- Better error handling and user feedback

### Changed
- Improved documentation and removed placeholder texts
- Enhanced webview security with proper CSP configuration
- Better URL validation and handling

### Fixed
- Updated all placeholder strings for OSS release
- Cleaned up documentation for professional presentation

## [0.0.2] - 2025-01-05

### Fixed
- Fixed HTML template styling issue where styles were not properly applied
- Fixed default URL - now starts empty to show default dashboard
- Fixed HTML lang attribute to "en"
- Fixed style tag structure that was causing rendering issues

## [0.0.1] - 2025-01-05

### Added
- Initial release of Web Panel
- Display web dashboards in VS Code panels
- Sidebar integration for quick access
- URL navigation with protocol auto-detection
- Default dashboard with sample metrics
- Real-time content updates
- Full JavaScript support in webviews
- Configurable dashboard URLs

### Features
- Command: "Open Dashboard Panel" to create new dashboard panels
- Explorer sidebar view for persistent dashboard access
- Support for any web-based dashboard or monitoring tool
- Responsive design that adapts to panel size
- Error handling and loading states

### Technical
- Built with TypeScript and VS Code Extension API
- Webview-based implementation for security
- Sample test server included for development