import type {
  MaternalMilestone,
  PhysicalDocumentCheck,
  MaternalDataResponse,
} from '../../../../../packages/contracts/src/maternal.ts';

export class MaternalStore {
  private stage = 'Week 26 • Second Trimester';
  private gestationalWeeks = 26;
  private trimesterAlert = 'Glucose Challenge Test recommended between Weeks 24-28.';
  private pmsmaBanner = 'Free ANC check-up on the 9th of every month under PMSMA';

  private milestones: MaternalMilestone[] = [
    {
      id: 'mil_td1',
      name: 'Tetanus & Diphtheria (Td-1)',
      category: 'trimester_1',
      scheduleWindow: 'Early pregnancy / Week 12',
      hospitalCounter: 'City Care Hospital • Immunization OPD',
      completed: true,
      dueDate: '14 Aug 2026',
      notes: 'Administered in left deltoid.',
    },
    {
      id: 'mil_scan_anomaly',
      name: 'Anomaly Ultrasound Scan',
      category: 'trimester_2',
      scheduleWindow: 'Weeks 18-20',
      hospitalCounter: 'Metro Diagnostic Center',
      completed: true,
      dueDate: '22 Sep 2026',
      notes: 'Fetal anatomy normal. Hard copy report archived.',
    },
    {
      id: 'mil_td2',
      name: 'Tetanus & Diphtheria (Td-2)',
      category: 'trimester_2',
      scheduleWindow: '4 weeks after Td-1 (Week 26-28)',
      hospitalCounter: 'City Care Hospital • Immunization OPD',
      completed: false,
      dueDate: '24 Oct 2026',
      notes: 'Second dose essential for maternal-neonatal immunity.',
    },
    {
      id: 'mil_gtt',
      name: 'Oral Glucose Tolerance Test (OGTT)',
      category: 'trimester_2',
      scheduleWindow: 'Weeks 24-28 screening',
      hospitalCounter: 'Sunrise Diagnostic Labs',
      completed: false,
      dueDate: '28 Oct 2026',
      notes: 'Fasting + 2hr post 75g glucose drink.',
    },
    {
      id: 'mil_growth_scan',
      name: 'Third Trimester Growth Doppler Scan',
      category: 'trimester_3',
      scheduleWindow: 'Weeks 32-34',
      hospitalCounter: 'City Care Hospital • Radiology',
      completed: false,
      dueDate: '28 Nov 2026',
      notes: 'Evaluates fetal growth velocity and amniotic fluid index.',
    },
    {
      id: 'mil_bcg',
      name: 'BCG (Bacillus Calmette-Guérin)',
      category: 'newborn',
      scheduleWindow: 'At birth / within first 48 hours',
      hospitalCounter: 'Maternity Ward Delivery Suite',
      completed: false,
      dueDate: 'At delivery',
      notes: 'Single dose intradermal for tuberculosis protection.',
    },
    {
      id: 'mil_opv0',
      name: 'Oral Polio Vaccine (OPV-0)',
      category: 'newborn',
      scheduleWindow: 'At birth',
      hospitalCounter: 'Maternity Ward Delivery Suite',
      completed: false,
      dueDate: 'At delivery',
      notes: '2 oral drops.',
    },
    {
      id: 'mil_hepb',
      name: 'Hepatitis B (Birth Dose)',
      category: 'newborn',
      scheduleWindow: 'Within 24 hours of birth',
      hospitalCounter: 'Maternity Ward Delivery Suite',
      completed: false,
      dueDate: 'At delivery',
      notes: 'Intramuscular dose for perinatal protection.',
    },
  ];

  private physicalDocuments: PhysicalDocumentCheck[] = [
    {
      id: 'doc_mcp_yellow',
      title: 'Mother & Child Protection (MCP) Yellow Card',
      subtitle: 'Original paper booklet issued by PHC / Hospital. Required at every visit.',
      hasPhysicalCopy: true,
    },
    {
      id: 'doc_usg_printout',
      title: 'Anomaly Scan Printout (Thermal sheets)',
      subtitle: 'Required by obstetrician for comparative growth evaluation.',
      hasPhysicalCopy: true,
    },
  ];

  public getMaternalData(): MaternalDataResponse {
    return {
      stage: this.stage,
      gestationalWeeks: this.gestationalWeeks,
      trimesterAlert: this.trimesterAlert,
      pmsmaBanner: this.pmsmaBanner,
      milestones: [...this.milestones],
      physicalDocuments: [...this.physicalDocuments],
    };
  }

  public toggleVaccine(milestoneId: string, completed?: boolean): MaternalMilestone {
    const item = this.milestones.find((m) => m.id === milestoneId);
    if (!item) {
      throw new Error(`Milestone ${milestoneId} not found`);
    }
    item.completed = completed !== undefined ? completed : !item.completed;
    return { ...item };
  }
}

export const maternalStore = new MaternalStore();
