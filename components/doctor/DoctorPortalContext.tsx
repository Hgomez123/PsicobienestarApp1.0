"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { doctorPatients } from "@/data/doctorPortalData";
import type { DoctorPatient } from "@/types/doctor";

type DoctorPortalContextType = {
  selectedPatientId: number;
  setSelectedPatientId: (id: number) => void;
  selectedPatient: DoctorPatient;
};

const DoctorPortalContext = createContext<DoctorPortalContextType | null>(null);

export function DoctorPortalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selectedPatientId, setSelectedPatientId] = useState(doctorPatients[0].id);

  const selectedPatient = useMemo(() => {
    return (
      doctorPatients.find((patient) => patient.id === selectedPatientId) ||
      doctorPatients[0]
    );
  }, [selectedPatientId]);

  return (
    <DoctorPortalContext.Provider
      value={{
        selectedPatientId,
        setSelectedPatientId,
        selectedPatient,
      }}
    >
      {children}
    </DoctorPortalContext.Provider>
  );
}

export function useDoctorPortal() {
  const context = useContext(DoctorPortalContext);

  if (!context) {
    throw new Error("useDoctorPortal debe usarse dentro de DoctorPortalProvider");
  }

  return context;
}