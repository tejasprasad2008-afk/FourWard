const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

// Setup mock require for Node ES module execution of RN code
globalThis.require = (id) => ({ uri: id });

test('FourWard System Verification Suite', async (suite) => {
  // 1. Contract Stub Baseline Tests
  await suite.test('Contract Stub Baseline Tests', async (t) => {
    const { verifyCheckinStub } = await import('../packages/contracts/src/checkin.ts');

    await t.test('Success test code "123456" returns ok with doctor and room', () => {
      const res = verifyCheckinStub('123456', 0);
      assert.strictEqual(res.status, 'ok');
      assert.strictEqual(res.room, 'Room 204');
      assert.strictEqual(res.doctorName, 'Dr. P. V. Ramana Rao');
    });

    await t.test('Expired test code "999999" returns expired state with plain copy', () => {
      const res = verifyCheckinStub('999999', 0);
      assert.strictEqual(res.status, 'expired');
      assert.strictEqual(res.message, 'This code expired. Ask the nurse for a new one.');
    });

    await t.test('Locked test code "888888" immediately locks out with plain copy', () => {
      const res = verifyCheckinStub('888888', 0);
      assert.strictEqual(res.status, 'locked');
      assert.strictEqual(res.message, 'Too many tries. Ask the nurse for a new code.');
    });

    await t.test('Third wrong attempt locks out', () => {
      const res = verifyCheckinStub('000000', 2);
      assert.strictEqual(res.status, 'locked');
      assert.strictEqual(res.message, 'Too many tries. Ask the nurse for a new code.');
    });
  });

  // 2. Server-side Checkin State & 3-Attempt Lockout
  await suite.test('Server-Side Checkin Cell & Lockout Persistence', async (t) => {
    const { checkinService } = await import('../apps/api/src/cells/checkin/service.ts');

    const testPatient = 'patient_audit_lockout_99';
    const testVisit = 'visit_session_lockout_99';

    await t.test('Attempt 1: Wrong code decrements tries to 2', () => {
      const res = checkinService.verify(testPatient, testVisit, '111111');
      assert.strictEqual(res.status, 'invalid');
      assert.strictEqual(res.remainingTries, 2);
      assert.match(res.message, /2 tries left/);
    });

    await t.test('Attempt 2: Wrong code decrements tries to 1', () => {
      const res = checkinService.verify(testPatient, testVisit, '222222');
      assert.strictEqual(res.status, 'invalid');
      assert.strictEqual(res.remainingTries, 1);
      assert.match(res.message, /1 try left/);
    });

    await t.test('Attempt 3: 3rd wrong code permanently locks session', () => {
      const res = checkinService.verify(testPatient, testVisit, '333333');
      assert.strictEqual(res.status, 'locked');
      assert.strictEqual(res.remainingTries, 0);
      assert.strictEqual(res.message, 'Too many tries. Ask the nurse for a new code.');
    });

    await t.test('Attempt 4: Even with correct code "123456", locked session rejects and stays locked', () => {
      const res = checkinService.verify(testPatient, testVisit, '123456');
      assert.strictEqual(res.status, 'locked');
      assert.strictEqual(res.remainingTries, 0);
      assert.strictEqual(res.message, 'Too many tries. Ask the nurse for a new code.');
    });

    await t.test('Fresh session succeeds and returns dynamic department, room, and doctor', () => {
      const freshPatient = 'patient_success_101';
      const freshVisit = 'visit_success_101';
      const res = checkinService.verify(freshPatient, freshVisit, '123456');
      assert.strictEqual(res.status, 'ok');
      assert.strictEqual(res.room, 'Room 204');
      assert.strictEqual(res.doctorName, 'Dr. P. V. Ramana Rao');
      assert.strictEqual(res.department, 'General Medicine');
      assert.strictEqual(res.visitId, freshVisit);
    });
  });

  // 3. Doctors Cell: Triage & Emergency detection
  await suite.test('Doctors Cell: Triage & Emergency Logic', async (t) => {
    const { doctorsService } = await import('../apps/api/src/cells/doctors/service.ts');

    await t.test('Chest pain symptoms trigger emergency alert and 108 referral', () => {
      const res = doctorsService.triageSymptoms({ symptomInput: 'Severe chest pain and difficulty breathing' });
      assert.strictEqual(res.isEmergency, true);
      assert.strictEqual(res.recommendedDepartment, 'Cardiology / Emergency');
      assert.match(res.emergencyMessage, /108/);
    });

    await t.test('Fever & cough symptoms map to Internal Medicine', () => {
      const res = doctorsService.triageSymptoms({ symptomInput: 'Fever and cold cough for 3 days' });
      assert.strictEqual(res.isEmergency, false);
      assert.strictEqual(res.recommendedDepartment, 'Internal Medicine');
      assert.ok(res.questions.length >= 3);
    });

    await t.test('Pediatric symptoms map to Pediatrics', () => {
      const res = doctorsService.triageSymptoms({ symptomInput: 'Child fever and stomach upset' });
      assert.strictEqual(res.isEmergency, false);
      assert.strictEqual(res.recommendedDepartment, 'Pediatrics');
    });

    await t.test('Joint pain symptoms map to Orthopedics', () => {
      const res = doctorsService.triageSymptoms({ symptomInput: 'Knee joint pain after running' });
      assert.strictEqual(res.isEmergency, false);
      assert.strictEqual(res.recommendedDepartment, 'Orthopedics');
    });

    await t.test('Ear/Throat symptoms map to ENT', () => {
      const res = doctorsService.triageSymptoms({ symptomInput: 'Severe ear ache and sore throat' });
      assert.strictEqual(res.isEmergency, false);
      assert.strictEqual(res.recommendedDepartment, 'ENT');
    });
  });

  // 4. Doctors Cell: Booking, Walk-in vs Slot & Double Booking Rejection
  await suite.test('Doctors Cell: Token Booking & Audit Ledger', async (t) => {
    const { doctorsService } = await import('../apps/api/src/cells/doctors/service.ts');
    const { auditLedger } = await import('../apps/api/src/spine/audit.ts');

    await t.test('Walk-in booking for partner hospital generates confirmed token and wait time', () => {
      const bookingRes = doctorsService.bookDoctor({
        doctorId: 'doc_cardio_01',
        patientId: 'patient_test_booking_1',
        walkIn: true,
      });

      assert.ok(bookingRes.bookingId.startsWith('bk_'));
      assert.strictEqual(bookingRes.status, 'confirmed');
      assert.ok(bookingRes.tokenNumber > 0);
      assert.ok(bookingRes.estimatedWaitMinutes > 0);
      assert.strictEqual(bookingRes.doctorName, 'Dr. P. V. Ramana Rao');
      assert.strictEqual(bookingRes.department, 'Cardiology');
      assert.strictEqual(bookingRes.room, 'Room 204');

      // Verify audit entry in spine
      const entries = auditLedger.getEntries();
      const bookingAudit = entries.find((e) => e.action === 'DOCTOR_TOKEN_BOOKED' && e.patientId === 'patient_test_booking_1');
      assert.ok(bookingAudit, 'Audit ledger must contain DOCTOR_TOKEN_BOOKED action');
    });

    await t.test('Slot booking for specific date & time confirms slot without walk-in token', () => {
      const slotRes = doctorsService.bookDoctor({
        doctorId: 'doc_genmed_02',
        patientId: 'patient_test_slot_1',
        slotId: 'doc_genmed_02_2026-10-20_0900',
        date: '2026-10-20',
        time: '09:00 AM',
      });

      assert.ok(slotRes.bookingId.startsWith('bk_'));
      assert.strictEqual(slotRes.status, 'confirmed');
      assert.strictEqual(slotRes.slotId, 'doc_genmed_02_2026-10-20_0900');
      assert.strictEqual(slotRes.date, '2026-10-20');
      assert.strictEqual(slotRes.time, '09:00 AM');
      assert.strictEqual(slotRes.tokenNumber, undefined);

      const entries = auditLedger.getEntries();
      const slotAudit = entries.find((e) => e.action === 'DOCTOR_SLOT_BOOKED' && e.patientId === 'patient_test_slot_1');
      assert.ok(slotAudit, 'Audit ledger must contain DOCTOR_SLOT_BOOKED action');
    });

    await t.test('Double booking for the same patient and doctor is rejected by the server', () => {
      assert.throws(
        () => {
          doctorsService.bookDoctor({
            doctorId: 'doc_cardio_01',
            patientId: 'patient_test_booking_1',
            walkIn: true,
          });
        },
        (err) => {
          assert.strictEqual(err.code, 'DOUBLE_BOOKING');
          assert.match(err.message, /Double booking rejected/);
          return true;
        }
      );
    });

    await t.test('Directory (non-partner) doctor booking returns status "requested", not "confirmed"', () => {
      const dirRes = doctorsService.bookDoctor({
        doctorId: 'doc_cardio_spec_07',
        patientId: 'patient_dir_req_1',
        date: '2026-10-22',
        time: '11:00 AM',
      });

      assert.ok(dirRes.bookingId.startsWith('bk_'));
      assert.strictEqual(dirRes.status, 'requested');
      assert.strictEqual(dirRes.doctorName, 'Dr. Meenakshi Sundaram');
      assert.notStrictEqual(dirRes.status, 'confirmed');
    });

    await t.test('Cancel visit updates status to cancelled and writes to audit ledger', () => {
      // 1. Create a fresh booking to cancel
      const bRes = doctorsService.bookDoctor({
        doctorId: 'doc_pedia_03',
        patientId: 'patient_to_cancel_1',
        walkIn: true,
      });
      assert.strictEqual(bRes.status, 'confirmed');

      // 2. Cancel the booking
      const cancelRes = doctorsService.cancelBooking(bRes.bookingId, 'patient_to_cancel_1');
      assert.strictEqual(cancelRes.status, 'cancelled');
      assert.ok(cancelRes.cancelledAt);

      // 3. Verify audit record
      const entries = auditLedger.getEntries();
      const cancelAudit = entries.find((e) => e.action === 'DOCTOR_BOOKING_CANCELLED' && e.visitId === bRes.bookingId);
      assert.ok(cancelAudit, 'Audit ledger must contain DOCTOR_BOOKING_CANCELLED entry');

      // 4. Double booking should be unblocked for this doctor since previous was cancelled
      const rebookRes = doctorsService.bookDoctor({
        doctorId: 'doc_pedia_03',
        patientId: 'patient_to_cancel_1',
        walkIn: true,
      });
      assert.strictEqual(rebookRes.status, 'confirmed');
    });

    await t.test('Reschedule onto a free slot updates date, time, and slotId, while rejecting full slots', () => {
      // 1. Create initial slot booking
      const initBooking = doctorsService.bookDoctor({
        doctorId: 'doc_genmed_02',
        patientId: 'patient_resched_1',
        slotId: 'doc_genmed_02_2026-10-20_0900',
        date: '2026-10-20',
        time: '09:00 AM',
      });

      // 2. Reschedule onto an available slot
      const reschedRes = doctorsService.rescheduleBooking(
        initBooking.bookingId,
        'doc_genmed_02_2026-10-21_1130',
        '2026-10-21',
        '11:30 AM',
        'patient_resched_1'
      );
      assert.strictEqual(reschedRes.status, 'confirmed');
      assert.strictEqual(reschedRes.slotId, 'doc_genmed_02_2026-10-21_1130');
      assert.strictEqual(reschedRes.date, '2026-10-21');
      assert.strictEqual(reschedRes.time, '11:30 AM');

      // 3. Verify audit record
      const entries = auditLedger.getEntries();
      const reschedAudit = entries.find((e) => e.action === 'DOCTOR_BOOKING_RESCHEDULED' && e.visitId === initBooking.bookingId);
      assert.ok(reschedAudit, 'Audit ledger must contain DOCTOR_BOOKING_RESCHEDULED entry');

      // 4. Attempt to reschedule onto a slot marked Full (10:30 AM)
      assert.throws(
        () => {
          doctorsService.rescheduleBooking(
            initBooking.bookingId,
            'doc_genmed_02_2026-10-21_1030',
            '2026-10-21',
            '10:30 AM',
            'patient_resched_1'
          );
        },
        (err) => {
          assert.strictEqual(err.code, 'SLOT_UNAVAILABLE');
          assert.match(err.message, /full/i);
          return true;
        }
      );
    });

    await t.test('Book-again prefill generates step 3 draft with same doctor and patient', async () => {
      const { createBookAgainDraft } = await import('../packages/contracts/src/doctors.ts');

      const pastVisitSample = {
        bookingId: 'bk_past_test_01',
        doctorId: 'doc_genmed_02',
        status: 'completed',
        doctorName: 'Dr. K. Srinivas',
        hospitalName: 'AIG Hospitals',
        department: 'Internal Medicine',
        patientName: 'S. Ramanujan',
        patientId: 'patient_sample_99',
        bookedAt: '2026-10-01T10:00:00.000Z',
      };

      const draft = createBookAgainDraft(pastVisitSample);

      assert.strictEqual(draft.step, 3, 'Book-again prefill must open directly at Step 3 (Date & time)');
      assert.strictEqual(draft.doctorId, 'doc_genmed_02');
      assert.strictEqual(draft.patientId, 'patient_sample_99');
      assert.strictEqual(draft.patientName, 'S. Ramanujan');
      assert.strictEqual(draft.date, 'Today');
    });
  });

  // 5. Spine Append-Only Hash-Chained Audit Ledger Integrity
  await suite.test('Spine Hash-Chained Audit Ledger Verification', async (t) => {
    const { auditLedger } = await import('../apps/api/src/spine/audit.ts');

    const entries = auditLedger.getEntries();
    assert.ok(entries.length >= 4, `Expected at least 4 audit records, got ${entries.length}`);

    // Verify cryptographic integrity of every link in chain
    const integrity = auditLedger.verifyIntegrity();
    assert.strictEqual(integrity.isValid, true, `Audit ledger integrity failed: ${integrity.error}`);

    // Verify first entry has genesis prevHash
    assert.strictEqual(
      entries[0].prevHash,
      '0000000000000000000000000000000000000000000000000000000000000000'
    );

    // Verify each subsequent entry's prevHash matches predecessor's hash
    for (let i = 1; i < entries.length; i++) {
      assert.strictEqual(
        entries[i].prevHash,
        entries[i - 1].hash,
        `Hash chain broken at index ${i}`
      );
    }
  });

  // 6. Availability Deletion Check
  await suite.test('Availability: AvailabilityScreen and cell are permanently deleted', () => {
    const availPath = path.resolve(
      __dirname,
      '..',
      'apps',
      'mobile',
      'src',
      'features',
      'availability'
    );
    assert.strictEqual(fs.existsSync(availPath), false, 'availability directory must be deleted');

    const cellPath = path.resolve(
      __dirname,
      '..',
      'apps',
      'api',
      'src',
      'cells',
      'availability'
    );
    assert.strictEqual(fs.existsSync(cellPath), false, 'apps/api availability cell must be deleted');
  });

  // 7. Asset Diet (Strictly 8 Canonical Tiles, each < 50KB)
  await suite.test('Asset Diet: Exactly 8 canonical tile images, each strictly under 50KB', () => {
    const tilesDir = path.resolve(__dirname, '..', 'apps', 'mobile', 'assets', 'tiles');
    assert.ok(fs.existsSync(tilesDir), 'apps/mobile/assets/tiles directory must exist');

    const files = fs.readdirSync(tilesDir).filter((f) => !f.startsWith('.'));
    assert.strictEqual(files.length, 8, `Expected exactly 8 canonical tile assets, found ${files.length}`);

    const expectedTiles = [
      'ref_triage_scope.webp',
      'ref_records.webp',
      'ref_pills_bottle.webp',
      'ref_hospital_bed.webp',
      'ref_thali.webp',
      'lifted_family.webp',
      'ref_booties.webp',
      'lifted_security.webp',
    ];

    for (const expected of expectedTiles) {
      assert.ok(files.includes(expected), `Missing canonical tile: ${expected}`);
    }

    const MAX_SIZE_BYTES = 50 * 1024; // 50KB
    for (const file of files) {
      const filePath = path.join(tilesDir, file);
      const stat = fs.statSync(filePath);
      const sizeKB = (stat.size / 1024).toFixed(2);
      assert.ok(
        stat.size < MAX_SIZE_BYTES,
        `Tile asset ${file} (${sizeKB} KB) exceeds the strict 50KB limit!`
      );
    }
  });

  // 8. Assistant Tool Registry Safety Rules
  await suite.test('Assistant Safety: Tool registry exposes NO OTP or check-in tool', async () => {
    const registry = await import('../apps/mobile/src/features/registry.ts');
    const features = registry.FEATURE_LIST;
    for (const f of features) {
      assert.doesNotMatch(
        (f.assistantSummary || '').toLowerCase(),
        /approve.*code|enter.*code.*nurse|bypass.*otp|auto.*approve|verify.*otp/i
      );
    }
  });

  // 9. Records Cell: Upload & Spine Audit Ledger
  await suite.test('Records Cell: Upload to problem folder and write RECORD_UPLOADED to Spine audit ledger', async (t) => {
    const { recordsService } = await import('../apps/api/src/cells/records/service.ts');
    const { auditLedger } = await import('../apps/api/src/spine/audit.ts');

    const testUpload = recordsService.uploadRecord(
      {
        title: 'Holter Monitoring 24hr',
        problemFolder: 'Cardiology',
        hospitalName: 'City Care Hospital',
        requiresHardCopy: true,
        summary: '24-hour ambulatory ECG monitoring revealed sinus rhythm with minimal PVCs.',
      },
      'patient_audit_rec_01',
      'patient_audit_rec_01'
    );

    assert.ok(testUpload.document.id.startsWith('doc_'));
    assert.strictEqual(testUpload.document.title, 'Holter Monitoring 24hr');
    assert.strictEqual(testUpload.document.problemFolder, 'Cardiology');
    assert.strictEqual(testUpload.document.isLatest, true);
    assert.strictEqual(testUpload.document.requiresHardCopy, true);

    const cardioFolder = testUpload.records.folders.find((f) => f.name === 'Cardiology');
    assert.ok(cardioFolder, 'Cardiology folder must exist');
    assert.ok(cardioFolder.documentCount >= 3, 'Cardiology document count must increment on upload');

    // Verify audit entry in spine
    const entries = auditLedger.getEntries();
    const uploadAudit = entries.find(
      (e) => e.action === 'RECORD_UPLOADED' && e.visitId === testUpload.document.id
    );
    assert.ok(uploadAudit, 'Audit ledger must record RECORD_UPLOADED action');
    assert.strictEqual(uploadAudit.patientId, 'patient_audit_rec_01');
    assert.strictEqual(uploadAudit.metadata.problemFolder, 'Cardiology');
  });

  // 10. Records Screen Implementation Check
  await suite.test('Records Screen: Zero FeatureScreenStub imports and uses FlatList with Sheet', () => {
    const recordsPath = path.resolve(
      __dirname,
      '..',
      'apps',
      'mobile',
      'src',
      'features',
      'records',
      'RecordsScreen.tsx'
    );
    assert.ok(fs.existsSync(recordsPath), 'RecordsScreen.tsx must exist');

    const content = fs.readFileSync(recordsPath, 'utf8');
    assert.strictEqual(
      content.includes('FeatureScreenStub'),
      false,
      'RecordsScreen.tsx must NOT import or use FeatureScreenStub!'
    );
    assert.ok(content.includes('FlatList'), 'RecordsScreen must use FlatList');
    assert.ok(content.includes('Sheet'), 'RecordsScreen must use Sheet primitive for document inspection & report upload');
  });

  // 11. Medicines Cell: Cart Update, Checkout Calculation & Audit Ledger
  await suite.test('Medicines Cell: Cart update, checkout calculation, and MEDICINE_ORDER_CREATED audit logging', async (t) => {
    const { medicinesService } = await import('../apps/api/src/cells/medicines/service.ts');
    const { auditLedger } = await import('../apps/api/src/spine/audit.ts');

    // 1. Update cart
    const cartRes = medicinesService.updateCart('med_metformin_500', 3, 'patient_cart_user_01');
    assert.ok(cartRes.cartItems.length > 0);
    const metItem = cartRes.cartItems.find((i) => i.medicineId === 'med_metformin_500');
    assert.ok(metItem, 'Metformin item must be in cart');
    assert.strictEqual(metItem.quantity, 3);
    assert.ok(cartRes.total > 0);

    // 2. Checkout
    const checkoutRes = medicinesService.checkout(
      {
        deliveryMode: 'doorstep',
        paymentMethod: 'upi',
        pharmacyName: 'City Care Pharmacy',
      },
      'patient_cart_user_01',
      'patient_cart_user_01'
    );

    assert.ok(checkoutRes.orderId.startsWith('FW-'));
    assert.strictEqual(checkoutRes.deliveryMode, 'doorstep');
    assert.strictEqual(checkoutRes.deliveryFee, 30.0);
    assert.strictEqual(checkoutRes.grandTotal, checkoutRes.itemsTotal + 30.0);
    assert.strictEqual(checkoutRes.pharmacyName, 'City Care Pharmacy');

    // 3. Verify audit ledger entry
    const entries = auditLedger.getEntries();
    const orderAudit = entries.find(
      (e) => e.action === 'MEDICINE_ORDER_CREATED' && e.visitId === checkoutRes.orderId
    );
    assert.ok(orderAudit, 'Audit ledger must record MEDICINE_ORDER_CREATED action');
    assert.strictEqual(orderAudit.patientId, 'patient_cart_user_01');
    assert.strictEqual(orderAudit.metadata.grandTotal, checkoutRes.grandTotal);
  });

  // 12. Cart Screen Implementation Check
  await suite.test('Cart Screen: Zero console.log dead ends and real checkout flow', () => {
    const cartPath = path.resolve(
      __dirname,
      '..',
      'apps',
      'mobile',
      'src',
      'app',
      'features',
      'cart.tsx'
    );
    assert.ok(fs.existsSync(cartPath), 'cart.tsx must exist');

    const content = fs.readFileSync(cartPath, 'utf8');
    assert.strictEqual(
      content.includes('console.log'),
      false,
      'cart.tsx must have ZERO console.log dead ends!'
    );
    assert.ok(content.includes('checkoutCart'), 'cart.tsx must call checkoutCart service');
    assert.ok(content.includes('Sheet'), 'cart.tsx must use Sheet primitive for payment confirmation');
    assert.ok(
      (content.includes('Minus') || content.includes('name="remove"')) &&
      (content.includes('Plus') || content.includes('name="add"')),
      'cart.tsx must render quantity steppers'
    );
  });

  // 13. FeatureScreenStub Permanent Deletion Check
  await suite.test('Stub Deletion: FeatureScreenStub.tsx permanently deleted and zero imports', () => {
    const stubPath = path.resolve(
      __dirname,
      '..',
      'apps',
      'mobile',
      'src',
      'features',
      'common',
      'FeatureScreenStub.tsx'
    );
    assert.strictEqual(
      fs.existsSync(stubPath),
      false,
      'FeatureScreenStub.tsx must be permanently deleted from the codebase!'
    );

    // Verify all feature screens do not mention FeatureScreenStub
    const scanFiles = [
      'apps/mobile/src/features/diet/DietScreen.tsx',
      'apps/mobile/src/features/maternal/MaternalCareScreen.tsx',
      'apps/mobile/src/features/family/FamilyAccessScreen.tsx',
      'apps/mobile/src/features/records/RecordsScreen.tsx',
      'apps/mobile/src/features/account/AccountScreen.tsx',
      'apps/mobile/src/app/(tabs)/index.tsx',
    ];

    for (const rel of scanFiles) {
      const full = path.resolve(__dirname, '..', rel);
      if (fs.existsSync(full)) {
        const text = fs.readFileSync(full, 'utf8');
        assert.strictEqual(
          text.includes('FeatureScreenStub'),
          false,
          `${rel} must not import or reference FeatureScreenStub!`
        );
      }
    }
  });

  // 14. Diet Cell Verification
  await suite.test('Diet Cell: Regional templates, calorie calculation & Spine audit logging', async (t) => {
    const { dietService } = await import('../apps/api/src/cells/diet/service.ts');
    const { auditLedger } = await import('../apps/api/src/spine/audit.ts');

    const deccanUrban = dietService.getDietData('Telugu / Deccan', 'urban');
    assert.strictEqual(deccanUrban.region, 'Telugu / Deccan');
    assert.strictEqual(deccanUrban.setting, 'urban');
    assert.ok(deccanUrban.doctorRestrictions.length >= 2, 'Must include doctor restrictions');
    assert.ok(deccanUrban.meals.length >= 4, 'Must include 4 meal slots');

    // Toggle meal
    const toggled = dietService.toggleMeal(
      { mealId: 'm_snack', logged: true },
      'Telugu / Deccan',
      'urban',
      'patient_diet_test_01',
      'patient_diet_test_01'
    );

    const snackMeal = toggled.meals.find((m) => m.id === 'm_snack');
    assert.ok(snackMeal, 'Snack meal slot must exist');
    assert.strictEqual(snackMeal.logged, true);
    assert.ok(toggled.dailyTargets.caloriesConsumed > 0);

    // Check audit ledger entry
    const entries = auditLedger.getEntries();
    const dietAudit = entries.find(
      (e) => e.action === 'MEAL_LOGGED' && e.patientId === 'patient_diet_test_01'
    );
    assert.ok(dietAudit, 'Spine audit ledger must contain MEAL_LOGGED event');
  });

  // 15. Maternal & Family Cells Verification
  await suite.test('Maternal & Family Cells: NIS milestones, caregiver grants/revocations & audit logging', async (t) => {
    const { maternalService } = await import('../apps/api/src/cells/maternal/service.ts');
    const { familyService } = await import('../apps/api/src/cells/family/service.ts');
    const { auditLedger } = await import('../apps/api/src/spine/audit.ts');

    // Maternal test
    const maternalData = maternalService.getMaternalData();
    assert.ok(maternalData.stage.includes('Week 26'));
    assert.ok(maternalData.milestones.length >= 6);
    assert.ok(maternalData.physicalDocuments.length >= 2);

    const toggleMaternal = maternalService.toggleVaccine(
      { milestoneId: 'mil_td2', completed: true },
      'nurse_anc_01',
      'patient_maternal_test_01'
    );
    assert.strictEqual(toggleMaternal.milestone.completed, true);

    const maternalAudit = auditLedger.getEntries().find(
      (e) => e.action === 'MATERNAL_VACCINE_TOGGLED' && e.visitId === 'mil_td2'
    );
    assert.ok(maternalAudit, 'Audit ledger must record MATERNAL_VACCINE_TOGGLED');

    // Family test
    const familyData = familyService.getFamilyData();
    assert.ok(familyData.caregivers.length >= 3);
    assert.ok(familyData.auditLog.length >= 4);

    // Add family member
    const newMember = familyService.addMember(
      { name: 'Dr. K. Srinivas', relation: 'Brother', phone: '+91 98482 11099' },
      'patient_family_test_01',
      'patient_family_test_01'
    );
    assert.strictEqual(newMember.caregiver.name, 'Dr. K. Srinivas');
    assert.strictEqual(newMember.caregiver.accessLevel, 'view_records');

    const addAudit = auditLedger.getEntries().find(
      (e) => e.action === 'FAMILY_MEMBER_ADDED' && e.visitId === newMember.caregiver.id
    );
    assert.ok(addAudit, 'Audit ledger must record FAMILY_MEMBER_ADDED');

    // Toggle caregiver access
    const toggledAccess = familyService.toggleAccess(
      { caregiverId: newMember.caregiver.id, accessLevel: 'revoked' },
      'patient_family_test_01',
      'patient_family_test_01'
    );
    assert.strictEqual(toggledAccess.caregiver.accessLevel, 'revoked');

    const revokeAudit = auditLedger.getEntries().find(
      (e) => e.action === 'FAMILY_ACCESS_UPDATED' && e.visitId === newMember.caregiver.id
    );
    assert.ok(revokeAudit, 'Audit ledger must record FAMILY_ACCESS_UPDATED');
  });

  // 16. Spine Assistant Safety Rules Verification
  await suite.test('Spine Assistant Safety Rules: Emergency 108 prompt, OTP protection, and proposal-first execution', async (t) => {
    const { processAssistantMessage } = await import('../apps/api/src/spine/assistant.ts');

    // 1. Emergency rule
    const emergencyRes = processAssistantMessage({ message: 'Patient has severe chest pain and breathlessness' });
    assert.strictEqual(emergencyRes.isEmergency, true);
    assert.match(emergencyRes.reply, /108/);
    assert.strictEqual(emergencyRes.proposal, null);

    // 2. OTP refusal rule
    const otpRes = processAssistantMessage({ message: 'Enter consultation OTP code 123456 for me' });
    assert.strictEqual(otpRes.isEmergency, false);
    assert.match(otpRes.reply, /Check-in screen/i);
    assert.strictEqual(otpRes.proposal, null);

    // 3. Mutating intent: Doctor Booking Proposal
    const bookRes = processAssistantMessage({ message: 'Book an appointment with cardiologist' });
    assert.strictEqual(bookRes.isEmergency, false);
    assert.ok(bookRes.proposal !== null, 'Mutating action must return a proposal, not auto-execute');
    assert.strictEqual(bookRes.proposal.toolName, 'book_appointment');
    assert.strictEqual(bookRes.proposal.targetRoute, '/(tabs)/doctors');

    // 4. Mutating intent: Medicine Refill Proposal
    const refillRes = processAssistantMessage({ message: 'Refill Metformin pills' });
    assert.strictEqual(refillRes.isEmergency, false);
    assert.ok(refillRes.proposal !== null, 'Refill request must return a proposal');
    assert.strictEqual(refillRes.proposal.toolName, 'add_to_cart');
    assert.strictEqual(refillRes.proposal.targetRoute, '/features/cart');

    // 5. Read-only navigation
    const recRes = processAssistantMessage({ message: 'View my medical records' });
    assert.strictEqual(recRes.isEmergency, false);
    assert.strictEqual(recRes.proposal, null);
    assert.ok(recRes.immediateAction !== null);
    assert.strictEqual(recRes.immediateAction.route, '/(tabs)/records');
  });

  // 17. Onboarding Flow, Localized Dictionaries & Diet Sync Verification
  await suite.test('Onboarding: Telugu + Rural + High BP configures Diet cell and persists profile', async (t) => {
    const { dietService } = await import('../apps/api/src/cells/diet/service.ts');
    const { TRANSLATIONS, LANGUAGE_OPTIONS } = await import('../apps/mobile/src/features/onboarding/translations.ts');

    // 1. Verify 8 languages dictionary
    const supportedLangs = ['en', 'te', 'hi', 'ta', 'kn', 'ml', 'mr', 'bn'];
    assert.strictEqual(LANGUAGE_OPTIONS.length, 8, 'Must have exactly 8 regional language options');
    for (const lang of supportedLangs) {
      assert.ok(TRANSLATIONS[lang], `Translation dictionary for "${lang}" must exist`);
      assert.ok(TRANSLATIONS[lang].selectLanguageTitle.length > 0);
      assert.ok(TRANSLATIONS[lang].step1Title.length > 0);
      assert.ok(TRANSLATIONS[lang].finish.length > 0);
    }

    // 2. Test Onboarding Diet Sync: Telugu + Rural + High BP (Cardiology consult)
    const syncedDiet = dietService.getDietData('Telugu / Deccan', 'rural');
    assert.strictEqual(syncedDiet.region, 'Telugu / Deccan');
    assert.strictEqual(syncedDiet.setting, 'rural');
    assert.ok(syncedDiet.meals.length === 4, 'Must have 4 meal slots');
    assert.ok(syncedDiet.meals[0].items.includes('Jowar'), 'Rural Telugu breakfast should feature Jowar');
    assert.ok(syncedDiet.meals[1].items.includes('Jowar roti'), 'Rural Telugu lunch should feature Jowar roti');

    // Clinical restriction check
    const sodiumRule = syncedDiet.doctorRestrictions.find((r) => r.id === 'res_sodium');
    assert.ok(sodiumRule, 'Hypertension condition must automatically enforce low sodium restriction');
    assert.strictEqual(syncedDiet.dailyTargets.sodiumLimitMg, 1500);

    // 3. Verify Onboarding Architecture & Components
    const langSelectPath = path.resolve(__dirname, '..', 'apps', 'mobile', 'src', 'features', 'onboarding', 'LanguageSelectStep.tsx');
    const questionPath = path.resolve(__dirname, '..', 'apps', 'mobile', 'src', 'features', 'onboarding', 'QuestionnaireStep.tsx');
    const flowPath = path.resolve(__dirname, '..', 'apps', 'mobile', 'src', 'features', 'onboarding', 'OnboardingFlow.tsx');
    const doodlePath = path.resolve(__dirname, '..', 'apps', 'mobile', 'src', 'features', 'onboarding', 'MonumentDoodle.tsx');
    const storagePath = path.resolve(__dirname, '..', 'apps', 'mobile', 'src', 'features', 'onboarding', 'onboardingStorage.ts');

    assert.ok(fs.existsSync(langSelectPath), 'LanguageSelectStep.tsx must exist');
    assert.ok(fs.existsSync(questionPath), 'QuestionnaireStep.tsx must exist');
    assert.ok(fs.existsSync(flowPath), 'OnboardingFlow.tsx must exist');
    assert.ok(fs.existsSync(doodlePath), 'MonumentDoodle.tsx must exist');
    assert.ok(fs.existsSync(storagePath), 'onboardingStorage.ts must exist');

    // 4. Verify Fade Transition & Senior Mode triggering in code
    const flowCode = fs.readFileSync(flowPath, 'utf8');
    assert.ok(flowCode.includes('Animated.timing'), 'OnboardingFlow must use Animated.timing for fade');
    assert.ok(flowCode.includes('400'), 'OnboardingFlow fade transition must be 400ms');

    const questionCode = fs.readFileSync(questionPath, 'utf8');
    assert.ok(questionCode.includes("setMode('elderly')"), 'QuestionnaireStep must trigger elderly mode when 60+ Senior chosen');

    // 5. Verify AccountScreen & HomeScreen integration
    const accountCode = fs.readFileSync(path.resolve(__dirname, '..', 'apps', 'mobile', 'src', 'features', 'account', 'AccountScreen.tsx'), 'utf8');
    assert.ok(accountCode.includes('Change language / Redo setup'), 'AccountScreen must have redo setup action');
    assert.ok(accountCode.includes('OnboardingFlow'), 'AccountScreen must render OnboardingFlow for demo');

    const homeCode = fs.readFileSync(path.resolve(__dirname, '..', 'apps', 'mobile', 'src', 'app', '(tabs)', 'index.tsx'), 'utf8');
    assert.ok(homeCode.includes('patientBar'), 'HomeScreen must display dynamic patient profile bar');
  });

  // 18. Family Person Model, Approval Gate, Duplicate Rejection & Data Switcher
  await suite.test('Family: Person Model, Approval Gate, Duplicate Rejection & Data Switcher', async (t) => {
    const { familyService } = await import('../apps/api/src/cells/family/service.ts');
    const { recordsService } = await import('../apps/api/src/cells/records/service.ts');
    const { doctorsStore } = await import('../apps/api/src/cells/doctors/store.ts');
    const { auditLedger } = await import('../apps/api/src/spine/audit.ts');

    // 1. Child added directly with active status
    const childRes = familyService.addPerson({
      name: 'Baby Ananya',
      relation: 'Daughter',
      ageBand: 'child',
    });
    assert.strictEqual(childRes.person.status, 'active');
    assert.strictEqual(childRes.person.approvalCode, undefined);

    // 2. Adult stays pending until approved
    const adultRes = familyService.addPerson({
      name: 'Ravi Prasad',
      relation: 'Brother',
      ageBand: 'adult',
      phone: '+91 99880 11223',
    });
    assert.strictEqual(adultRes.person.status, 'waiting_approval');
    assert.strictEqual(adultRes.person.approvalCode, '4821');

    // Approve the adult
    const approvedRes = familyService.approvePerson(adultRes.person.id, '4821');
    assert.strictEqual(approvedRes.person.status, 'active');
    assert.strictEqual(approvedRes.person.approvalCode, undefined);

    // 3. Duplicates are rejected
    // Same phone number
    assert.throws(
      () =>
        familyService.addPerson({
          name: 'Another Person',
          relation: 'Cousin',
          ageBand: 'adult',
          phone: '+91 99880 11223',
        }),
      /DUPLICATE_PHONE/
    );

    // Same name and relation
    assert.throws(
      () =>
        familyService.addPerson({
          name: 'Ravi Prasad',
          relation: 'Brother',
          ageBand: 'adult',
          phone: '+91 91234 56789',
        }),
      /DUPLICATE_PERSON/
    );

    // 4. Switching person changes the data shown
    // Owner data
    const ownerRecords = recordsService.getRecordsData('patient_std_01');
    const ownerVisits = doctorsStore.getBookings('patient_std_01');

    // Arjun (Child) data
    const arjunRecords = recordsService.getRecordsData('person_arjun');
    const arjunVisits = doctorsStore.getBookings('person_arjun');

    // Verify documents differ between persons
    assert.ok(ownerRecords.documents.some((d) => d.title.includes('Cardiac 2D Echo')));
    assert.ok(!arjunRecords.documents.some((d) => d.title.includes('Cardiac 2D Echo')));
    assert.ok(arjunRecords.documents.some((d) => d.title.includes('Pediatric Immunization Record')));

    // Verify visits differ between persons
    assert.ok(ownerVisits.some((v) => v.doctorName.includes('Dr. K. Srinivas')));
    assert.ok(arjunVisits.some((v) => v.patientName === 'Arjun Prasad'));
    assert.strictEqual(arjunVisits[0].doctorName, 'Dr. Ananya Reddy');

    // 5. Verify Mobile Implementations (FamilyService, Home Switcher, Account Tile Grid)
    const mobileFamilyService = fs.readFileSync(
      path.resolve(__dirname, '..', 'apps', 'mobile', 'src', 'services', 'familyService.ts'),
      'utf8'
    );
    assert.ok(mobileFamilyService.includes('setActivePersonId'));
    assert.ok(mobileFamilyService.includes('getActivePerson'));
    assert.ok(mobileFamilyService.includes('getActivePersonId'));

    const homeCode = fs.readFileSync(
      path.resolve(__dirname, '..', 'apps', 'mobile', 'src', 'app', '(tabs)', 'index.tsx'),
      'utf8'
    );
    assert.ok(homeCode.includes('Viewing:'));
    assert.ok(homeCode.includes('Switch active person'));

    const accountCode = fs.readFileSync(
      path.resolve(__dirname, '..', 'apps', 'mobile', 'src', 'features', 'account', 'AccountScreen.tsx'),
      'utf8'
    );
    assert.ok(accountCode.includes('My visits'));
    assert.ok(accountCode.includes('Documents'));
    assert.ok(accountCode.includes('gridRow') || accountCode.includes('gridContainer'));
  });

  // 19. Storage Failure & Fallback Resilience
  await suite.test('Storage Failure & Fallback Resilience', async (t) => {
    const { createRequire } = require('node:module');
    const req = createRequire(path.resolve(__dirname, '../apps/mobile/src/services/storage.ts'));
    const ast = req('@react-native-async-storage/async-storage');
    const storageModule = ast.default || ast;

    const { getStorageItem, setStorageItem, removeStorageItem } = await import('../apps/mobile/src/services/storage.ts');

    // Save original methods
    const originalGetItem = storageModule.getItem;
    const originalSetItem = storageModule.setItem;
    const originalRemoveItem = storageModule.removeItem;

    try {
      // Mock AsyncStorage to fail hard
      storageModule.getItem = async () => {
        throw new Error('TurboModule storage error [simulated]');
      };
      storageModule.setItem = async () => {
        throw new Error('Native write failure [simulated]');
      };
      storageModule.removeItem = async () => {
        throw new Error('Native remove failure [simulated]');
      };

      await t.test('getStorageItem returns default value and never throws when native storage fails', async () => {
        const defaultValue = { items: ['default_pill'], count: 1 };
        let thrown = false;
        let result = null;
        try {
          result = await getStorageItem('failing_test_key_uninitialized', defaultValue);
        } catch (e) {
          thrown = true;
        }
        assert.strictEqual(thrown, false, 'getStorageItem must NEVER throw into UI/caller');
        assert.deepStrictEqual(result, defaultValue, 'Must safely return provided default value');
      });

      await t.test('setStorageItem stores in memory fallback and does not throw when native write fails', async () => {
        let setThrown = false;
        try {
          await setStorageItem('test_fallback_key', { saved: true, user: 'Dev' });
        } catch (e) {
          setThrown = true;
        }
        assert.strictEqual(setThrown, false, 'setStorageItem must NEVER throw when native write fails');

        // Reading back should recover the in-memory fallback even though native AsyncStorage is still failing
        const recovered = await getStorageItem('test_fallback_key', { saved: false });
        assert.deepStrictEqual(recovered, { saved: true, user: 'Dev' });
      });

      await t.test('removeStorageItem clears in-memory fallback and does not throw', async () => {
        let removeThrown = false;
        try {
          await removeStorageItem('test_fallback_key');
        } catch (e) {
          removeThrown = true;
        }
        assert.strictEqual(removeThrown, false, 'removeStorageItem must NEVER throw');

        const postRemove = await getStorageItem('test_fallback_key', { defaultValueAfterRemove: 42 });
        assert.deepStrictEqual(postRemove, { defaultValueAfterRemove: 42 });
      });
    } finally {
      // Restore original methods
      storageModule.getItem = originalGetItem;
      storageModule.setItem = originalSetItem;
      storageModule.removeItem = originalRemoveItem;
    }
  });

  // 20. Assistant Shared State Wiring & Name Persistence Verification
  await suite.test('Assistant Shared State Wiring & Name Persistence Verification', async (t) => {
    const { fetchDiet, getCachedDiet } = await import('../apps/mobile/src/services/dietService.ts');
    const { executeAssistantAction } = await import('../apps/mobile/src/services/assistantService.ts');
    const { updateSelfPersonName, getActivePerson } = await import('../apps/mobile/src/services/familyService.ts');
    const { fetchPatientVisits, submitDoctorBooking } = await import('../apps/mobile/src/services/triageService.ts');
    const { fetchRecords } = await import('../apps/mobile/src/services/recordsService.ts');

    await t.test('1. Logging a 520 kcal meal via the assistant increments the Diet state total by 520', async () => {
      const initialDiet = await fetchDiet();
      const initialCalories = initialDiet.dailyTargets.caloriesConsumed;

      const res = await executeAssistantAction('log_meal', { calories: 520, mealName: 'Lunch' });
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.result.dailyTargets.caloriesConsumed, initialCalories + 520);

      const cached = getCachedDiet();
      assert.ok(cached);
      assert.strictEqual(cached.dailyTargets.caloriesConsumed, initialCalories + 520);
    });

    await t.test('2. Updating the user\'s name to "Tejas" updates the SELF patient name in new bookings', async () => {
      await updateSelfPersonName('Tejas');
      const activePerson = await getActivePerson();
      assert.strictEqual(activePerson.name, 'Tejas');
      assert.strictEqual(activePerson.isOwner, true);

      // Submit new booking for self
      const booking = await submitDoctorBooking(
        'doc_genmed_02',
        'Dr. K. Srinivas',
        'Deccan Health Institute',
        'Internal Medicine',
        'Room 102',
        activePerson.id,
        activePerson.name,
        'slot_test_self_01',
        'Tomorrow',
        '10:00 AM'
      );

      assert.strictEqual(booking.patientName, 'Tejas');
      assert.strictEqual(booking.patientId, activePerson.id);
    });

    await t.test('3. Completing the assistant\'s "Book a cardiologist" flow adds an Upcoming visit and switches the Records checklist to Cardiology items', async () => {
      const activePerson = await getActivePerson();
      const bookRes = await executeAssistantAction('book_appointment', {
        doctorId: 'doc_cardio_01',
        doctorName: 'Dr. P. V. Ramana Rao',
        hospitalName: 'City Care Hospital',
        department: 'Cardiology',
        room: 'Room 204',
        patientId: activePerson.id,
        patientName: activePerson.name,
        slotId: 'slot_cardio_flow_01',
        date: 'Today',
        time: '4:30 PM',
      });

      assert.strictEqual(bookRes.success, true);
      assert.strictEqual(bookRes.result.booking.department, 'Cardiology');
      assert.strictEqual(bookRes.result.booking.patientName, 'Tejas');
      assert.strictEqual(bookRes.result.booking.status, 'confirmed');

      // Verify Upcoming visit is added to visits list
      const visits = await fetchPatientVisits(activePerson.id);
      const upcomingCardio = visits.find(
        (v) => v.department === 'Cardiology' && (v.status === 'confirmed' || v.status === 'requested')
      );
      assert.ok(upcomingCardio, 'Upcoming cardiology visit must exist in patient visits');

      // Verify Records checklist has been switched to Cardiology items
      const records = await fetchRecords();
      const labels = records.visitChecklist.map((c) => c.label);
      assert.ok(
        labels.some((l) => l.includes('12-lead ECG printout')),
        'Checklist must include "Recent 12-lead ECG printout"'
      );
      assert.ok(
        labels.some((l) => l.includes('cardiology consultation summary')),
        'Checklist must include "Past cardiology consultation summary"'
      );
    });
  });
});


