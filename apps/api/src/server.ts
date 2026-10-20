import express from 'express';
import type { Express, Request, Response } from 'express';
import cors from 'cors';
import { spineAuthMiddleware } from './spine/auth.ts';
import { spineRegistry } from './spine/registry.ts';
import { auditLedger } from './spine/audit.ts';
import { checkinManifest } from './cells/checkin/manifest.ts';
import { checkinRouter } from './cells/checkin/controller.ts';
import { doctorsManifest } from './cells/doctors/manifest.ts';
import { doctorsRouter } from './cells/doctors/controller.ts';

import { recordsManifest } from './cells/records/manifest.ts';
import { recordsRouter } from './cells/records/controller.ts';
import { medicinesManifest } from './cells/medicines/manifest.ts';
import { medicinesRouter } from './cells/medicines/controller.ts';

import { dietManifest } from './cells/diet/manifest.ts';
import { dietRouter } from './cells/diet/controller.ts';
import { maternalManifest } from './cells/maternal/manifest.ts';
import { maternalRouter } from './cells/maternal/controller.ts';
import { familyManifest } from './cells/family/manifest.ts';
import { familyRouter } from './cells/family/controller.ts';
import { assistantRouter } from './spine/assistant.ts';

// Register cell manifests with the spine
spineRegistry.registerCell(checkinManifest);
spineRegistry.registerCell(doctorsManifest);
spineRegistry.registerCell(recordsManifest);
spineRegistry.registerCell(medicinesManifest);
spineRegistry.registerCell(dietManifest);
spineRegistry.registerCell(maternalManifest);
spineRegistry.registerCell(familyManifest);

export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Global health check
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'FourWard API Spine',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // Spine Audit verification endpoint (read-only)
  app.get('/spine/audit', (_req: Request, res: Response) => {
    const integrity = auditLedger.verifyIntegrity();
    res.json({
      integrity,
      entriesCount: auditLedger.getEntries().length,
      entries: auditLedger.getEntries(),
    });
  });

  // Spine Auth Middleware for cell routes
  app.use(spineAuthMiddleware);

  // Mount cells
  app.use('/checkin', checkinRouter);
  app.use('/doctors', doctorsRouter);
  app.use('/records', recordsRouter);
  app.use('/medicines', medicinesRouter);
  app.use('/diet', dietRouter);
  app.use('/maternal', maternalRouter);
  app.use('/family', familyRouter);
  app.use('/spine/assistant', assistantRouter);

  return app;
}

export const app = createApp();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Start server when executed directly
if (process.env.NODE_ENV !== 'test' && !process.env.JEST_WORKER_ID) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[FourWard API] Spine and cells listening on http://0.0.0.0:${PORT}`);
  });
}
