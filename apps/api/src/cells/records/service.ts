import type {
  RecordsDataResponse,
  RecordUploadRequest,
  MedicalDocument,
  ChecklistToggleRequest,
  VisitChecklistItem,
} from '../../../../../packages/contracts/src/records.ts';
import { recordsStore } from './store.ts';
import { auditLedger } from '../../spine/audit.ts';

export class RecordsService {
  public getRecordsData(patientId?: string): RecordsDataResponse {
    return {
      folders: recordsStore.getFolders(),
      documents: recordsStore.getDocuments(patientId),
      visitChecklist: recordsStore.getVisitChecklist(),
    };
  }

  public uploadRecord(
    req: RecordUploadRequest,
    actor = 'patient_std_01',
    patientId = 'patient_std_01'
  ): { document: MedicalDocument; records: RecordsDataResponse } {
    if (!req.title || !req.title.trim()) {
      throw new Error('Document title is required');
    }
    if (!req.problemFolder || !req.problemFolder.trim()) {
      throw new Error('Problem folder is required');
    }

    const docId = `doc_${Date.now()}_${Math.floor(Math.random() * 900 + 100)}`;
    const today = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedDate = `${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;

    const newDoc: MedicalDocument = {
      id: docId,
      title: req.title.trim(),
      problemFolder: req.problemFolder.trim(),
      hospitalName: req.hospitalName || 'City Care Hospital',
      date: formattedDate,
      isLatest: true,
      summaryMetrics: req.summaryMetrics || 'Verified • Uploaded today',
      requiresHardCopy: Boolean(req.requiresHardCopy),
      summary: req.summary || 'Patient uploaded clinical report for upcoming hospital consultation.',
      keyFindings: req.keyFindings || {
        'Status': 'Uploaded',
        'Source': req.hospitalName || 'City Care Hospital',
      },
    };

    recordsStore.addDocument(newDoc);

    // Record entry in append-only Spine audit ledger
    auditLedger.recordEntry({
      action: 'RECORD_UPLOADED',
      patientId,
      visitId: newDoc.id,
      actor,
      metadata: {
        documentId: newDoc.id,
        title: newDoc.title,
        problemFolder: newDoc.problemFolder,
        hospitalName: newDoc.hospitalName,
        requiresHardCopy: newDoc.requiresHardCopy,
      },
    });

    return {
      document: newDoc,
      records: this.getRecordsData(),
    };
  }

  public toggleChecklistItem(
    req: ChecklistToggleRequest,
    actor = 'patient_std_01',
    patientId = 'patient_std_01'
  ): { item: VisitChecklistItem; checklist: VisitChecklistItem[] } {
    const updated = recordsStore.toggleChecklistItem(req.itemId, req.checked);

    auditLedger.recordEntry({
      action: 'CHECKLIST_TOGGLED',
      patientId,
      visitId: req.itemId,
      actor,
      metadata: {
        itemId: updated.id,
        label: updated.label,
        checked: updated.checked,
      },
    });

    return {
      item: updated,
      checklist: recordsStore.getVisitChecklist(),
    };
  }
}

export const recordsService = new RecordsService();
