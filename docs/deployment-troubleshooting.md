# Deployment Troubleshooting

## 404 After Deploy

- Verify GitHub Pages is set to "Deploy from a branch" (gh-pages)
- Check workflow completed successfully
- Wait 2-3 minutes for GitHub Pages to rebuild

## Custom Domain Not Working

- Verify `CNAME` file exists in `public/` directory
- Check DNS records are configured correctly
- Wait for DNS propagation (up to 24 hours)
- Verify custom domain shows in Settings → Pages

## Missing Assets

**For custom domain:**

- Verify `BASE_URL=/` in production workflow
- Check assets loaded from correct path in browser DevTools

**For GitHub Pages URL:**

- Verify `BASE_URL=/<repo>/` in production workflow
- Check assets loaded from correct path in browser DevTools

## Beta Version Collision

- Re-run beta deploy; directory is fully replaced each time
- No action needed - newer version overwrites older

## Production Overwrites Beta

- Check production workflow preserves `beta/*` directories
- Review workflow logs for "Preserve beta directory" step

## Cache Issues

- Hard refresh in browser (Ctrl+Shift+R)
- Append query string when sharing (e.g., `?v=<semver>`)

## Artifact Retention

- Production provenance artifact retained for 30 days
- Adjust via `retention-days` in workflow if needed
