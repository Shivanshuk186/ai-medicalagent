export type EmergencyPriority = 1 | 2 | 3;

// CRITICAL (Life-threatening - Immediate)
const CRITICAL_KEYWORDS = [
  'chest pain',
  'breathing difficulty',
  'cant breathe',
  'no breathing',
  'unconscious',
  'unresponsive',
  'severe bleeding',
  'hemorrhage',
  'choking',
  'anaphylaxis',
  'seizure',
  'stroke',
  'rabies',
  'poisoning',
  'overdose',
  'trauma',
  'severe allergic',
  'severe burn',
  'loss of consciousness',
  'cardiac',
  'heart attack',
  'arrhythmia',
  'hypotension',
  'shock',
  'severe wound',
  'open fracture',
  'spinal injury',
  'head injury with loss',
  'impaled object',
  'electrocution',
  'drowning',
  'crush injury',
];

// SERIOUS (Significant - Urgent)
const SERIOUS_KEYWORDS = [
  'high fever',
  'severe headache',
  'vomiting',
  'severe vomiting',
  'dehydration',
  'fracture',
  'broken bone',
  'severe pain',
  'ab pain',
  'abdominal pain',
  'severe cough',
  'coughing blood',
  'hemoptysis',
  'dizziness',
  'vertigo',
  'fainting',
  'syncope',
  'confusion',
  'altered mental',
  'severe diarrhea',
  'bloody stool',
  'hematochezia',
  'difficulty swallowing',
  'dysphagia',
  'severe weakness',
  'paralysis partial',
  'eye pain',
  'vision loss',
  'severe rash',
  'severe infection',
  'severe burn',
  'moderate burn',
  'infected wound',
  'deep cut',
  'laceration',
  'dislocation',
  'severe sprain',
  'severe twisting',
  'chemical burn',
  'foreign object eye',
  'pregnancy bleeding',
  'miscarriage',
  'severe menstrual',
  'testicular pain',
  'severe urinary',
  'inability to urinate',
  'severe back pain',
  'neck pain',
  'wheezing',
  'asthma attack',
  'breathing shallow',
];


export function normalizeSymptoms(input: string[] | string): string[] {
  if (Array.isArray(input)) {
    return input
      .map((item) => item?.toString().trim())
      .filter((item): item is string => Boolean(item));
  }

  return input
    .split(/[,.\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function classifySeverity(symptomsInput: string[] | string): EmergencyPriority {
  const symptoms = normalizeSymptoms(symptomsInput);
  const haystack = symptoms.join(' ').toLowerCase();

  if (CRITICAL_KEYWORDS.some((keyword) => haystack.includes(keyword))) {
    return 1;
  }

  if (SERIOUS_KEYWORDS.some((keyword) => haystack.includes(keyword))) {
    return 2;
  }

  return 3;
}

export function getPriorityLabel(priority: EmergencyPriority): 'Critical' | 'Serious' | 'Normal' {
  if (priority === 1) return 'Critical';
  if (priority === 2) return 'Serious';
  return 'Normal';
}
