// Adds sample doctors to the database. Safe to run more than once:
// it only inserts doctors whose name isn't already there.
// Usage: npm run seed
import mongoose from "mongoose";
import { config } from "./config.js";
import connectToMongo from "./db.js";
import Doctor from "./models/Doctor.js";

export const SAMPLE_DOCTORS = [
  { name: "Dr. Adebayo Ogunleye", speciality: "Dentist", experience: 12, consultationFee: 10000 },
  { name: "Dr. Chiamaka Eze", speciality: "Dentist", experience: 7, consultationFee: 8000, workingDays: [1, 3, 5, 6] },
  { name: "Dr. Funmilayo Adeyemi", speciality: "Gynecologist/obstetrician", experience: 15, consultationFee: 15000 },
  { name: "Dr. Ibrahim Musa", speciality: "Gynecologist/obstetrician", experience: 9, consultationFee: 12000 },
  { name: "Dr. Oluwaseun Bakare", speciality: "General Physician", experience: 10, consultationFee: 7000, workingDays: [1, 2, 3, 4, 5, 6] },
  { name: "Dr. Ngozi Okafor", speciality: "General Physician", experience: 5, consultationFee: 5000 },
  { name: "Dr. Kehinde Alabi", speciality: "Dermatologist", experience: 8, consultationFee: 12000 },
  { name: "Dr. Aisha Bello", speciality: "Dermatologist", experience: 11, consultationFee: 13000, workingDays: [2, 4, 6] },
  { name: "Dr. Emeka Nwosu", speciality: "Ear-nose-throat (ent) Specialist", experience: 14, consultationFee: 14000 },
  { name: "Dr. Halima Yusuf", speciality: "Ear-nose-throat (ent) Specialist", experience: 6, consultationFee: 9000 },
  { name: "Dr. Tunde Akinola", speciality: "Paediatrician", experience: 13, consultationFee: 10000 },
  { name: "Dr. Blessing Udo", speciality: "Paediatrician", experience: 4, consultationFee: 7000 },
];

export async function seedDoctors() {
  const existing = new Set(await Doctor.distinct("name"));
  const toInsert = SAMPLE_DOCTORS.filter((d) => !existing.has(d.name));
  if (toInsert.length) await Doctor.insertMany(toInsert);
  return toInsert.length;
}

if (process.argv[1] && process.argv[1].endsWith("seed.js")) {
  await connectToMongo(config.mongoUri, config.dbName);
  const count = await seedDoctors();
  console.log(`Added ${count} doctor(s).`);
  await mongoose.disconnect();
}
