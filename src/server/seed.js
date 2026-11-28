// Adds sample doctors. Safe to run more than once: existing doctors are skipped.
// Usage: npm run seed
import "dotenv/config";
import { getPool, closePool } from "./db.js";

// [firstName, lastName, speciality, years of experience, fee (₦), working days (0 = Sun)]
export const SAMPLE_DOCTORS = [
  ["Adebayo", "Ogunleye", "Dentist", 12, 10000],
  ["Chiamaka", "Eze", "Dentist", 7, 8000, [1, 3, 5, 6]],
  ["Funmilayo", "Adeyemi", "Gynecologist/obstetrician", 15, 15000],
  ["Ibrahim", "Musa", "Gynecologist/obstetrician", 9, 12000],
  ["Oluwaseun", "Bakare", "General Physician", 10, 7000, [1, 2, 3, 4, 5, 6]],
  ["Ngozi", "Okafor", "General Physician", 5, 5000],
  ["Kehinde", "Alabi", "Dermatologist", 8, 12000],
  ["Aisha", "Bello", "Dermatologist", 11, 13000, [2, 4, 6]],
  ["Emeka", "Nwosu", "Ear-nose-throat (ent) Specialist", 14, 14000],
  ["Halima", "Yusuf", "Ear-nose-throat (ent) Specialist", 6, 9000],
  ["Tunde", "Akinola", "Paediatrician", 13, 10000],
  ["Blessing", "Udo", "Paediatrician", 4, 7000],
];

export async function seedDoctors(db) {
  let added = 0;
  for (const [firstName, lastName, speciality, experience, fee, days] of SAMPLE_DOCTORS) {
    const { rowCount } = await db.query(
      `INSERT INTO booking.doctors
         ("firstName", "lastName", "speciality", "experience", "consultationFee", "workingDays")
       VALUES ($1, $2, $3, $4, $5, COALESCE($6::smallint[], '{1,2,3,4,5}'))
       ON CONFLICT ("title", "firstName", "lastName", "speciality") DO NOTHING`,
      [firstName, lastName, speciality, experience, fee, days ?? null]
    );
    added += rowCount;
  }
  return added;
}

if (process.argv[1] && process.argv[1].endsWith("seed.js")) {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  try {
    console.log(`Added ${await seedDoctors(getPool(url))} doctor(s).`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await closePool();
  }
}
