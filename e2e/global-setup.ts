import { test as base, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const patientEmail = process.env.TEST_PATIENT_EMAIL!;
const patientPassword = process.env.TEST_PATIENT_PASSWORD!;
const doctorEmail = process.env.TEST_DOCTOR_EMAIL!;
const doctorPassword = process.env.TEST_DOCTOR_PASSWORD!;

const authDir = path.join(__dirname, ".auth");

async function buildStorageState(
  storageKey: string,
  onboardingKey: string,
  email: string,
  password: string,
  fileName: string
) {
  const client = createClient(supabaseUrl, supabaseKey, {
    auth: { storageKey },
  });

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session) {
    throw new Error(`Failed to login ${email}: ${error?.message}`);
  }

  const session = data.session;

  const storageState = {
    cookies: [],
    origins: [
      {
        origin: "http://localhost:3000",
        localStorage: [
          {
            name: storageKey,
            value: JSON.stringify({
              access_token: session.access_token,
              refresh_token: session.refresh_token,
              token_type: session.token_type,
              expires_in: session.expires_in,
              expires_at: session.expires_at,
              user: session.user,
            }),
          },
          { name: onboardingKey, value: "1" },
        ],
      },
    ],
  };

  fs.writeFileSync(
    path.join(authDir, fileName),
    JSON.stringify(storageState, null, 2)
  );

  // Sign out to clean up the client-side session
  await client.auth.signOut();
}

base.describe("Auth Setup", () => {
  base("setup authentication", async () => {
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }

    await buildStorageState(
      "psicobienestar-patient",
      "psicobienestar_patient_guide_done",
      patientEmail,
      patientPassword,
      "patient.json"
    );

    await buildStorageState(
      "psicobienestar-doctor",
      "psicobienestar_doctor_guide_done",
      doctorEmail,
      doctorPassword,
      "doctor.json"
    );

    // Verify files were created
    expect(
      fs.existsSync(path.join(authDir, "patient.json"))
    ).toBeTruthy();
    expect(
      fs.existsSync(path.join(authDir, "doctor.json"))
    ).toBeTruthy();
  });
});