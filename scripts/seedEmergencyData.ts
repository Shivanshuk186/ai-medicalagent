import { db } from '@/config/db';
import { EmergencyQueueTable } from '@/config/schema';

const dummyPatients = [
  {
    patientId: 'shivanshuk186@gmail.com',
    patientName: 'Shivansh Kumar',
    symptoms: ['chest pain', 'sweating', 'breathing difficulty'],
    priority: 1,
    arrivalTime: new Date(Date.now() - 5 * 60000).toISOString(),
    status: 'serving' as const,
  },
  {
    patientId: 'patient_john_doe',
    patientName: 'John Doe',
    symptoms: ['high fever', 'severe cough', 'fatigue'],
    priority: 2,
    arrivalTime: new Date(Date.now() - 2 * 60000).toISOString(),
    status: 'waiting' as const,
  },
  {
    patientId: 'patient_jane_smith',
    patientName: 'Jane Smith',
    symptoms: ['fractured arm', 'swelling', 'pain'],
    priority: 2,
    arrivalTime: new Date(Date.now() - 1 * 60000).toISOString(),
    status: 'waiting' as const,
  },
  {
    patientId: 'patient_mike_wilson',
    patientName: 'Mike Wilson',
    symptoms: ['mild headache', 'dizziness'],
    priority: 3,
    arrivalTime: new Date().toISOString(),
    status: 'waiting' as const,
  },
];

async function seedData() {
  try {
    console.log('Seeding emergency queue data...');
    
    // Clear existing data
    await db.delete(EmergencyQueueTable);
    
    // Insert dummy data
    for (const patient of dummyPatients) {
      await db.insert(EmergencyQueueTable).values({
        ...patient,
        assignedDoctor: patient.priority === 1 ? 'Dr. Smith' : undefined,
        updatedAt: new Date().toISOString(),
      });
    }
    
    console.log('✓ Seeded 4 patients to emergency queue');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
}

seedData();
