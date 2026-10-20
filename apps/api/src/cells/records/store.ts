import type {
  RecordFolder,
  MedicalDocument,
  VisitChecklistItem,
} from '../../../../../packages/contracts/src/records.ts';

export class RecordsStore {
  private folders: RecordFolder[] = [
    {
      id: 'fld_cardio',
      name: 'Cardiology',
      documentCount: 2,
      latestDate: '12 Oct 2026',
    },
    {
      id: 'fld_general',
      name: 'General & Lab',
      documentCount: 2,
      latestDate: '08 Oct 2026',
    },
    {
      id: 'fld_imaging',
      name: 'Imaging & Scans',
      documentCount: 1,
      latestDate: '28 Sep 2026',
    },
    {
      id: 'fld_discharge',
      name: 'Discharge & Summary',
      documentCount: 1,
      latestDate: '14 Aug 2026',
    },
  ];

  private documents: MedicalDocument[] = [
    {
      id: 'doc_cardio_echo',
      patientId: 'patient_std_01',
      title: 'Cardiac 2D Echo & Doppler',
      problemFolder: 'Cardiology',
      hospitalName: 'City Care Hospital',
      date: '12 Oct 2026',
      isLatest: true,
      summaryMetrics: 'EF: 58% • Stable',
      requiresHardCopy: true,
      summary: 'Normal left ventricular systolic function. Mild mitral regurgitation noted without structural wall motion abnormality.',
      keyFindings: {
        'Ejection Fraction': '58% (Normal: 55-70%)',
        'Mitral Valve': 'Mild regurgitation',
        'Aortic Root': '3.1 cm (Normal)',
      },
      doctorName: 'Dr. P. V. Ramana Rao',
    },
    {
      id: 'doc_cardio_ecg',
      patientId: 'patient_std_01',
      title: '12-Lead Resting ECG',
      problemFolder: 'Cardiology',
      hospitalName: 'City Care Hospital',
      date: '22 Sep 2026',
      isLatest: false,
      summaryMetrics: 'Sinus Rhythm • 72 bpm',
      requiresHardCopy: true,
      summary: 'Normal sinus rhythm, normal axis, no acute ST-T changes.',
      keyFindings: {
        'Heart Rate': '72 bpm',
        'PR Interval': '158 ms',
        'QRS Duration': '88 ms',
      },
      doctorName: 'Dr. P. V. Ramana Rao',
    },
    {
      id: 'doc_lab_lipid',
      patientId: 'patient_std_01',
      title: 'Fasting Lipid Profile',
      problemFolder: 'General & Lab',
      hospitalName: 'Metro Diagnostic Center',
      date: '08 Oct 2026',
      isLatest: true,
      summaryMetrics: 'LDL: 118 mg/dL • Improving',
      requiresHardCopy: false,
      summary: 'Serum lipid levels measured after 12-hour fast. Significant improvement compared to July baseline.',
      keyFindings: {
        'Total Cholesterol': '184 mg/dL (< 200)',
        'LDL Cholesterol': '118 mg/dL (Target < 100)',
        'HDL Cholesterol': '44 mg/dL (> 40)',
        'Triglycerides': '146 mg/dL (< 150)',
      },
      doctorName: 'Dr. Ananya Deshmukh',
    },
    {
      id: 'doc_lab_cbc',
      patientId: 'patient_std_01',
      title: 'Complete Blood Count & HbA1c',
      problemFolder: 'General & Lab',
      hospitalName: 'Sunrise Diagnostic Labs',
      date: '18 Sep 2026',
      isLatest: true,
      summaryMetrics: 'HbA1c: 6.8% • Controlled',
      requiresHardCopy: false,
      summary: 'Haemoglobin within standard limits. Glycemic control stable under current oral medication.',
      keyFindings: {
        'Haemoglobin': '13.8 g/dL (13.0-17.0)',
        'HbA1c': '6.8% (Target < 7.0%)',
        'Platelets': '240,000 /mcL',
      },
      doctorName: 'Dr. Ananya Deshmukh',
    },
    {
      id: 'doc_scan_chest',
      patientId: 'patient_std_01',
      title: 'Chest X-Ray PA View',
      problemFolder: 'Imaging & Scans',
      hospitalName: 'City Care Hospital',
      date: '28 Sep 2026',
      isLatest: true,
      summaryMetrics: 'Clear Lung Fields • Normal',
      requiresHardCopy: false,
      summary: 'Both lung fields are clear. Costophrenic angles are sharp. Cardiothoracic ratio is normal.',
      keyFindings: {
        'Lungs': 'Clear fields bilaterally',
        'Cardiothoracic Ratio': 'Normal (< 0.5)',
        'Bony Thorax': 'Intact',
      },
      doctorName: 'Dr. P. V. Ramana Rao',
    },
    {
      id: 'doc_discharge_aug',
      patientId: 'patient_std_01',
      title: 'Post-Angiogram Discharge Summary',
      problemFolder: 'Discharge & Summary',
      hospitalName: 'City Care Community Hospital',
      date: '14 Aug 2026',
      isLatest: true,
      summaryMetrics: 'Discharged Stable',
      requiresHardCopy: true,
      summary: 'Diagnostic coronary angiogram showed minor non-obstructive coronary disease. Conservative medical management recommended.',
      keyFindings: {
        'Procedure': 'Coronary Angiogram via right radial',
        'LAD': '20% proximal irregularity',
        'Recommendation': 'Dual antiplatelet therapy for 6 months',
      },
      doctorName: 'Dr. Srinivas Murthy',
    },
    {
      id: 'doc_arjun_vaccine',
      patientId: 'person_arjun',
      title: 'Pediatric Immunization Record',
      problemFolder: 'General & Lab',
      hospitalName: 'Sunrise Child Clinic',
      date: '02 Oct 2026',
      isLatest: true,
      summaryMetrics: 'MMR & DTP Up to Date',
      requiresHardCopy: true,
      summary: 'Age-appropriate immunization completed. Next booster scheduled at 5 years.',
      keyFindings: {
        'Vaccine': 'MMR Booster 2',
        'Site': 'Left Anterolateral Thigh',
        'Batch': 'VAX-2026-901',
      },
      doctorName: 'Dr. Ananya Reddy',
    },
    {
      id: 'doc_arjun_growth',
      patientId: 'person_arjun',
      title: 'Child Growth & Developmental Assessment',
      problemFolder: 'General & Lab',
      hospitalName: 'Sunrise Child Clinic',
      date: '15 Sep 2026',
      isLatest: true,
      summaryMetrics: 'Weight 16.2 kg • 65th Percentile',
      requiresHardCopy: false,
      summary: 'Growth parameters within normal percentiles. Milestones normal for age.',
      keyFindings: {
        'Weight': '16.2 kg (65th percentile)',
        'Height': '104 cm (70th percentile)',
        'Development': 'Milestones age-appropriate',
      },
      doctorName: 'Dr. Ananya Reddy',
    },
  ];

  private visitChecklist: VisitChecklistItem[] = [
    {
      id: 'chk_abha',
      label: 'Aadhaar / ABHA ID card (Digital or Card)',
      checked: true,
      requiresPaper: false,
    },
    {
      id: 'chk_ecg_paper',
      label: 'Previous ECG printout (Hard copy required)',
      checked: false,
      requiresPaper: true,
    },
    {
      id: 'chk_pills',
      label: 'Current pill strips & prescription bottles',
      checked: true,
      requiresPaper: false,
    },
    {
      id: 'chk_discharge_paper',
      label: 'Discharge summary from August visit (Hard copy)',
      checked: false,
      requiresPaper: true,
    },
  ];

  public getFolders(): RecordFolder[] {
    return [...this.folders];
  }

  public getDocuments(patientId?: string): MedicalDocument[] {
    if (patientId) {
      return this.documents.filter((d) => d.patientId === patientId);
    }
    return [...this.documents];
  }

  public getDocumentById(id: string): MedicalDocument | undefined {
    return this.documents.find((d) => d.id === id);
  }

  public getVisitChecklist(): VisitChecklistItem[] {
    return [...this.visitChecklist];
  }

  public toggleChecklistItem(id: string, checked?: boolean): VisitChecklistItem {
    const item = this.visitChecklist.find((c) => c.id === id);
    if (!item) {
      throw new Error(`Checklist item ${id} not found`);
    }
    item.checked = checked !== undefined ? checked : !item.checked;
    return { ...item };
  }

  public addDocument(doc: MedicalDocument): MedicalDocument {
    // If the new document is marked latest, older documents in the same folder with the same title are superseded
    if (doc.isLatest) {
      this.documents.forEach((d) => {
        if (d.problemFolder === doc.problemFolder && d.title.toLowerCase() === doc.title.toLowerCase()) {
          d.isLatest = false;
        }
      });
    }

    this.documents.unshift(doc);

    // Update or create folder count
    const existingFolder = this.folders.find(
      (f) => f.name.toLowerCase() === doc.problemFolder.toLowerCase()
    );
    if (existingFolder) {
      existingFolder.documentCount += 1;
      existingFolder.latestDate = doc.date;
    } else {
      this.folders.push({
        id: `fld_${Date.now()}`,
        name: doc.problemFolder,
        documentCount: 1,
        latestDate: doc.date,
      });
    }

    return doc;
  }
}

export const recordsStore = new RecordsStore();
