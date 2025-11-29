# Personal Portfolio Website

A modern, responsive portfolio website featuring glassmorphism design, GitHub activity visualization, and interactive 3D visitor map.

## Features

- **Glassmorphism Design**: Modern glass-morphism UI with beautiful visual effects
- **Responsive Layout**: Fully responsive design that works on all devices
- **GitHub Activity Graph**: Real-time GitHub contribution visualization
- **3D Visitor Map**: Interactive globe showing visitor locations (powered by Globe.gl & Supabase)
- **PDF Viewer**: Built-in PDF viewer for publications
- **Dark Mode**: Toggle between light and dark themes
- **Multiple Pages**: Academic, About, and Links pages
- **Dynamic Sidebar**: Shared navigation across all pages
- **Skill Icons**: Professional skill badges from skillicons.dev

## Pages

- **Academic (index.html)**: Latest news, publications, and research projects
- **About (about.html)**: Personal status, GitHub activity, skills, and interests
- **Link (link.html)**: Social media and contact information

## Technologies Used

- HTML5, CSS3 (Glassmorphism effects)
- Vanilla JavaScript
- [Three.js](https://threejs.org/) - 3D graphics
- [Globe.gl](https://globe.gl/) - Interactive 3D globe
- [Supabase](https://supabase.com/) - Visitor tracking backend
- [GitHub API](https://docs.github.com/en/rest) - Contribution data
- [skillicons.dev](https://skillicons.dev/) - Skill badge icons
- [PDF.js](https://mozilla.github.io/pdf.js/) - Browser-based PDF rendering
- GitHub Pages - Static site hosting

## Project Structure

```
imyxr.github.io/
├── index.html              # Main academic page
├── about.html              # About page with GitHub activity
├── link.html               # Social media links
├── styles.css              # Main stylesheet
├── script.js               # Main JavaScript
├── sidebar-template.js     # Shared sidebar component
├── github-activity.js      # GitHub contribution graph
├── config.js               # Supabase config (gitignored)
├── config.example.js       # Config template
├── figures/                # Images and assets
│   ├── IMG_09021.jpg       # Profile picture
│   └── Project1.png        # Project images
├── papers/                 # PDF publications
│   ├── VL_HCC_2025.html   # PDF viewer page
│   └── VL_HCC_2025.pdf    # Publication PDF
└── .nojekyll              # Disable Jekyll processing
```

## Local Development

### Option 1: Using Python HTTP Server (Recommended)

To avoid CORS issues with GitHub API and proper file loading:

```bash
# Navigate to project directory
cd imyxr.github.io

# Start local server
python -m http.server 8000

# Or use the provided batch file (Windows)
start-server.bat
```

Then open: `http://localhost:8000`

### Option 2: Direct File Opening

Simply open `index.html` in your browser. Note: GitHub API may not work due to CORS restrictions.

## GitHub Pages Deployment

### Initial Setup

1. **Create GitHub Repository**
   ```bash
   # Repository should be named: username.github.io
   # For example: imyxr.github.io
   ```

2. **Push Your Code**
   ```bash
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/IMYXR/imyxr.github.io.git
   git push -u origin main
   ```

3. **Enable GitHub Pages**
   - Go to repository Settings → Pages
   - Source: Deploy from a branch
   - Branch: `main` / `(root)`
   - Click Save

4. **Wait for Deployment**
   - GitHub Pages will automatically build and deploy
   - Visit: `https://imyxr.github.io`
   - First deployment may take 5-10 minutes

### Updating Your Site

After making changes:

```bash
git add .
git commit -m "Your update message"
git push origin main
```

GitHub Pages will automatically redeploy within a few minutes.

## Configuration

### Supabase Setup (Optional - for visitor map)

1. Copy `config.example.js` to `config.js`
2. Sign up at [Supabase](https://supabase.com/)
3. Create a new project and table
4. Update `config.js` with your credentials:
   ```javascript
   const SUPABASE_CONFIG = {
       url: 'https://your-project.supabase.co',
       anonKey: 'your-anon-key',
       tableName: 'visitors'
   };
   ```

See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for detailed instructions.

### GitHub Activity Setup

The GitHub contribution graph is already configured with username `IMYXR`. To customize:

1. Edit `github-activity.js`:
   ```javascript
   const GITHUB_USERNAME = 'your-username';
   const USE_REAL_DATA = true;
   ```

2. (Optional) Add GitHub Personal Access Token for higher API rate limits:
   ```javascript
   const GITHUB_TOKEN = 'your-github-token';
   ```

See [GITHUB_API_SETUP.md](GITHUB_API_SETUP.md) for detailed instructions.

## Important Files

- **`.gitignore`**: Prevents committing sensitive config files
- **`.nojekyll`**: Tells GitHub Pages not to process site with Jekyll
- **`config.js`**: Contains Supabase credentials (not committed to git)
- **`config.example.js`**: Template for configuration

## Customization

### Update Profile Information

Edit `sidebar-template.js`:
```javascript
// Update name, title, profile picture
<h1 class="name">Your Name</h1>
<img src="figures/your-photo.jpg" alt="Profile Picture">
```

### Add Publications

1. Add your PDF to `papers/` directory
2. Create viewer page: `papers/your-paper.html`
3. Update publication card in `index.html`

### Modify Skills

Edit the Skills section in `about.html` using [skillicons.dev](https://skillicons.dev/):
```html
<img src="https://skillicons.dev/icons?i=python" alt="Python">
```

### Update Social Links

Edit the social media section in `link.html`.

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Responsive design

## Performance

- Lightweight: ~50KB CSS, minimal JavaScript
- Fast loading: Optimized assets and code
- CDN resources: External libraries loaded from CDN
- No build process: Pure HTML/CSS/JS

## Troubleshooting

### GitHub Activity Not Showing

- Check browser console for errors
- Verify GitHub username in `github-activity.js`
- GitHub API has rate limits (60 requests/hour without token)
- Add a personal access token to increase rate limit

### Visitor Map Not Showing

- Verify Supabase configuration in `config.js`
- Check browser console for connection errors
- Ensure `config.js` exists (copy from `config.example.js`)

### PDF Not Loading

- Ensure PDF file exists in `papers/` directory
- Check filename matches in HTML viewer page
- Browser must support PDF embedding

### Changes Not Showing on GitHub Pages

- Wait 5-10 minutes for deployment
- Check GitHub Actions tab for deployment status
- Clear browser cache (Ctrl+Shift+R)
- Verify files were committed and pushed

## License

© 2025 Xiaoran Yang - All rights reserved.

## Contact

- Email: xyang49@ncsu.edu
- GitHub: [@IMYXR](https://github.com/IMYXR)
- LinkedIn: [Xiaoran Yang](https://www.linkedin.com/in/xiaoran-yang-0a5b58282/en)

---

**Note**: This is a personal portfolio website. Feel free to use it as inspiration, but please don't copy it directly.
