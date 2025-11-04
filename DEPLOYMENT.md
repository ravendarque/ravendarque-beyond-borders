## Deployment Architecture

This project uses a **unified GitHub Pages deployment strategy** where both production and beta deployments push to the `gh-pages` branch:

1. **Production** – deploys to the root of `gh-pages` branch
2. **Beta** – deploys versioned builds to `gh-pages/beta/<semver>/`

Both strategies use the same deployment method for consistency and reliability.

### GitHub Pages Configuration

**CRITICAL:** GitHub Pages must be configured to deploy from the `gh-pages` branch:

1. Go to: **Settings → Pages**
2. Under "Build and deployment" → "Source"
3. Select: **"Deploy from a branch"**
4. Branch: **`gh-pages`**
5. Folder: **`/ (root)`**

### 1. Production Deployment

Workflow: `.github/workflows/deploy-pages.yml`

Triggers:
- Push to `main` (ignores docs, markdown, and local files)
- Manual `workflow_dispatch`

Process:
1. Build app with `BASE_URL=/` (for custom domain)
2. Checkout `gh-pages` branch
3. Preserve existing `beta/*` directories
4. Deploy build to root of `gh-pages`
5. Include `CNAME` file automatically (from `public/CNAME`)
6. Commit and push to `gh-pages`

Key features:
- Preserves beta deployments during production updates
- Supports custom domain via `CNAME` file
- Creates provenance artifact retained for 30 days
- Single source of truth (`gh-pages` branch)

Permissions configured:
```yaml
permissions:
  contents: write
```

URLs:
- **Custom Domain:** `https://wearebeyondborders.com`
- **GitHub Pages:** `https://<owner>.github.io/<repo>/`

### 2. Beta Deployments (Versioned Previews)

Workflow: `.github/workflows/deploy-beta.yml`

Invocation:
- `workflow_dispatch` with optional `branch` input.
- Adding a `deploy-beta` label to a pull request.

Process:
1. Determine branch & derive semantic version via `scripts/get-version.cjs`.
2. Build with `BASE_URL=/<repo>/beta/<semver>/`.
3. Commit build into `gh-pages` under `beta/<semver>/` preserving existing versions.
4. Generate/refresh an index page enumerating all beta versions.

Beta URL pattern:
```
https://<owner>.github.io/<repo>/beta/<semver>/
```

Beta index page:
```
https://<owner>.github.io/<repo>/beta/
```

Cleanup Workflow: `.github/workflows/cleanup-beta.yml` – removes a specific version directory and regenerates the beta index.

Benefits:
- Multiple parallel preview versions preserved simultaneously
- Simple static hosting coexisting with production
- Enables testers to compare versions side-by-side
- Consistent deployment method with production

### Manual Beta Deployment

Trigger a manual beta deployment of your current branch:
```bash
gh workflow run deploy-beta.yml -f branch=$(git rev-parse --abbrev-ref HEAD)
```

### Custom Domain Setup

To use a custom domain (e.g., `wearebeyondborders.com`):

1. **Add CNAME file:** Create `public/CNAME` with your domain:
   ```
   wearebeyondborders.com
   ```

2. **Configure DNS:** Add DNS records with your domain provider:
   - **A records** pointing to GitHub Pages IPs:
     - `185.199.108.153`
     - `185.199.109.153`
     - `185.199.110.153`
     - `185.199.111.153`
   - Or **CNAME record** pointing to `<owner>.github.io`

3. **GitHub Pages settings:** The custom domain will be automatically configured from the `CNAME` file after deployment

4. **Update production workflow:** The `BASE_URL` is set to `/` for custom domains (already configured)

### Adding a New Deployment Type

For additional environments (e.g., `staging/`):
1. Create a new workflow based on `deploy-beta.yml`
2. Push to a different subdirectory in `gh-pages` (e.g., `staging/`)
3. Adjust `BASE_URL` to match the subdirectory path
4. Follow the same `gh-pages` branch deployment pattern

### Common Issues & Troubleshooting

**404 after deploy:**
- Verify GitHub Pages is set to "Deploy from a branch" (gh-pages)
- Check workflow completed successfully
- Wait 2-3 minutes for GitHub Pages to rebuild

**Custom domain not working:**
- Verify `CNAME` file exists in `public/` directory
- Check DNS records are configured correctly
- Wait for DNS propagation (up to 24 hours)
- Verify custom domain shows in Settings → Pages

**Missing assets:**
- For custom domain: Verify `BASE_URL=/` in production workflow
- For GitHub Pages URL: Verify `BASE_URL=/<repo>/` in production workflow
- Check assets loaded from correct path in browser DevTools

**Beta version collision:**
- Re-run beta deploy; directory is fully replaced each time
- No action needed - newer version overwrites older

**Production overwrites beta:**
- Check production workflow preserves `beta/*` directories
- Review workflow logs for "Preserve beta directory" step

**Cache issues:**
- Hard refresh in browser (Ctrl+Shift+R)
- Append query string when sharing (e.g., `?v=<semver>`)

**Artifact retention:**
- Production provenance artifact retained for 30 days
- Adjust via `retention-days` in workflow if needed

### Deployment Checklist

**Initial Setup:**
- [ ] GitHub Pages set to "Deploy from a branch" (gh-pages)
- [ ] `public/CNAME` file contains custom domain
- [ ] DNS records configured for custom domain
- [ ] Production workflow `BASE_URL` set to `/`
- [ ] Beta workflow unchanged from defaults

**Per Deployment:**
- [ ] Workflow completes successfully
- [ ] Production preserves beta directories
- [ ] Custom domain resolves correctly
- [ ] All assets load properly
- [ ] Beta deployments accessible

### Architecture Decision

**Why both use `gh-pages` branch?**

Previously attempted using GitHub Actions deployment (`actions/deploy-pages`) for production while beta used `gh-pages` branch. This failed because:
- GitHub Pages can only use ONE deployment method
- Actions deployment ignores `gh-pages` branch entirely
- Beta deployments became inaccessible

Current unified approach:
- ✅ Both production and beta accessible
- ✅ Consistent deployment method
- ✅ Production preserves beta versions
- ✅ Single Pages configuration
- ✅ Custom domain works correctly
