import { Link } from "react-router-dom";
import { Mic, FileText, ChevronRight } from "lucide-react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { useState, useEffect } from "react";
import { LiveMap } from "./LiveMap";
import { DisasterUpdates } from "./DisasterUpdates";
import { API_BASE } from "../config";

interface HelpRequest {
  id: string;
  name: string;
  phone: string;
  location: string;
  city?: string;
  province?: string;
  postalCode?: string;
  latitude: string;
  longitude: string;
  situation: string;
  medicalConditions: string;
  immediacy: string;
  isChild: boolean;
  hasMobilityLimitations: boolean;
  environmentalHazards: string;
  numberOfPeople: string;
  priorityScore: number;
  timestamp: string;
  status: string;
}

export function LandingPage() {
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<HelpRequest | null>(
    null,
  );

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await fetch(`${API_BASE}/incidents`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch requests: ${errorText}`);
      }

      const data = await response.json();

      const mappedRequests: HelpRequest[] = (data || []).map((req: any) => ({
        id: req._id,
        name: req.name || "",
        phone: req.phone || "",
        location:
          req.location?.type === "Point" &&
          Array.isArray(req.location?.coordinates)
            ? `${req.location.coordinates[1].toFixed(4)}, ${req.location.coordinates[0].toFixed(4)}`
            : req.location?.display_name || req.city || req.province || "",
        city: req.city || "",
        province: req.province || "",
        postalCode: req.postalCode || "",
        latitude:
          req.location &&
          req.location.type === "Point" &&
          Array.isArray(req.location?.coordinates)
            ? String(req.location.coordinates[1])
            : "",
        longitude:
          req.location &&
          req.location.type === "Point" &&
          Array.isArray(req.location?.coordinates)
            ? String(req.location.coordinates[0])
            : "",
        situation: req.type || req.situation || req.safety_status || "",
        medicalConditions:
          req.medicalConditions ||
          (req.symptoms ? req.symptoms.join(", ") : ""),
        immediacy: req.immediacy || "",
        isChild: req.isChild ?? false,
        hasMobilityLimitations: req.hasMobilityLimitations ?? false,
        environmentalHazards: req.environmentalHazards || "",
        numberOfPeople:
          req.numberOfPeople || (req.num_people ? String(req.num_people) : ""),
        priorityScore: req.priorityScore ?? req.final_score ?? req.score ?? 0,
        timestamp: req.timestamp || "",
        status: req.status || "",
      }));

      setRequests(mappedRequests);
    } catch (error) {
      console.error("Error fetching help requests:", error);
    }
  };

  const activeRequests = requests.filter((r) => r.status !== "resolved");
  const peopleAffected = activeRequests.reduce(
    (sum, r) => sum + (parseInt(r.numberOfPeople, 10) || 1),
    0,
  );
  const byImmediacy = activeRequests.reduce(
    (acc, r) => {
      const level = r.immediacy || "unknown";
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  const incidentsWithChildren = activeRequests.filter((r) => r.isChild).length;
  const incidentsWithMobility = activeRequests.filter((r) => r.hasMobilityLimitations).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Hero + Official Updates side by side */}
        <section className="grid lg:grid-cols-12 gap-6 mb-6">
          <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-300 p-8 sm:p-10">
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-4">
              Help when it matters.
            </h1>
            <p className="text-slate-600 text-lg max-w-xl mb-8">
              Every minute of delay in reaching emergency responders can reduce survival rates by up to 6%. If you're in danger, send your location and situation to local responders now.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 max-w-2xl">
              <Link
                to="/request-help?input=voice"
                className="group flex items-start gap-4 p-5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl transition-all"
              >
                <div className="p-2 bg-white/20 rounded-lg">
                  <Mic className="w-6 h-6" />
                </div>
                <div>
                  <span className="font-semibold text-lg block mb-1">Voice request</span>
                  <span className="text-sky-100 text-sm">Best for hands-free emergencies</span>
                </div>
              </Link>
              <Link
                to="/request-help?input=form"
                className="group flex items-start gap-4 p-5 bg-white border-2 border-gray-300 hover:border-sky-200 rounded-xl transition-all hover:bg-sky-50/50"
              >
                <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-sky-100">
                  <FileText className="w-6 h-6 text-slate-600 group-hover:text-sky-600" />
                </div>
                <div>
                  <span className="font-semibold text-lg text-slate-900 block mb-1">Text form</span>
                  <span className="text-slate-500 text-sm">Detailed report for responders</span>
                </div>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-300 p-6">
            <DisasterUpdates />
          </div>
        </section>

        {/* Stats - 2 by 2 */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          <div className="bg-white rounded-xl border border-gray-300 p-5">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-bold text-slate-900">{activeRequests.length}</span>
              <span className="text-slate-500">active incidents</span>
            </div>
            <p className="text-slate-600 text-sm mb-3">
              Help requests currently awaiting response. Each incident is a separate emergency situation reported to Aegis.
            </p>
            {Object.keys(byImmediacy).length > 0 && (
              <div className="space-y-1.5 text-sm pt-2 border-t border-slate-100">
                {Object.entries(byImmediacy).map(([level, count]) => (
                  <div key={level} className="flex justify-between">
                    <span className="text-slate-500 capitalize">{level}</span>
                    <span className="font-medium text-slate-900">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-300 p-5">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-bold text-slate-900">{peopleAffected}</span>
              <span className="text-slate-500">people needing help</span>
            </div>
            <p className="text-slate-600 text-sm mb-3">
              Total individuals across all active requests. Each request may include multiple people.
            </p>
            <div className="space-y-1.5 text-sm pt-2 border-t border-slate-100">
              {incidentsWithChildren > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Involve children</span>
                  <span className="font-medium text-slate-900">{incidentsWithChildren} incident{incidentsWithChildren !== 1 ? "s" : ""}</span>
                </div>
              )}
              {incidentsWithMobility > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Mobility limitations</span>
                  <span className="font-medium text-slate-900">{incidentsWithMobility} incident{incidentsWithMobility !== 1 ? "s" : ""}</span>
                </div>
              )}
              {incidentsWithChildren === 0 && incidentsWithMobility === 0 && (
                <p className="text-slate-500 text-sm italic">No additional breakdown.</p>
              )}
            </div>
          </div>
        </section>

        {/* Map - full width */}
        <section className="mb-12">
          <div className="bg-white rounded-2xl border border-gray-300 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Situational awareness</h2>
              <p className="text-slate-500 text-sm mt-0.5">Real-time help requests on the map</p>
            </div>
            <div className="h-[500px] relative z-0">
              <LiveMap
                requests={requests}
                selectedRequest={selectedRequest}
                onSelectRequest={(r) =>
                  setSelectedRequest(r as HelpRequest | null)
                }
                centerOnUser
              />
            </div>
          </div>
        </section>

        {/* Secondary */}
        <section className="grid md:grid-cols-2 gap-6">
          <Link
            to="/responder"
            className="flex items-center justify-between p-6 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-colors group"
          >
            <div>
              <h3 className="font-semibold text-lg mb-1">First responder?</h3>
              <p className="text-slate-400 text-sm">Access the dispatch board and triage data.</p>
            </div>
            <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-white" />
          </Link>
          <Link
            to="/info"
            className="flex items-center justify-between p-6 bg-white border border-gray-300 rounded-2xl hover:border-slate-300 transition-all group"
          >
            <div>
              <h3 className="font-semibold text-lg text-slate-900 mb-1">Safety guidelines</h3>
              <p className="text-slate-500 text-sm">Disaster preparedness and survival guides.</p>
            </div>
            <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-slate-600" />
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default LandingPage;
