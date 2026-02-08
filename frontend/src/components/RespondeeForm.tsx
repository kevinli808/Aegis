import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  MapPin,
  AlertTriangle,
  User,
  MessageSquare,
  Mic,
  FileText,
  Heart,
} from "lucide-react";
import { BackToHomeButton } from "./BackToHomeButton";
import { API_BASE } from "../config";
import { VoiceCall } from "./VoiceCall";

export type ImmediacyLevel = "low" | "moderate" | "high" | "critical";

export interface FormData {
  name: string;
  phone: string;
  location: string;
  city: string;
  province: string;
  postalCode: string;
  latitude: string;
  longitude: string;
  situation: string;
  medicalConditions: string;
  immediacy: ImmediacyLevel;
  isChild: boolean;
  hasMobilityLimitations: boolean;
  environmentalHazards: string;
  numberOfPeople: string;
}

const initialFormData: FormData = {
  name: "",
  phone: "",
  location: "",
  city: "",
  province: "",
  postalCode: "",
  latitude: "",
  longitude: "",
  situation: "",
  medicalConditions: "",
  immediacy: "moderate",
  isChild: false,
  hasMobilityLimitations: false,
  environmentalHazards: "",
  numberOfPeople: "1",
};

/** Map province/state names to Canadian province codes */
const PROVINCE_NAME_TO_CODE: Record<string, string> = {
  alberta: "AB",
  "british columbia": "BC",
  bc: "BC",
  manitoba: "MB",
  mb: "MB",
  "new brunswick": "NB",
  nb: "NB",
  "newfoundland and labrador": "NL",
  nl: "NL",
  "nova scotia": "NS",
  ns: "NS",
  ontario: "ON",
  on: "ON",
  "prince edward island": "PE",
  pe: "PE",
  quebec: "QC",
  qc: "QC",
  québec: "QC",
  saskatchewan: "SK",
  sk: "SK",
  "northwest territories": "NT",
  nt: "NT",
  nunavut: "NU",
  nu: "NU",
  yukon: "YT",
  yt: "YT",
};

/** Reverse geocode lat/lng to get address details via Nominatim */
async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<{
  city: string;
  province: string;
  postalCode: string;
  location: string;
}> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
    {
      headers: {
        "Accept-Language": "en",
        "User-Agent": "AegisEmergencyApp/1.0",
      },
    },
  );
  if (!res.ok) throw new Error("Geocoding failed");
  const data = await res.json();
  const addr = data.address ?? {};
  const city =
    addr.city ??
    addr.town ??
    addr.village ??
    addr.municipality ??
    addr.county ??
    "";
  const stateRaw = (addr.state ?? addr.province ?? "").toString().toLowerCase();
  const province =
    PROVINCE_NAME_TO_CODE[stateRaw] ?? addr.state ?? addr.province ?? "";
  const postalCode = addr.postcode ?? "";
  const location = data.display_name ?? `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  return { city, province, postalCode, location };
}

/** Extract form fields from voice call transcript */
function parseTranscriptToFormData(transcript: string[]): Partial<FormData> {
  const fullText = transcript.join(" ").toLowerCase();
  const userLines = transcript
    .filter((l) => /^\[(user|human|caller)\]/i.test(l))
    .map((l) => l.replace(/^\[[^\]]+\]:\s*/i, ""))
    .join(" ");
  const text = (userLines || fullText).toLowerCase();

  const extracted: Partial<FormData> = {};

  // Name: "my name is X", "I'm X", "name is X"
  const nameMatch = text.match(
    /(?:my name is|i'm|i am|name is|call me)\s+([a-z]+(?:\s+[a-z]+)?)/i,
  );
  if (nameMatch) extracted.name = nameMatch[1].trim();

  // Phone: digits with optional separators
  const phoneMatch = text.match(
    /(?:\d[\d\s\-\.]{7,})|(?:\+?1?[\s\-\.]?\(?\d{3}\)?[\s\-\.]?\d{3}[\s\-\.]?\d{4})/,
  );
  if (phoneMatch)
    extracted.phone = phoneMatch[0]
      .replace(/\s/g, "")
      .replace(/[^\d+]/g, "")
      .slice(0, 15);

  // Situation: look for common phrases, or use first substantial user message
  const situationPhrases = [
    "situation is",
    "i need help",
    "need help with",
    "help with",
    "what's happening",
    "happening is",
    "problem is",
    "emergency is",
  ];
  for (const phrase of situationPhrases) {
    const idx = text.indexOf(phrase);
    if (idx >= 0) {
      const after = text.slice(idx + phrase.length).trim();
      const end =
        after.search(
          /\s+(?:my|i've|i have|phone|number|name|medical|location)/i,
        ) || after.length;
      const snippet = after.slice(0, end || 200).trim();
      if (snippet.length > 10) extracted.situation = snippet;
      break;
    }
  }
  if (!extracted.situation && userLines.length > 30) {
    extracted.situation = userLines.slice(0, 500).trim();
  }

  // Medical conditions
  const medicalMatch = text.match(
    /(?:medical|condition|injured|injury|have)\s+(?:is|:)?\s*([^.!?]+)/i,
  );
  if (medicalMatch && medicalMatch[1].length > 3)
    extracted.medicalConditions = medicalMatch[1].trim();

  // Immediacy
  if (/\b(life.?threatening|critical|dying)\b/i.test(text))
    extracted.immediacy = "critical";
  else if (/\b(urgent|rapidly|worsening)\b/i.test(text))
    extracted.immediacy = "high";
  else if (/\b(stable|not escalating)\b/i.test(text))
    extracted.immediacy = "low";

  // Number of people
  const peopleMatch =
    text.match(/(\d+)\s*(?:people|persons?|adults?|family)/i) ||
    text.match(/(?:people|persons?)\s*(\d+)/i);
  if (peopleMatch) extracted.numberOfPeople = peopleMatch[1];

  return extracted;
}

export function RespondeeForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inputParam = searchParams.get("input");
  const [showInputChoice, setShowInputChoice] = useState<boolean>(
    inputParam !== "voice" && inputParam !== "form",
  );
  const [showVoiceCall, setShowVoiceCall] = useState<boolean>(
    inputParam === "voice",
  );

  useEffect(() => {
    if (inputParam === "voice") {
      setShowInputChoice(false);
      setShowVoiceCall(true);
    } else if (inputParam === "form") {
      setShowInputChoice(false);
      setShowVoiceCall(false);
    }
  }, [inputParam]);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [isLocationLoading, setIsLocationLoading] = useState<boolean>(false);
  const hasAttemptedGeolocation = useRef(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    const key = name as keyof FormData;
    if (!(key in initialFormData)) return;
    setFormData((prev) => ({
      ...prev,
      [key]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const updateLocationFromCoords = useCallback(
    async (lat: number, lng: number) => {
      setFormData((prev) => ({
        ...prev,
        latitude: lat.toString(),
        longitude: lng.toString(),
        location: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      }));
      try {
        const { city, province, postalCode, location } = await reverseGeocode(
          lat,
          lng,
        );
        setFormData((prev) => ({
          ...prev,
          latitude: lat.toString(),
          longitude: lng.toString(),
          location: location || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          city: city || prev.city,
          province: province || prev.province,
          postalCode: postalCode || prev.postalCode,
        }));
      } catch {
        setFormData((prev) => ({
          ...prev,
          latitude: lat.toString(),
          longitude: lng.toString(),
          location: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        }));
      }
    },
    [],
  );

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateLocationFromCoords(
          position.coords.latitude,
          position.coords.longitude,
        ).finally(() => setIsLocationLoading(false));
      },
      (error: GeolocationPositionError) => {
        setIsLocationLoading(false);
        console.error("Error getting location:", error);
        let errorMessage = "Unable to get your location. ";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage +=
              "Please allow location access in your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage += "Location request timed out.";
            break;
          default:
            errorMessage += "Please enter your location manually.";
        }
        alert(errorMessage);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }, [updateLocationFromCoords]);

  // Auto-request geolocation when form is shown
  useEffect(() => {
    if (showInputChoice || showVoiceCall || submitSuccess) return;
    if (hasAttemptedGeolocation.current) return;
    if (!navigator.geolocation) return;
    hasAttemptedGeolocation.current = true;
    getCurrentLocation();
  }, [showInputChoice, showVoiceCall, submitSuccess, getCurrentLocation]);

  const handleInputByVoice = () => {
    setShowInputChoice(false);
    setShowVoiceCall(true);
  };

  const handleCallEnd = (transcript: string[]) => {
    const parsed = parseTranscriptToFormData(transcript);
    setFormData((prev) => {
      const merged = { ...prev };
      if (parsed.name) merged.name = parsed.name;
      if (parsed.phone) merged.phone = parsed.phone;
      if (parsed.situation) merged.situation = parsed.situation;
      if (parsed.medicalConditions)
        merged.medicalConditions = parsed.medicalConditions;
      if (parsed.immediacy) merged.immediacy = parsed.immediacy;
      if (parsed.numberOfPeople) merged.numberOfPeople = parsed.numberOfPeople;
      return merged;
    });
    setShowVoiceCall(false);
  };

  const handleInputByForm = () => {
    setShowInputChoice(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.name.trim() ||
      !formData.phone.trim() ||
      !formData.situation.trim()
    ) {
      alert(
        "Please provide at least your name, phone number, and situation description.",
      );
      return;
    }
    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) {
      alert(
        'Please allow location access (GPS) or click "Use GPS" to capture your location. Responders need your coordinates to find you.',
      );
      return;
    }
    setIsSubmitting(true);

    try {
      const payload = {
        type: formData.situation,
        num_people: Number(formData.numberOfPeople) || 1,
        symptoms: formData.medicalConditions
          ? [formData.medicalConditions]
          : [],
        safety_status: formData.immediacy,
        location: {
          type: "Point",
          coordinates: [
            parseFloat(formData.longitude) || 0,
            parseFloat(formData.latitude) || 0,
          ],
        },
        name: formData.name,
        phone: formData.phone,
        situation: formData.situation,
        city: formData.city,
        province: formData.province,
        postalCode: formData.postalCode,
        medicalConditions: formData.medicalConditions,
        immediacy: formData.immediacy,
        isChild: formData.isChild,
        hasMobilityLimitations: formData.hasMobilityLimitations,
        environmentalHazards: formData.environmentalHazards,
        numberOfPeople: formData.numberOfPeople,
      };

      const response = await fetch(`${API_BASE}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.status === 422) {
        const errorDetail = await response.json();
        console.error("Validation Error:", errorDetail);
        alert("Format error: Check the console to see which field failed.");
        return;
      }

      if (!response.ok) throw new Error("Network response was not ok");

      if (data.success) {
        let message = `Help request submitted successfully!\n\nRequest ID: ${data.requestId}\nPriority Score: ${data.priorityScore}`;
        
        if (data.coordinates) {
          message += `\n\nYour location has been mapped and responders can see your position.`;
        } else {
          message += `\n\nYour address has been recorded. Responders will contact you at ${formData.phone}.`;
        }
        
        alert(message);
        navigate('/gemini-chat', { state: { formData } });
      } else {
        alert('Failed to submit request. Please try again.');
      }
      await response.json();
      setSubmitSuccess(true);
      navigate("/");
    } catch (error) {
      console.error("Error submitting help request:", error);
      alert("Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showInputChoice) {
    return (
      <div className="min-h-screen px-4 sm:px-6 py-4 sm:py-6 flex flex-col items-center">
        <div className="w-full max-w-7xl">
          <BackToHomeButton className="mb-6" />
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Request Assistance
          </h1>
          <p className="text-gray-600 text-sm sm:text-base mb-0 md:mb-4">
            Choose how you'd like to submit your request
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center w-full max-w-7xl sm:flex-initial sm:items-stretch sm:justify-start">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full max-w-2xl sm:max-w-none">
            <button
              type="button"
              onClick={handleInputByVoice}
              className="bg-sky-600 text-white rounded-xl p-6 sm:p-8 py-8 sm:py-12  border-2 border-sky-500 hover:bg-sky-700 active:scale-95 transition-all text-center flex flex-col items-center justify-center gap-3"
            >
              <Mic className="w-12 h-12 sm:w-14 sm:h-14" />
              <span className="text-xl sm:text-2xl font-bold">
                Input by voice
              </span>
              <span className="text-sm text-slate-200">
                Speak to our AI assistant to submit your request
              </span>
            </button>
            <button
              type="button"
              onClick={handleInputByForm}
              className="bg-white border-2 border-gray-300 text-gray-900 rounded-xl p-6 sm:p-8 hover:bg-gray-200 hover:border-gray-300 active:scale-95 transition-all text-center flex flex-col items-center justify-center gap-3"
            >
              <FileText className="w-12 h-12 sm:w-14 sm:h-14 text-gray-600" />
              <span className="text-xl sm:text-2xl font-bold">
                Input by form
              </span>
              <span className="text-sm text-gray-600">
                Fill out the form manually to submit your request
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showVoiceCall) {
    return (
      <div className="min-h-screen px-4 sm:px-6 py-4 sm:py-6 flex flex-col items-center">
        <div className="w-full max-w-7xl py-4 sm:py-6 text-left">
          <div className="mb-4 sm:mb-6">
            <BackToHomeButton className="mb-2 sm:mb-3" />
          </div>
          <VoiceCall
            title="Request Emergency Help"
            embedded
            onBack={() => {
              setShowVoiceCall(false);
              setShowInputChoice(true);
            }}
            onLocationUpdate={(lat: string, lng: string) => {
              const latNum = parseFloat(lat);
              const lngNum = parseFloat(lng);
              if (!isNaN(latNum) && !isNaN(lngNum)) {
                updateLocationFromCoords(latNum, lngNum);
              }
            }}
            onCallEnd={handleCallEnd}
          />
        </div>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-2xl p-12 text-left sm:text-center max-w-xl">
          <div className="w-16 h-16 bg-green-500 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Request Submitted
          </h2>
          <p className="text-gray-600">
            Help is on the way. Responders have been notified of your request.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 py-4 sm:py-6 flex flex-col items-center">
      <div className="w-full max-w-7xl py-4 sm:py-6 text-left">
        <div className="mb-4 sm:mb-6">
          <BackToHomeButton className="mb-2 sm:mb-3" />
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">
            Request Emergency Help
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Fill out this form to connect with emergency responders. Our AI
            system will prioritize your request based on urgency and dispatch
            help as quickly as possible.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl space-y-4">
          <div className="border p-5 border-gray-300 rounded-lg">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <User className="w-4 h-4 sm:w-5 sm:h-5" />
              Personal Information
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  placeholder="Your contact number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of People Needing Help{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="number"
                  name="numberOfPeople"
                  value={formData.numberOfPeople}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="border p-5 border-gray-300 rounded-lg">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
              Location
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location (via GPS)
                </label>
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={isLocationLoading}
                  className="w-max bg-slate-700 text-white px-4 py-3 rounded-lg hover:bg-slate-800 active:scale-95 transition-all font-medium text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLocationLoading
                    ? "Getting location…"
                    : "📍 Fill address with GPS"}
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  Location is requested automatically. Click to retry or
                  refresh.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address{" "}
                  <span className="text-gray-400 font-normal">
                    (optional if using GPS)
                  </span>
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  placeholder="123 Main Street, Apt 4B"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City{" "}
                    <span className="text-gray-400 font-normal">
                      (optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    placeholder="Vancouver"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Province{" "}
                    <span className="text-gray-400 font-normal">
                      (optional)
                    </span>
                  </label>
                  <select
                    name="province"
                    value={formData.province}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  >
                    <option value="">Select Province</option>
                    <option value="AB">Alberta</option>
                    <option value="BC">British Columbia</option>
                    <option value="MB">Manitoba</option>
                    <option value="NB">New Brunswick</option>
                    <option value="NL">Newfoundland and Labrador</option>
                    <option value="NS">Nova Scotia</option>
                    <option value="ON">Ontario</option>
                    <option value="PE">Prince Edward Island</option>
                    <option value="QC">Quebec</option>
                    <option value="SK">Saskatchewan</option>
                    <option value="NT">Northwest Territories</option>
                    <option value="NU">Nunavut</option>
                    <option value="YT">Yukon</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Code{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  placeholder="A1A 1A1"
                  maxLength={7}
                />
                <p className="text-xs text-gray-500 mt-1">Format: A1A 1A1</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Latitude
                  </label>
                  <input
                    type="text"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent bg-gray-50"
                    placeholder="Auto-filled"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Longitude
                  </label>
                  <input
                    type="text"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent bg-gray-50"
                    placeholder="Auto-filled"
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border p-5 border-gray-300 rounded-lg">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
              Situation Details
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Describe Your Situation
                </label>
                <textarea
                  name="situation"
                  value={formData.situation}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  placeholder="What is happening? What help do you need?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medical Conditions or Injuries
                </label>
                <textarea
                  name="medicalConditions"
                  value={formData.medicalConditions}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  placeholder="e.g., bleeding, unconscious, difficulty breathing"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  How Quickly is This Escalating?{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <select
                  name="immediacy"
                  value={formData.immediacy}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                >
                  <option value="low">Stable - Not escalating</option>
                  <option value="moderate">Moderate - Could worsen soon</option>
                  <option value="high">Urgent - Rapidly worsening</option>
                  <option value="critical">Critical - Life-threatening</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Environmental Hazards
                </label>
                <input
                  type="text"
                  name="environmentalHazards"
                  value={formData.environmentalHazards}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  placeholder="e.g., flood depth 3ft, near wildfire, structural damage"
                />
              </div>
            </div>
          </div>

          <div className="border p-5 border-gray-300 rounded-lg">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
              Vulnerability Factors
            </h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-1 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  name="isChild"
                  checked={formData.isChild}
                  onChange={handleChange}
                  className="w-5 h-5 text-slate-700 rounded focus:ring-2 focus:ring-slate-500"
                />
                <span className="text-gray-700 text-sm sm:text-base">
                  Children present (under 18)
                </span>
              </label>
              <label className="flex items-center gap-3 p-1 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  name="hasMobilityLimitations"
                  checked={formData.hasMobilityLimitations}
                  onChange={handleChange}
                  className="w-5 h-5 text-slate-700 rounded focus:ring-2 focus:ring-slate-500"
                />
                <span className="text-gray-700 text-sm sm:text-base">
                  Mobility limitations or disabilities
                </span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-slate-700 text-white py-3 px-4 rounded-lg font-bold text-base hover:bg-slate-800 active:scale-95 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg"
          >
            {isSubmitting ? "Submitting..." : "Submit Help Request"}
          </button>
        </form>

        <div className="mt-4 sm:mt-6 bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4">
          <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2 text-base sm:text-lg">
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
            Crisis Tips While You Wait
          </h3>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-700\">
            <li>• Stay calm and find a safe location if possible</li>
            <li>• Keep your phone charged and accessible</li>
            <li>
              • If injured, apply pressure to stop bleeding and avoid moving
            </li>
            <li>• In case of fire, stay low to avoid smoke inhalation</li>
            <li>
              • During floods, move to higher ground and avoid walking through
              water
            </li>
            <li>• If trapped, make noise to help rescuers locate you</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default RespondeeForm;
