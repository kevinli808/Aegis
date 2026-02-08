import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, AlertTriangle, User, MessageSquare, Mic, FileText } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { VoiceCall } from './VoiceCall';

export type ImmediacyLevel = 'low' | 'moderate' | 'high' | 'critical';

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

interface SubmitRequestPayload {
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

interface SubmitRequestResponse {
  success: boolean;
  requestId?: string;
  priorityScore?: number;
  coordinates?: boolean;
}

const initialFormData: FormData = {
  name: '',
  phone: '',
  location: '',
  city: '',
  province: '',
  postalCode: '',
  latitude: '',
  longitude: '',
  situation: '',
  medicalConditions: '',
  immediacy: 'moderate',
  isChild: false,
  hasMobilityLimitations: false,
  environmentalHazards: '',
  numberOfPeople: '1',
};

export function RespondeeForm() {
  const navigate = useNavigate();
  const [showInputChoice, setShowInputChoice] = useState<boolean>(true);
  const [showVoiceCall, setShowVoiceCall] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const key = name as keyof FormData;
    if (!(key in initialFormData)) return;
    setFormData(prev => ({
      ...prev,
      [key]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString(),
          location: `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`
        }));
      },
      (error: GeolocationPositionError) => {
        console.error('Error getting location:', error);
        let errorMessage = 'Unable to get your location. ';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please allow location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
          default:
            errorMessage += 'Please enter your location manually.';
        }
        
        alert(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleGetHelp = () => {
    setShowInputChoice(true);
  };

  const handleInputByVoice = () => {
    setShowInputChoice(false);
    setShowVoiceCall(true);
  };

  const handleInputByForm = () => {
    setShowInputChoice(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim() || !formData.situation.trim()) {
      alert('Please provide at least your name, phone number, and situation description.');
      return;
    }
    setIsSubmitting(true);

    try {
      const payload: SubmitRequestPayload = {
        name: formData.name,
        phone: formData.phone,
        location: formData.location,
        city: formData.city,
        province: formData.province,
        postalCode: formData.postalCode,
        latitude: formData.latitude,
        longitude: formData.longitude,
        situation: formData.situation,
        medicalConditions: formData.medicalConditions,
        immediacy: formData.immediacy,
        isChild: formData.isChild,
        hasMobilityLimitations: formData.hasMobilityLimitations,
        environmentalHazards: formData.environmentalHazards,
        numberOfPeople: formData.numberOfPeople,
      };

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-636dcea6/submit-request`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to submit request: ${errorText}`);
      }

      const data = (await response.json()) as SubmitRequestResponse;

      if (data.success) {
        let message = `Help request submitted successfully!\n\nRequest ID: ${data.requestId}\nPriority Score: ${data.priorityScore}`;
        
        if (data.coordinates) {
          message += `\n\nYour location has been mapped and responders can see your position.`;
        } else {
          message += `\n\nYour address has been recorded. Responders will contact you at ${formData.phone}.`;
        }
        
        alert(message);
        navigate('/');
      } else {
        alert('Failed to submit request. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting help request:', error);
      alert('Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showInputChoice) {
    return (
      <div className="min-h-screen p-4 sm:p-6">
        <div className="max-w-2xl text-left">
          <Link to="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 text-sm sm:text-base">
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            Back to Home
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Request Help</h1>
          <p className="text-gray-600 text-sm sm:text-base mb-8">Choose how you'd like to submit your request</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <button
              type="button"
              onClick={handleInputByVoice}
              className="bg-blue-600 text-white rounded-xl p-6 sm:p-8 hover:bg-blue-700 active:scale-95 transition-all text-left sm:text-center flex flex-col items-start sm:items-center justify-center gap-3"
            >
              <Mic className="w-12 h-12 sm:w-14 sm:h-14" />
              <span className="text-xl sm:text-2xl font-bold">Input by voice</span>
              <span className="text-sm text-blue-100">Speak to our AI assistant to submit your request</span>
            </button>
            <button
              type="button"
              onClick={handleInputByForm}
              className="bg-white border-2 border-gray-200 text-gray-900 rounded-xl p-6 sm:p-8 hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition-all text-left sm:text-center flex flex-col items-start sm:items-center justify-center gap-3 shadow-sm"
            >
              <FileText className="w-12 h-12 sm:w-14 sm:h-14 text-gray-600" />
              <span className="text-xl sm:text-2xl font-bold">Input by form</span>
              <span className="text-sm text-gray-600">Fill out the form manually to submit your request</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showVoiceCall) {
    return (
      <div className="min-h-screen p-4 sm:p-6">
        <div className="max-w-2xl text-left">
          <Link to="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4 text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <VoiceCall
              title="AI Voice Assistant"
              embedded
              onBack={() => { setShowVoiceCall(false); setShowInputChoice(true); }}
              onLocationUpdate={(lat: string, lng: string, location: string) => {
                setFormData(prev => ({
                  ...prev,
                  latitude: lat,
                  longitude: lng,
                  location,
                }))
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-12 text-left sm:text-center max-w-md">
          <div className="w-16 h-16 bg-green-500 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted</h2>
          <p className="text-gray-600">Help is on the way. Responders have been notified of your request.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-2xl py-4 sm:py-6 text-left">
        <div className="mb-4 sm:mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-2 sm:mb-3 text-sm sm:text-base">
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            Back to Home
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Request Emergency Help</h1>
          <p className="text-gray-600 text-sm">Fill out this form to connect with emergency responders. Our AI system will prioritize your request based on urgency.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-4 sm:p-6 space-y-4">
          <div className="border-b pb-4">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <User className="w-4 h-4 sm:w-5 sm:h-5" />
              Personal Information
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your contact number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of People Needing Help <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  type="number"
                  name="numberOfPeople"
                  value={formData.numberOfPeople}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="border-b pb-4">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
              Location
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Street Address <span className="text-gray-400 font-normal">(optional if using GPS)</span></label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="123 Main Street, Apt 4B"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Toronto"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Province <span className="text-gray-400 font-normal">(optional)</span></label>
                  <select
                    name="province"
                    value={formData.province}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="A1A 1A1"
                  maxLength={7}
                />
                <p className="text-xs text-gray-500 mt-1">Format: A1A 1A1</p>
              </div>
              <button
                type="button"
                onClick={getCurrentLocation}
                className="w-full sm:w-auto bg-blue-100 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-200 active:scale-95 transition-all font-medium text-sm"
              >
                📍 Capture GPS Coordinates
              </button>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                  <input
                    type="text"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                    placeholder="Auto-filled"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                  <input
                    type="text"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                    placeholder="Auto-filled"
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-b pb-4">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
              Situation Details
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Describe Your Situation</label>
                <textarea
                  name="situation"
                  value={formData.situation}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="What is happening? What help do you need?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Medical Conditions or Injuries</label>
                <textarea
                  name="medicalConditions"
                  value={formData.medicalConditions}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., bleeding, unconscious, difficulty breathing"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">How Quickly is This Escalating? <span className="text-gray-400 font-normal">(optional)</span></label>
                <select
                  name="immediacy"
                  value={formData.immediacy}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">Stable - Not escalating</option>
                  <option value="moderate">Moderate - Could worsen soon</option>
                  <option value="high">Urgent - Rapidly worsening</option>
                  <option value="critical">Critical - Life-threatening</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Environmental Hazards</label>
                <input
                  type="text"
                  name="environmentalHazards"
                  value={formData.environmentalHazards}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., flood depth 3ft, near wildfire, structural damage"
                />
              </div>
            </div>
          </div>

          <div className="pb-4">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">Vulnerability Factors</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  name="isChild"
                  checked={formData.isChild}
                  onChange={handleChange}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-700 text-sm sm:text-base">Children present (under 18)</span>
              </label>
              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  name="hasMobilityLimitations"
                  checked={formData.hasMobilityLimitations}
                  onChange={handleChange}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-700 text-sm sm:text-base">Mobility limitations or disabilities</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-bold text-base hover:bg-red-700 active:scale-95 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Help Request'}
          </button>
        </form>

        <div className="mt-4 sm:mt-6 bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4">
          <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2 text-base sm:text-lg">
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
            Crisis Tips While You Wait
          </h3>
          <ul className="space-y-2 text-xs sm:text-sm text-blue-900">
            <li>• Stay calm and find a safe location if possible</li>
            <li>• Keep your phone charged and accessible</li>
            <li>• If injured, apply pressure to stop bleeding and avoid moving</li>
            <li>• In case of fire, stay low to avoid smoke inhalation</li>
            <li>• During floods, move to higher ground and avoid walking through water</li>
            <li>• If trapped, make noise to help rescuers locate you</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default RespondeeForm;
