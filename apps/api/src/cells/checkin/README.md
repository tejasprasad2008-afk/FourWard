# Checkin Cell (`apps/api/src/cells/checkin`)

## Overview
This cell manages the consultation check-in workflow:
- Validates 6-digit OTP codes provided by hospital staff (e.g. nurses).
- Strictly enforces 3-attempt lockout per patient and visit session on the server.
- Interacts with the Spine consent engine to grant consultation access upon successful verification.
- Emits audit records to the Spine hash-chained audit ledger.

## Rules
- Assistant tool registry exposes NO OTP or check-in verification tools (client or assistant bypass strictly prohibited).
- Exposes `/health` endpoint.
- Self-contained persistence for visit attempts.
