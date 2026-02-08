import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, AlertTriangle, User, Phone, MessageSquare, Mic } from 'lucide-react';
// import { projectId, publicAnonKey } from '../utils/supabase/info';

export function RespondeeForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
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
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
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
      (error) => {
        console.error('Error getting location:', error);
        let errorMessage = 'Unable to get your location. ';
        
        switch(error.code) {
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

  const handleVoiceCall = () => {
    alert('Voice call feature - to be implemented with ElevenLabs AI');
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);

  // 1. Prepare the payload to match the BaseModel above
  const payload = {
  type: formData.situation,          // Backend expects 'type'
  num_people: Number(formData.numberOfPeople), // Backend expects an integer
  symptoms: formData.medicalConditions ? [formData.medicalConditions] : [], // Backend expects a List/Array
  safety_status: formData.immediacy, // Backend expects 'safety_status'
  location: {
    type: "Point",
    coordinates: [
      parseFloat(formData.longitude) || 0, 
      parseFloat(formData.latitude) || 0
    ]
  }
};

  try {
    // 2. Send to your local FastAPI server
    const response = await fetch('http://localhost:8000/report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', // This is the ONLY one you need
      },
      body: JSON.stringify(payload),
    });

    console.log("Response Status:", response.status);
    response.headers.forEach((value, name) => {
      console.log(`${name}: ${value}`);
    });
    

    // 3. Handle the response
    if (response.status === 422) {
      const errorDetail = await response.json();
      console.error("Validation Error:", errorDetail);
      alert("Format error: Check the console to see which field failed.");
      return;
    }

    if (!response.ok) throw new Error('Network response was not ok');

    const result = await response.json();
    console.log("Success:", result);
    setSubmitSuccess(true);
    navigate('/');

  } catch (error) {
    console.error('Submit error:', error);
    alert('Failed to connect to backend.');
  } finally {
    setIsSubmitting(false);
  }
};

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setIsSubmitting(true);

  //   try {
  //     const payload = {
  //       name: formData.name,
  //       phone: formData.phone,
  //       location: formData.location,
  //       city: formData.city,
  //       province: formData.province,
  //       postalCode: formData.postalCode,
  //       latitude: formData.latitude,
  //       longitude: formData.longitude,
  //       situation: formData.situation,
  //       medicalConditions: formData.medicalConditions,
  //       immediacy: formData.immediacy,
  //       isChild: formData.isChild,
  //       hasMobilityLimitations: formData.hasMobilityLimitations,
  //       environmentalHazards: formData.environmentalHazards,
  //       numberOfPeople: formData.numberOfPeople,
  //     };

  //     const response = await fetch(
  //       `https://${projectId}.supabase.co/functions/v1/make-server-636dcea6/submit-request`,
  //       {
  //         method: 'POST',
  //         headers: {
  //           'Content-Type': 'application/json',
  //           'Authorization': `Bearer ${publicAnonKey}`,
  //         },
  //         body: JSON.stringify(payload),
  //       }
  //     );

  //     if (!response.ok) {
  //       const errorText = await response.text();
  //       throw new Error(`Failed to submit request: ${errorText}`);
  //     }

  //     const data = await response.json();

  //     if (data.success) {
  //       let message = `Help request submitted successfully!\n\nRequest ID: ${data.requestId}\nPriority Score: ${data.priorityScore}`;
        
  //       if (data.coordinates) {
  //         message += `\n\nYour location has been mapped and responders can see your position.`;
  //       } else {
  //         message += `\n\nYour address has been recorded. Responders will contact you at ${formData.phone}.`;
  //       }
        
  //       alert(message);
  //       navigate('/');
  //     } else {
  //       alert('Failed to submit request. Please try again.');
  //     }
  //   } catch (error) {
  //     console.error('Error submitting help request:', error);
  //     alert('Failed to submit request. Please try again.');
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };

  // if (submitSuccess) {
  //   return (
  //     <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
  //       <div className="bg-white rounded-2xl shadow-xl p-12 text-center max-w-md">
  //         <div className="w-16 h-16 bg-green-500 rounded-full mx-auto mb-4 flex items-center justify-center">
  //           <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  //           </svg>
  //         </div>
  //         <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted</h2>
  //         <p className="text-gray-600">Help is on the way. Responders have been notified of your request.</p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-3 sm:mb-4 text-sm sm:text-base">
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            Back to Home
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Request Emergency Help</h1>
          <p className="text-gray-600 text-sm sm:text-base">Fill out this form to connect with emergency responders. Our AI system will prioritize your request based on urgency.</p>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-white text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Can't type? Call for help</h2>
              <p className="text-blue-100 text-sm sm:text-base">Speak to our AI assistant to submit your request</p>
            </div>
            <button
              type="button"
              onClick={handleVoiceCall}
              className="w-full sm:w-auto bg-white text-blue-600 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:bg-blue-50 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl"
            >
              <Mic className="w-5 h-5 sm:w-6 sm:h-6" />
              Start Voice Call
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-4 sm:p-8 space-y-6">
          <div className="border-b pb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 sm:w-5 sm:h-5" />
              Personal Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your contact number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of People Needing Help</label>
                <input
                  type="number"
                  name="numberOfPeople"
                  value={formData.numberOfPeople}
                  onChange={handleChange}
                  min="1"
                  required
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="border-b pb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
              Location
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="123 Main Street, Apt 4B"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Toronto"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                  <select
                    name="province"
                    value={formData.province}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="A1A 1A1"
                  maxLength={7}
                  pattern="[A-Za-z][0-9][A-Za-z] ?[0-9][A-Za-z][0-9]"
                />
                <p className="text-xs text-gray-500 mt-1">Format: A1A 1A1</p>
              </div>
              <button
                type="button"
                onClick={getCurrentLocation}
                className="w-full sm:w-auto bg-blue-100 text-blue-700 px-4 py-3 rounded-lg hover:bg-blue-200 active:scale-95 transition-all font-medium"
              >
                📍 Capture GPS Coordinates
              </button>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                  <input
                    type="text"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
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
                    className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                    placeholder="Auto-filled"
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-b pb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
              Situation Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Describe Your Situation</label>
                <textarea
                  name="situation"
                  value={formData.situation}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., bleeding, unconscious, difficulty breathing"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">How Quickly is This Escalating?</label>
                <select
                  name="immediacy"
                  value={formData.immediacy}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., flood depth 3ft, near wildfire, structural damage"
                />
              </div>
            </div>
          </div>

          <div className="pb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Vulnerability Factors</h2>
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
            className="w-full bg-red-600 text-white py-4 px-6 rounded-lg font-bold text-lg hover:bg-red-700 active:scale-95 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Help Request'}
          </button>
        </form>

        <div className="mt-6 sm:mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6">
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
