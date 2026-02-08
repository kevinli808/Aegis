import { Link } from 'react-router-dom';
import { AlertTriangle, Flame, Droplets, Wind, Home, Heart, Phone } from 'lucide-react';
import { BackToHomeButton } from './BackToHomeButton';

export function DisasterInfo() {
  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <BackToHomeButton className="mb-4" />
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded text-white flex items-center justify-center font-bold text-lg flex-shrink-0">A</div>
            <h1 className="text-4xl font-bold text-gray-900">Disaster Safety Information</h1>
          </div>
          <p className="text-gray-600">Essential tips and information for various emergency situations</p>
        </div>

        {/* Emergency Numbers */}
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Phone className="w-6 h-6 text-red-600" />
            <h2 className="text-2xl font-bold text-red-900">Emergency Numbers</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Emergency Services</p>
              <p className="text-3xl font-bold text-red-600">911</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Poison Control</p>
              <p className="text-2xl font-bold text-red-600">1-800-222-1222</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Crisis Hotline</p>
              <p className="text-2xl font-bold text-red-600">988</p>
            </div>
          </div>
        </div>

        {/* Disaster Types */}
        <div className="space-y-6">
          {/* Fire Safety */}
          <div className="bg-white rounded-xl overflow-hidden">
            <div className="bg-orange-500 p-4 flex items-center gap-3">
              <Flame className="w-8 h-8 text-white" />
              <h2 className="text-2xl font-bold text-white">Fire Safety</h2>
            </div>
            <div className="p-6">
              <h3 className="font-bold text-gray-900 mb-3">Before a Fire:</h3>
              <ul className="space-y-2 mb-4 text-gray-700">
                <li>• Install and test smoke alarms monthly</li>
                <li>• Create and practice a fire escape plan with two exits from every room</li>
                <li>• Keep fire extinguishers accessible and know how to use them</li>
                <li>• Store flammable materials properly and away from heat sources</li>
              </ul>
              <h3 className="font-bold text-gray-900 mb-3">During a Fire:</h3>
              <ul className="space-y-2 mb-4 text-gray-700">
                <li>• Get out immediately - don't stop to gather belongings</li>
                <li>• Stay low to avoid smoke inhalation</li>
                <li>• Test doors before opening - if hot, use alternate exit</li>
                <li>• Once out, stay out and call 911</li>
                <li>• If trapped, close doors between you and the fire, seal cracks, signal for help</li>
              </ul>
              <h3 className="font-bold text-gray-900 mb-3">Wildfire Specific:</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Create defensible space around your home (30-100 feet clearance)</li>
                <li>• Evacuate immediately when ordered</li>
                <li>• Wear protective clothing and N95 mask if evacuating through smoke</li>
              </ul>
            </div>
          </div>

          {/* Flood Safety */}
          <div className="bg-white rounded-xl overflow-hidden">
            <div className="bg-blue-500 p-4 flex items-center gap-3">
              <Droplets className="w-8 h-8 text-white" />
              <h2 className="text-2xl font-bold text-white">Flood Safety</h2>
            </div>
            <div className="p-6">
              <h3 className="font-bold text-gray-900 mb-3">Before a Flood:</h3>
              <ul className="space-y-2 mb-4 text-gray-700">
                <li>• Know your flood risk and evacuation routes</li>
                <li>• Create an emergency kit with water, food, medications, and documents</li>
                <li>• Sign up for emergency alerts in your area</li>
                <li>• Consider flood insurance (regular insurance doesn't cover floods)</li>
              </ul>
              <h3 className="font-bold text-gray-900 mb-3">During a Flood:</h3>
              <ul className="space-y-2 mb-4 text-gray-700">
                <li>• Move to higher ground immediately when flooding begins</li>
                <li>• NEVER walk, swim, or drive through flood waters - "Turn Around, Don't Drown"</li>
                <li>• Just 6 inches of moving water can knock you down</li>
                <li>• 12 inches of water can carry away most vehicles</li>
                <li>• Avoid contact with flood water - it may be contaminated</li>
              </ul>
              <h3 className="font-bold text-gray-900 mb-3">Is It Safe to Go Outside?</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• NO if flood waters are rising or flowing</li>
                <li>• NO if authorities have issued evacuation orders</li>
                <li>• NO if you see downed power lines (water conducts electricity)</li>
                <li>• Wait for official all-clear before returning home</li>
              </ul>
            </div>
          </div>

          {/* Earthquake Safety */}
          <div className="bg-white rounded-xl overflow-hidden">
            <div className="bg-amber-600 p-4 flex items-center gap-3">
              <Home className="w-8 h-8 text-white" />
              <h2 className="text-2xl font-bold text-white">Earthquake Safety</h2>
            </div>
            <div className="p-6">
              <h3 className="font-bold text-gray-900 mb-3">Before an Earthquake:</h3>
              <ul className="space-y-2 mb-4 text-gray-700">
                <li>• Secure heavy furniture and appliances to walls</li>
                <li>• Store heavy items on lower shelves</li>
                <li>• Identify safe spots: under sturdy tables, against interior walls</li>
                <li>• Practice "Drop, Cover, and Hold On"</li>
              </ul>
              <h3 className="font-bold text-gray-900 mb-3">During an Earthquake:</h3>
              <ul className="space-y-2 mb-4 text-gray-700">
                <li>• DROP to hands and knees</li>
                <li>• COVER your head and neck under a sturdy table or desk</li>
                <li>• HOLD ON and be prepared to move with your shelter</li>
                <li>• If outdoors, move away from buildings, trees, and power lines</li>
                <li>• If in a car, pull over safely and stay inside until shaking stops</li>
              </ul>
              <h3 className="font-bold text-gray-900 mb-3">After an Earthquake:</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Expect aftershocks</li>
                <li>• Check for injuries and provide first aid</li>
                <li>• Check for gas leaks, water damage, electrical damage</li>
                <li>• Stay away from damaged buildings</li>
                <li>• Be cautious of broken glass and debris</li>
              </ul>
            </div>
          </div>

          {/* Severe Weather */}
          <div className="bg-white rounded-xl overflow-hidden">
            <div className="bg-purple-600 p-4 flex items-center gap-3">
              <Wind className="w-8 h-8 text-white" />
              <h2 className="text-2xl font-bold text-white">Severe Weather (Tornado/Hurricane)</h2>
            </div>
            <div className="p-6">
              <h3 className="font-bold text-gray-900 mb-3">Tornado Safety:</h3>
              <ul className="space-y-2 mb-4 text-gray-700">
                <li>• Go to the lowest floor, interior room (closet, bathroom, hallway)</li>
                <li>• Stay away from windows, doors, and outside walls</li>
                <li>• Get under a sturdy piece of furniture and protect your head</li>
                <li>• If in a mobile home, GET OUT and seek sturdy shelter</li>
                <li>• If outside with no shelter, lie flat in a ditch or low-lying area</li>
              </ul>
              <h3 className="font-bold text-gray-900 mb-3">Hurricane Safety:</h3>
              <ul className="space-y-2 mb-4 text-gray-700">
                <li>• Evacuate if ordered by authorities</li>
                <li>• Board up windows or close storm shutters</li>
                <li>• Bring outdoor objects inside</li>
                <li>• Fill bathtubs and containers with water</li>
                <li>• Stay indoors away from windows during the storm</li>
                <li>• Beware of the calm "eye" - the storm will resume</li>
              </ul>
            </div>
          </div>

          {/* Medical Emergencies */}
          <div className="bg-white rounded-xl overflow-hidden">
            <div className="bg-red-600 p-4 flex items-center gap-3">
              <Heart className="w-8 h-8 text-white" />
              <h2 className="text-2xl font-bold text-white">Medical Emergency Tips</h2>
            </div>
            <div className="p-6">
              <h3 className="font-bold text-gray-900 mb-3">Bleeding:</h3>
              <ul className="space-y-2 mb-4 text-gray-700">
                <li>• Apply direct pressure with clean cloth</li>
                <li>• Don't remove cloth if it becomes soaked - add more on top</li>
                <li>• Elevate the injured area above the heart if possible</li>
                <li>• Call 911 for severe bleeding that won't stop</li>
              </ul>
              <h3 className="font-bold text-gray-900 mb-3">Unconscious Person:</h3>
              <ul className="space-y-2 mb-4 text-gray-700">
                <li>• Call 911 immediately</li>
                <li>• Check if they're breathing</li>
                <li>• If not breathing, begin CPR if trained</li>
                <li>• Don't move them unless in immediate danger</li>
                <li>• Turn them on their side if they're breathing but unconscious</li>
              </ul>
              <h3 className="font-bold text-gray-900 mb-3">Burns:</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Cool the burn with cool (not ice cold) water for 10-20 minutes</li>
                <li>• Cover with sterile, non-stick bandage</li>
                <li>• Do NOT apply ice, butter, or ointments</li>
                <li>• Seek medical help for large burns, burns on face/hands/feet, or third-degree burns</li>
              </ul>
            </div>
          </div>

          {/* General Preparedness */}
          <div className="bg-white rounded-xl overflow-hidden">
            <div className="bg-green-600 p-4 flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-white" />
              <h2 className="text-2xl font-bold text-white">General Emergency Preparedness</h2>
            </div>
            <div className="p-6">
              <h3 className="font-bold text-gray-900 mb-3">Emergency Kit Essentials:</h3>
              <ul className="space-y-2 mb-4 text-gray-700">
                <li>• Water (1 gallon per person per day for 3 days)</li>
                <li>• Non-perishable food (3-day supply)</li>
                <li>• Battery or hand-crank radio</li>
                <li>• Flashlight and extra batteries</li>
                <li>• First aid kit</li>
                <li>• Medications (7-day supply) and medical items</li>
                <li>• Multi-purpose tool</li>
                <li>• Personal hygiene items</li>
                <li>• Copies of important documents (insurance, IDs)</li>
                <li>• Cell phone with chargers and backup battery</li>
                <li>• Cash</li>
                <li>• Emergency blanket</li>
              </ul>
              <h3 className="font-bold text-gray-900 mb-3">Family Emergency Plan:</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Identify meeting places (near home and outside neighborhood)</li>
                <li>• Choose an out-of-state contact person</li>
                <li>• Make sure everyone knows how to text (texts often work when calls don't)</li>
                <li>• Plan for pets</li>
                <li>• Practice your plan regularly</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-8 bg-blue-600 rounded-xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-3">Need Immediate Help?</h2>
          <p className="mb-6">If you're experiencing an emergency, submit a help request now.</p>
          <Link
            to="/request-help"
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-blue-50 transition-colors"
          >
            Request Help
          </Link>
        </div>
      </div>
    </div>
  );
}

export default DisasterInfo
