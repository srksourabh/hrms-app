"use client";

import { useState } from "react";
import { Field, inputClass, selectClass } from "~/components/hr/ui";

interface PunchEmployeeOption {
  id: string;
  label: string;
}

interface AttendancePunchFormProps {
  action: (formData: FormData) => Promise<void>;
  employeeId?: string;
  employees?: PunchEmployeeOption[];
  defaultLocation?: string;
}

export function AttendancePunchForm({
  action,
  employeeId,
  employees = [],
  defaultLocation = "Riyadh HQ",
}: AttendancePunchFormProps) {
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [accuracy, setAccuracy] = useState("");
  const [locationStatus, setLocationStatus] = useState("Use GPS or enter coordinates manually.");
  const [locating, setLocating] = useState(false);

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationStatus("GPS is not available in this browser. Enter coordinates manually.");
      return;
    }

    setLocating(true);
    setLocationStatus("Getting current location...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(7));
        setLongitude(position.coords.longitude.toFixed(7));
        setAccuracy(String(Math.round(position.coords.accuracy)));
        setLocationStatus(`GPS captured. Accuracy: ${Math.round(position.coords.accuracy)} meters.`);
        setLocating(false);
      },
      () => {
        setLocationStatus("Location permission was blocked. Enter coordinates manually.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  }

  return (
    <form action={action} className="grid gap-3 md:grid-cols-6">
      {employees.length > 0 ? (
        <Field label="Employee">
          <select name="employeeId" className={selectClass}>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>{employee.label}</option>
            ))}
          </select>
        </Field>
      ) : (
        <input type="hidden" name="employeeId" value={employeeId ?? ""} />
      )}
      <Field label="Location label"><input name="locationName" className={inputClass} defaultValue={defaultLocation} /></Field>
      <Field label="Latitude">
        <input name="latitude" type="number" step="0.0000001" className={inputClass} placeholder="24.7136000" value={latitude} onChange={(event) => setLatitude(event.target.value)} />
      </Field>
      <Field label="Longitude">
        <input name="longitude" type="number" step="0.0000001" className={inputClass} placeholder="46.6753000" value={longitude} onChange={(event) => setLongitude(event.target.value)} />
      </Field>
      <input type="hidden" name="accuracy" value={accuracy} />
      <div className="flex flex-wrap items-end gap-2 md:col-span-2">
        <button type="button" onClick={useCurrentLocation} disabled={locating} className="rounded-md border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60">
          {locating ? "Locating..." : "Use GPS"}
        </button>
        <button name="mode" value="in" className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">Punch in</button>
        <button name="mode" value="out" className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Punch out</button>
      </div>
      <p className="text-xs text-slate-500 md:col-span-6">{locationStatus}</p>
    </form>
  );
}
