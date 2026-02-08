import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, AlertTriangle, Phone, Shield, Filter, Search } from 'lucide-react';
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
  const [viewMode, setViewMode] = useState<'active' | 'all'>('active');
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
      const filtered = (data.requests || []).filter((req: HelpRequest) => {
        const testNames = ['Kevin Li'];
        const testSituations = ['i might actually die from a snake', 'helpppp', 'hj'];
        return !testNames.includes(req.name) && !testSituations.includes(req.situation);
      });
      setRequests(filtered);
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
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'in-progress': return 'bg-sky-100 text-sky-800';
      case 'resolved': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const inProgressCount = requests.filter(r => r.status === 'in-progress').length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 text-sky-600 hover:text-sky-700 text-sm mb-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <p className="text-gray-500 text-sm">Welcome back</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Responder Dashboard</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="lg:hidden p-2.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
              aria-label="Filters"
            >
              <Filter className="w-5 h-5" />
            </button>
            <Link
              to="/admin/login"
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-gray-100 text-slate-700 hover:bg-gray-200 text-sm font-medium"
            >
              <Shield className="w-4 h-4" />
              Admin
            </Link>
            <button
              onClick={fetchRequests}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-gray-100 text-slate-700 hover:bg-gray-200 text-sm font-medium"
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        <DisasterUpdates />

        {/* Impact Section */}
        <div className="mb-6">
          <h2 className="text-gray-600 font-medium mb-3">Impact</h2>
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setViewMode('active')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                viewMode === 'active'
                  ? 'bg-sky-100 text-sky-800'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                viewMode === 'all'
                  ? 'bg-sky-100 text-sky-800'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              All
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-sky-50 rounded-2xl p-4 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-slate-700">
                <AlertTriangle className="w-5 h-5" />
                <span className="text-sm font-medium">Pending</span>
              </div>
              <span className="text-2xl sm:text-3xl font-bold text-slate-800">{pendingCount}</span>
            </div>
            <div className="bg-sky-50 rounded-2xl p-4 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-slate-700">
                <Clock className="w-5 h-5" />
                <span className="text-sm font-medium">In Progress</span>
              </div>
              <span className="text-2xl sm:text-3xl font-bold text-slate-800">{inProgressCount}</span>
            </div>
          </div>
        </div>

        {/* Total stat */}
        <div className="mb-6">
          <p className="text-gray-600 text-sm mb-1">So far, we've handled</p>
          <p className="text-3xl sm:text-4xl font-bold text-slate-800">
            {requests.length} request{requests.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Locations / Map */}
        <div className="mb-6">
          <h2 className="text-gray-600 font-medium mb-3">Locations</h2>
          <div className="rounded-2xl overflow-hidden border border-gray-200 bg-gray-50">
            <div className="h-[320px] relative">
              <LiveMap
                requests={viewMode === 'active' ? filteredRequests.filter(r => r.status !== 'resolved') : filteredRequests}
                selectedRequest={selectedRequest}
                onSelectRequest={(r) => setSelectedRequest(r ? requests.find(req => req.id === r.id) ?? null : null)}
              />
            </div>
          </div>
          <Link
            to="/request-help"
            className="mt-4 flex items-center justify-center gap-2 w-full py-3.5 rounded-full bg-slate-800 text-white font-medium hover:bg-slate-900 transition-colors"
          >
            Report New Incident →
          </Link>
        </div>

        {/* Filters sidebar (mobile overlay) */}
        {showSidebar && (
          <div className="fixed inset-0 z-50 bg-black/30 lg:hidden" onClick={() => setShowSidebar(false)}>
            <div
              className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-xl p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-slate-800">Filters</h3>
                <button onClick={() => setShowSidebar(false)} className="text-gray-500">✕</button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Name, location..."
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="all">All</option>
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* All Requests */}
        <div>
          <h2 className="text-gray-600 font-medium mb-3">All Requests</h2>
          {filteredRequests.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 p-12 text-center">
              <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                {searchQuery || statusFilter !== 'all' ? 'Try adjusting your filters' : 'No requests at the moment'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((request) => (
                <div
                  key={request.id}
                  onClick={() => setSelectedRequest(selectedRequest?.id === request.id ? null : request)}
                  className={`rounded-2xl border p-4 cursor-pointer transition-all ${
                    selectedRequest?.id === request.id
                      ? 'border-sky-500 ring-2 ring-sky-100 bg-white'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-slate-800">{request.name}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {request.status.replace('-', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(request.timestamp).toLocaleString()}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 text-sm mt-1">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{request.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{request.phone}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{request.situation}</p>
                    </div>
                    <div className={`px-3 py-2 rounded-xl text-center min-w-[80px] flex-shrink-0 ${getPriorityColor(request.priorityScore)}`}>
                      <div className="text-xs font-medium">PRIORITY</div>
                      <div className="text-sm font-bold">{getPriorityLabel(request.priorityScore)}</div>
                      <div className="text-xs">{request.priorityScore}</div>
                    </div>
                  </div>

                  {selectedRequest?.id === request.id && (
                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 mb-1">Full Details</h4>
                        <p className="text-sm text-gray-600">{request.situation}</p>
                      </div>
                      {request.medicalConditions && (
                        <div>
                          <h4 className="text-sm font-semibold text-slate-700 mb-1">Medical</h4>
                          <p className="text-sm text-gray-600">{request.medicalConditions}</p>
                        </div>
                      )}
                      <div className="flex gap-2">
                        {request.status === 'pending' && (
                          <button
                            onClick={e => { e.stopPropagation(); handleStatusUpdate(request.id, 'in-progress'); }}
                            className="flex-1 py-2.5 rounded-full bg-sky-600 text-white font-medium hover:bg-sky-700 text-sm"
                          >
                            Start Response
                          </button>
                        )}
                        {request.status === 'in-progress' && (
                          <button
                            onClick={e => { e.stopPropagation(); handleStatusUpdate(request.id, 'resolved'); }}
                            className="flex-1 py-2.5 rounded-full bg-emerald-600 text-white font-medium hover:bg-emerald-700 text-sm"
                          >
                            Mark Resolved
                          </button>
                        )}
                        {request.status === 'resolved' && (
                          <button
                            onClick={e => { e.stopPropagation(); handleStatusUpdate(request.id, 'pending'); }}
                            className="flex-1 py-2.5 rounded-full bg-amber-600 text-white font-medium hover:bg-amber-700 text-sm"
                          >
                            Reopen
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedRequest?.id !== request.id && (
                    <p className="text-xs text-gray-400 mt-2 text-center">Tap for full details</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResponderDashboard;
