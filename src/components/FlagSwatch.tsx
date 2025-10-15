import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { FlagSpec } from '../flags/schema';
import { buildFlagGradient } from '../flags/utils';

export default function FlagSwatch({ flag, size = 36, showName = false }: { flag: FlagSpec; size?: number; showName?: boolean }) {
  const grad = buildFlagGradient(flag);
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box
        sx={{
          width: size,
          height: Math.round((size * 11) / 18),
          border: '1px solid var(--muted-border)',
          borderRadius: 0.5,
          overflow: 'hidden',
          flex: '0 0 auto',
          backgroundImage: grad,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {(flag as any).png_preview || (flag as any).png_full || (flag as any).svgFilename ? (
          <Box
            component="img"
            src={`/flags/${(flag as any).png_preview || (flag as any).png_full || (flag as any).svgFilename}`}
            alt=""
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e: any) => {
              try { e.currentTarget.style.display = 'none'; } catch {}
            }}
          />
        ) : null}
      </Box>
      {showName && <Typography>{flag.displayName}</Typography>}
    </Box>
  );
}
