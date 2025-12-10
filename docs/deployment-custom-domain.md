# Custom Domain Setup

## Overview

To use a custom domain (e.g., `wearebeyondborders.com`):

## Steps

### 1. Add CNAME File

Create `public/CNAME` with your domain:

```text
wearebeyondborders.com
```

### 2. Configure DNS

Add DNS records with your domain provider:

**Option A: A Records (recommended)**

Point to GitHub Pages IPs:

- `185.199.108.153`
- `185.199.109.153`
- `185.199.110.153`
- `185.199.111.153`

**Option B: CNAME Record**

Point to `<owner>.github.io`

### 3. GitHub Pages Settings

The custom domain will be automatically configured from the `CNAME` file
after deployment.

### 4. Update Production Workflow

The `BASE_URL` is set to `/` for custom domains (already configured).

## Adding New Deployment Types

For additional environments (e.g., `staging/`):

1. Create a new workflow based on `deploy-pr.yml`
2. Push to a different subdirectory in `gh-pages` (e.g., `staging/`)
3. Adjust `BASE_URL` to match the subdirectory path
4. Follow the same `gh-pages` branch deployment pattern
