import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, MapPin, Clock, AlertTriangle, User, Phone, Filter, Map as MapIcon, Shield } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { LiveMap } from './LiveMap';
import { DisasterUpdates } from './DisasterUpdates';

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
  responders?: string[];
}

export function ResponderDashboard() {
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<HelpRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<HelpRequest | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, searchQuery, statusFilter]);

  const fetchRequests = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-636dcea6/get-requests`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch requests: ${errorText}`);
      }

      const data = await response.json();
      console.log('Fetched requests:', data);
      setRequests(data.requests || []);
    } catch (error) {
      console.error('Error fetching help requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = [...requests];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(req =>
        req.name.toLowerCase().includes(query) ||
        req.location.toLowerCase().includes(query) ||
        req.situation.toLowerCase().includes(query)
      );
    }

    setFilteredRequests(filtered);
  };

  const handleStatusUpdate = async (requestId: string, newStatus: string) => {
    const responderName = prompt('Enter your name:');
    if (!responderName) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-636dcea6/update-status`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ requestId, status: newStatus, responderName }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        alert(`Status updated! ${data.responders?.length || 0} responder(s) on this incident.`);
        fetchRequests();
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status');
    }
  };

  const getPriorityColor = (score: number) => {
    if (score >= 80) return 'bg-red-100 text-red-800 border-red-300';
    if (score >= 60) return 'bg-orange-100 text-orange-800 border-orange-300';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-green-100 text-green-800 border-green-300';
  };

  const getPriorityLabel = (score: number) => {
    if (score >= 80) return 'CRITICAL';
    if (score >= 60) return 'HIGH';
    if (score >= 40) return 'MEDIUM';
    return 'LOW';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMarkerColor = (score: number) => {
    if (score >= 80) return '#dc2626';
    if (score >= 60) return '#ea580c';
    if (score >= 40) return '#ca8a04';
    return '#16a34a';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
          <Link to="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-2 sm:mb-3 text-sm">
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            Back to Home
          </Link>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded text-white flex items-center justify-center font-bold text-sm flex-shrink-0">A</div>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">Responder Dashboard</h1>
                <p className="text-gray-600 text-sm sm:text-base mt-1">
                  {filteredRequests.length} active request{filteredRequests.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="lg:hidden bg-gray-100 p-2 rounded-lg hover:bg-gray-200"
                aria-label="Toggle filters"
              >
                <Filter className="w-5 h-5 text-gray-700" />
              </button>
              
              <Link
                to="/admin/login"
                className="bg-gray-700 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm sm:text-base whitespace-nowrap flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                Admin
              </Link>

              <button
                onClick={fetchRequests}
                className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base whitespace-nowrap"
              >
                ↻ Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
        <DisasterUpdates />

        <div className="grid lg:grid-cols-4 gap-4 sm:gap-6">
          <div className={`
            lg:col-span-1 
            ${showSidebar ? 'fixed inset-0 z-50 bg-black bg-opacity-50 lg:relative lg:bg-transparent' : 'hidden lg:block'}
          `}>
            <div className={`
              bg-white rounded-xl shadow-md p-4 sm:p-6 
              ${showSidebar ? 'fixed right-0 top-0 bottom-0 w-80 overflow-y-auto' : 'lg:sticky lg:top-24'}
            `}>
              {showSidebar && (
                <button
                  onClick={() => setShowSidebar(false)}
                  className="lg:hidden absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              )}
              
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-base sm:text-lg">
                <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
                Filters & Search
              </h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Name, location..."
                    className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Requests</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">Statistics</h3>
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Requests:</span>
                    <span className="font-semibold">{requests.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pending:</span>
                    <span className="font-semibold text-yellow-600">
                      {requests.filter(r => r.status === 'pending').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">In Progress:</span>
                    <span className="font-semibold text-blue-600">
                      {requests.filter(r => r.status === 'in-progress').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Resolved:</span>
                    <span className="font-semibold text-green-600">
                      {requests.filter(r => r.status === 'resolved').length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">Priority Legend</h3>
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-red-600 flex-shrink-0"></div>
                    <span className="text-gray-700">Critical (80+)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-orange-600 flex-shrink-0"></div>
                    <span className="text-gray-700">High (60-79)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-yellow-600 flex-shrink-0"></div>
                    <span className="text-gray-700">Medium (40-59)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-green-600 flex-shrink-0"></div>
                    <span className="text-gray-700">Low (0-39)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-4 sm:space-y-6">
            <div className="bg-white rounded-xl shadow-md overflow-hidden relative z-0">
              <div className="h-[400px] sm:h-[600px] relative" id="map-container">
                <LiveMap 
                  requests={filteredRequests} 
                  selectedRequest={selectedRequest}
                  onSelectRequest={setSelectedRequest}
                />
              </div>
            </div>

            <div className="relative z-10">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">All Requests</h2>
              {filteredRequests.length === 0 ? (
                <div className="bg-white rounded-xl shadow-md p-12 text-center">
                  <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Requests Found</h3>
                  <p className="text-gray-600">
                    {searchQuery || statusFilter !== 'all' 
                      ? 'Try adjusting your filters'
                      : 'No help requests at the moment'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRequests.map((request) => (
                    <div
                      key={request.id}
                      className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow cursor-pointer ${
                        selectedRequest?.id === request.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => setSelectedRequest(selectedRequest?.id === request.id ? null : request)}
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-bold text-gray-900">{request.name}</h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(request.status)}`}>
                                {request.status.toUpperCase()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600 text-sm">
                              <Clock className="w-4 h-4" />
                              {new Date(request.timestamp).toLocaleString()}
                            </div>
                          </div>
                          <div className={`px-4 py-2 rounded-lg border-2 font-bold text-center min-w-[100px] ${getPriorityColor(request.priorityScore)}`}>
                            <div className="text-xs">PRIORITY</div>
                            <div className="text-lg">{getPriorityLabel(request.priorityScore)}</div>
                            <div className="text-xs">{request.priorityScore}</div>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-3 mb-4">
                          <div className="flex items-center gap-2 text-gray-700">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span className="text-sm">{request.location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-700">
                            <Phone className="w-4 h-4 flex-shrink-0" />
                            <span className="text-sm">{request.phone}</span>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-3 mb-4">
                          <p className="text-sm text-gray-700 line-clamp-2">{request.situation}</p>
                        </div>

                        {selectedRequest?.id === request.id && (
                          <div className="border-t pt-4 mt-4 space-y-4">
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2">Full Situation Description</h4>
                              <p className="text-gray-700">{request.situation}</p>
                            </div>

                            {request.medicalConditions && (
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-2">Medical Conditions</h4>
                                <p className="text-gray-700">{request.medicalConditions}</p>
                              </div>
                            )}

                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-2">Details</h4>
                                <ul className="space-y-1 text-sm text-gray-700">
                                  <li>• Immediacy: <strong>{request.immediacy}</strong></li>
                                  <li>• Number of people: <strong>{request.numberOfPeople}</strong></li>
                                  <li>• Children present: <strong>{request.isChild ? 'Yes' : 'No'}</strong></li>
                                  <li>• Mobility limitations: <strong>{request.hasMobilityLimitations ? 'Yes' : 'No'}</strong></li>
                                </ul>
                              </div>

                              {request.environmentalHazards && (
                                <div>
                                  <h4 className="font-semibold text-gray-900 mb-2">Environmental Hazards</h4>
                                  <p className="text-sm text-gray-700">{request.environmentalHazards}</p>
                                </div>
                              )}
                            </div>

                            {request.latitude && request.longitude && (
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-2">Coordinates</h4>
                                <p className="text-sm text-gray-700">
                                  {request.latitude}, {request.longitude}
                                </p>
                                <a
                                  href={`https://www.google.com/maps?q=${request.latitude},${request.longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 text-sm"
                                >
                                  View on Google Maps →
                                </a>
                              </div>
                            )}

                            {selectedRequest.responders && selectedRequest.responders.length > 0 && (
                              <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                <h4 className="font-semibold text-purple-900 mb-2">
                                  Responders ({selectedRequest.responders.length})
                                </h4>
                                <div className="space-y-1">
                                  {selectedRequest.responders.map((responder, idx) => (
                                    <div key={idx} className="text-sm text-purple-800">
                                      • {responder}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="flex gap-3 pt-4">
                              {request.status === 'pending' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusUpdate(request.id, 'in-progress');
                                  }}
                                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                                >
                                  Start Response
                                </button>
                              )}
                              {request.status === 'in-progress' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusUpdate(request.id, 'resolved');
                                  }}
                                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                                >
                                  Mark as Resolved
                                </button>
                              )}
                              {request.status === 'resolved' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusUpdate(request.id, 'pending');
                                  }}
                                  className="flex-1 bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 transition-colors font-semibold"
                                >
                                  Reopen Request
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {selectedRequest?.id !== request.id && (
                          <div className="text-center pt-2">
                            <span className="text-xs text-gray-500">Click to view full details</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResponderDashboard;
