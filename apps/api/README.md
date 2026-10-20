# @fourward/api

FourWard NestJS modular monolith API.
- `src/spine/`: auth, tenancy (hospital_id + Postgres RLS), consent engine, audit ledger, event bus, assistant + tool registry, cell registry, health/kill-switch.
- `src/cells/<cell>/`: self-contained cell modules with manifests, routes, permissions, and domain logic.
