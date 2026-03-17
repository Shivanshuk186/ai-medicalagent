import { NextResponse } from 'next/server';
import { db } from '@/config/db';
import { EmergencyQueueTable } from '@/config/schema';

export async function POST() {
  try {
    // Clear existing data
    await db.delete(EmergencyQueueTable);

    const dummyPatients = [
      {
        patientId: 'shivanshuk186@gmail.com',
        patientName: 'Shivansh Kumar',
        symptoms: JSON.stringify(['chest pain', 'sweating', 'difficulty breathing']),
        priority: 1,
        arrivalTime: new Date(Date.now() - 5 * 60000).toISOString(),
        status: 'serving',
        assignedDoctor: 'Dr. Smith',
        updatedAt: new Date().toISOString(),
      },
      {
        patientId: 'patient_john_doe',
        patientName: 'John Doe',
        symptoms: JSON.stringify(['high fever', 'severe cough', 'fatigue']),
        priority: 2,
        arrivalTime: new Date(Date.now() - 2 * 60000).toISOString(),
        status: 'waiting',
        assignedDoctor: null,
        updatedAt: new Date().toISOString(),
      },
      {
        patientId: 'patient_jane_smith',
        patientName: 'Jane Smith',
        symptoms: JSON.stringify(['fractured arm', 'swelling', 'pain']),
        priority: 2,
        arrivalTime: new Date(Date.now() - 1 * 60000).toISOString(),
        status: 'waiting',
        assignedDoctor: null,
        updatedAt: new Date().toISOString(),
      },
      {
        patientId: 'patient_mike_wilson',
        patientName: 'Mike Wilson',
        symptoms: JSON.stringify(['mild headache', 'dizziness']),
        priority: 3,
        arrivalTime: new Date().toISOString(),
        status: 'waiting',
        assignedDoctor: null,
        updatedAt: new Date().toISOString(),
      },
    ];

    await db.insert(EmergencyQueueTable).values(dummyPatients);

    return NextResponse.json({ success: true, message: 'Seeded 4 patients to emergency queue' });
  } catch (error) {
    console.error('Seeding error:', error);
    return NextResponse.json({ error: 'Failed to seed data' }, { status: 500 });
  }
}
