"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface MaintenanceLog {
  id: string;
  serviceDate: string;
  maintenanceType: string;
  description: string | null;
  odometer: number | null;
  cost: string | null;
  performedBy: string | null;
  nextServiceDate: string | null;
  nextServiceKm: number | null;
  notes: string | null;
}

const MAINTENANCE_TYPES = [
  "Oil Change", "Tire Rotation", "Brake Inspection", "Annual Service",
  "Air Filter Replacement", "Battery Check / Replacement", "Wheel Alignment",
  "AC Service", "Transmission Service", "Coolant Flush", "Spark Plugs",
  "Body Repair", "Glass Repair", "Other",
];

const emptyForm = {
  serviceDate: "", maintenanceType: "", description: "", odometer: "",
  cost: "", performedBy: "", nextServiceDate: "", nextServiceKm: "", notes: "",
};

export default function CarMaintenancePage() {
  const params = useParams();
  const carId = params.id as string;

  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  async function fetchLogs() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/cars/${carId}/maintenance`);
      if (res.ok) {
        const data = await res.json() as { logs: MaintenanceLog[] };
        setLogs(data.logs);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void fetchLogs(); }, [carId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.serviceDate || !form.maintenanceType) {
      alert("Service date and type are required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/cars/${carId}/maintenance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceDate: form.serviceDate,
          maintenanceType: form.maintenanceType,
          description: form.description || null,
          odometer: form.odometer ? parseInt(form.odometer, 10) : null,
          cost: form.cost ? parseFloat(form.cost) : null,
          performedBy: form.performedBy || null,
          nextServiceDate: form.nextServiceDate || null,
          nextServiceKm: form.nextServiceKm ? parseInt(form.nextServiceKm, 10) : null,
          notes: form.notes || null,
        }),
      });
      if (res.ok) {
        setShowForm(false);
        setForm(emptyForm);
        void fetchLogs();
      } else {
        const data = await res.json() as { error?: string };
        alert(data.error ?? "Failed to add log entry");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(logId: string) {
    if (!confirm("Delete this maintenance log entry? This cannot be undone.")) return;
    const res = await fetch(`/api/admin/cars/${carId}/maintenance/${logId}`, { method: "DELETE" });
    if (!res.ok) alert("Failed to delete log entry");
    else void fetchLogs();
  }

  function field(key: keyof typeof emptyForm) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }));
  }

  const inputCls = "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <Link href={`/admin/cars/${carId}/edit`} className="text-sm text-gray-500 hover:text-gray-900">
          ← Back to Car
        </Link>
        <h1 className="text-2xl font-bold flex-1">Maintenance Logs</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700"
        >
          {showForm ? "Cancel" : "+ Add Entry"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border rounded-lg p-6 space-y-4 bg-white">
          <h2 className="font-semibold text-lg">New Maintenance Entry</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Service Date *</label>
              <input type="date" className={inputCls} value={form.serviceDate} onChange={field("serviceDate")} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type *</label>
              <select className={inputCls} value={form.maintenanceType} onChange={field("maintenanceType")} required>
                <option value="">Select type…</option>
                {MAINTENANCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Odometer (km)</label>
              <input type="number" min="0" placeholder="e.g. 45000" className={inputCls} value={form.odometer} onChange={field("odometer")} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cost (€)</label>
              <input type="number" min="0" step="0.01" placeholder="e.g. 85.00" className={inputCls} value={form.cost} onChange={field("cost")} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Performed By</label>
              <input type="text" placeholder="Workshop / mechanic name" className={inputCls} value={form.performedBy} onChange={field("performedBy")} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Next Service Date</label>
              <input type="date" className={inputCls} value={form.nextServiceDate} onChange={field("nextServiceDate")} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Next Service Km</label>
              <input type="number" min="0" placeholder="e.g. 50000" className={inputCls} value={form.nextServiceKm} onChange={field("nextServiceKm")} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea className={inputCls} placeholder="Work performed…" value={form.description} onChange={field("description")} rows={2} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Internal Notes</label>
            <textarea className={inputCls} placeholder="Internal notes for fleet operations…" value={form.notes} onChange={field("notes")} rows={2} />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Save Entry"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500 py-8 text-center">Loading…</p>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-gray-500 border rounded-lg bg-gray-50">
          <p className="text-lg font-medium">No maintenance logs yet</p>
          <p className="text-sm mt-1">Click &quot;+ Add Entry&quot; to record the first service.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="border rounded-lg p-4 bg-white">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{log.maintenanceType}</span>
                    <span className="text-sm text-gray-500">
                      {new Date(log.serviceDate).toLocaleDateString("en-GB")}
                    </span>
                    {log.odometer != null && (
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{log.odometer.toLocaleString()} km</span>
                    )}
                    {log.cost != null && (
                      <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">€{parseFloat(log.cost).toFixed(2)}</span>
                    )}
                  </div>
                  {log.description && <p className="text-sm text-gray-600 mt-1">{log.description}</p>}
                  {log.performedBy && <p className="text-xs text-gray-500 mt-1">By: {log.performedBy}</p>}
                  {(log.nextServiceDate || log.nextServiceKm != null) && (
                    <p className="text-xs text-blue-600 mt-1">
                      Next service:{" "}
                      {log.nextServiceDate && new Date(log.nextServiceDate).toLocaleDateString("en-GB")}
                      {log.nextServiceDate && log.nextServiceKm != null && " / "}
                      {log.nextServiceKm != null && `${log.nextServiceKm.toLocaleString()} km`}
                    </p>
                  )}
                  {log.notes && <p className="text-xs text-gray-500 mt-1 italic">{log.notes}</p>}
                </div>
                <button
                  onClick={() => void handleDelete(log.id)}
                  className="shrink-0 text-sm text-red-600 hover:text-red-800 px-3 py-1 rounded hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
