import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, AlertTriangle, Phone, Shield, Search, ChevronDown, List } from 'lucide-react';
import { API_BASE } from '../config';
import { LiveMap } from './LiveMap';
import { BackToHomeButton } from './BackToHomeButton';
import { Drawer } from './Drawer';
import { useToast } from './Toast';

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
  const [showDrawer, setShowDrawer] = useState(false);
  const { error } = useToast();

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, searchQuery, statusFilter]);

  const mapMongoToHelpRequest = (req: Record<string, unknown>): HelpRequest => {
    const loc = req.location as { type?: string; coordinates?: number[] } | undefined
    const hasCoords = loc?.type === 'Point' && Array.isArray(loc?.coordinates)
    return {
    id: String(req._id ?? ''),
    name: String(req.name ?? ''),
    phone: String(req.phone ?? ''),
    location: hasCoords && loc?.coordinates
      ? `${(loc.coordinates[1] ?? 0).toFixed(4)}, ${(loc.coordinates[0] ?? 0).toFixed(4)}`
      : String(req.location ?? req.city ?? req.province ?? ''),
    city: String(req.city ?? ''),
    province: String(req.province ?? ''),
    postalCode: String(req.postalCode ?? ''),
    latitude: hasCoords && loc?.coordinates ? String(loc.coordinates[1] ?? '') : '',
    longitude: hasCoords && loc?.coordinates ? String(loc.coordinates[0] ?? '') : '',
    situation: String(req.situation ?? req.type ?? req.safety_status ?? ''),
    medicalConditions: String(req.medicalConditions ?? (Array.isArray(req.symptoms) ? req.symptoms.join(', ') : '')),
    immediacy: String(req.immediacy ?? ''),
    isChild: Boolean(req.isChild ?? false),
    hasMobilityLimitations: Boolean(req.hasMobilityLimitations ?? false),
    environmentalHazards: String(req.environmentalHazards ?? ''),
    numberOfPeople: String(req.numberOfPeople ?? req.num_people ?? '1'),
    priorityScore: Number(req.priorityScore ?? req.score ?? req.final_score ?? 0),
    timestamp: String(req.timestamp ?? ''),
    status: String(req.status ?? 'pending'),
  }
  };

  const fetchRequests = async () => {
    try {
      const response = await fetch(`${API_BASE}/incidents`, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to fetch');
      const data = (await response.json()) as Record<string, unknown>[];
      setRequests((data || []).map(mapMongoToHelpRequest));
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
    try {
      const response = await fetch(`${API_BASE}/incidents/${requestId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        fetchRequests();
      } else {
        error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
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
      case 'pending': return 'bg-amber-100 text-amber-900 border border-amber-300';
      case 'in-progress': return 'bg-sky-100 text-sky-800 border border-sky-300';
      case 'resolved': return 'bg-emerald-100 text-emerald-800 border border-emerald-300';
      default: return 'bg-gray-100 text-gray-800 border border-gray-300';
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const inProgressCount = requests.filter(r => r.status === 'in-progress').length;
  const resolvedCount = requests.filter(r => r.status === 'resolved').length;
  const activeCount = pendingCount + inProgressCount;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading requests...</p>
        </div>
      </div>
    );
  }

  const filtersContent = (
    <>
      <div className="mb-6">
        <h3 className="font-bold text-slate-800 mb-3">Filters & Search</h3>
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Name, location..."
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-400 focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2.5 pr-9 rounded-lg border border-gray-400 focus:ring-2 focus:ring-sky-500 appearance-none bg-white text-sm"
            >
              <option value="all">All Requests</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-bold text-slate-800 mb-3">Statistics</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex justify-between">
            <span className="text-gray-600">Total Requests:</span>
            <span className="font-semibold text-slate-800">{requests.length}</span>
          </li>
          <li className="flex justify-between">
            <span className="text-gray-600">Pending:</span>
            <span className="font-semibold text-amber-600">{pendingCount}</span>
          </li>
          <li className="flex justify-between">
            <span className="text-gray-600">In Progress:</span>
            <span className="font-semibold text-sky-600">{inProgressCount}</span>
          </li>
          <li className="flex justify-between">
            <span className="text-gray-600">Resolved:</span>
            <span className="font-semibold text-emerald-600">{resolvedCount}</span>
          </li>
        </ul>
      </div>

      <div>
        <h3 className="font-bold text-slate-800 mb-3">Priority Legend</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-gray-700">Critical (80+)</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-gray-700">High (60-79)</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-gray-700">Medium (40-59)</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-gray-700">Low (0-39)</span>
          </li>
        </ul>
      </div>
    </>
  );

  const RequestCard = ({ request }: { request: HelpRequest }) => (
    <div
      onClick={() => setSelectedRequest(selectedRequest?.id === request.id ? null : request)}
      className={`rounded-xl border p-4 cursor-pointer transition-all bg-white ${
        selectedRequest?.id === request.id
          ? 'border-sky-500 ring-2 ring-sky-100'
          : 'border-gray-400 hover:border-gray-500'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-bold text-neutral-800">{request.name}</h3>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
              {request.status.replace('-', ' ').toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Clock className="w-3.5 h-3.5" />
            {new Date(request.timestamp).toLocaleString()}
          </div>
          <div className="flex items-center gap-2 text-gray-600 text-sm mt-1">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{request.location}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 text-sm">
            <Phone className="w-3.5 h-3.5 shrink-0" />
            <span>{request.phone}</span>
          </div>
          <p className="text-sm text-gray-600 mt-2 line-clamp-2">{request.situation}</p>
        </div>
        <div className={`px-3 py-2 rounded-xl text-center min-w-[80px] shrink-0 ${getPriorityColor(request.priorityScore)}`}>
          <div className="text-xs font-medium">PRIORITY</div>
          <div className="text-sm font-bold">{getPriorityLabel(request.priorityScore)}</div>
          <div className="text-xs">{request.priorityScore}</div>
        </div>
      </div>

      {selectedRequest?.id === request.id && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-neutral-700 mb-1">Full Details</h4>
            <p className="text-sm text-gray-600">{request.situation}</p>
          </div>
          {request.medicalConditions && (
            <div>
              <h4 className="text-sm font-semibold text-neutral-700 mb-1">Medical</h4>
              <p className="text-sm text-gray-600">{request.medicalConditions}</p>
            </div>
          )}
          <div className="flex gap-2">
            {request.status === 'pending' && (
              <button
                onClick={e => { e.stopPropagation(); handleStatusUpdate(request.id, 'in-progress'); }}
                className="flex-1 py-2.5 rounded-full border-2 border-sky-100 bg-sky-600 text-white font-medium hover:bg-sky-700 text-sm"
              >
                Start Response
              </button>
            )}
            {request.status === 'in-progress' && (
              <button
                onClick={e => { e.stopPropagation(); handleStatusUpdate(request.id, 'resolved'); }}
                className="flex-1 py-2.5 rounded-full border-2 border-emerald-100 bg-emerald-600 text-white font-medium hover:bg-emerald-700 text-sm"
              >
                Mark Resolved
              </button>
            )}
            {request.status === 'resolved' && (
              <button
                onClick={e => { e.stopPropagation(); handleStatusUpdate(request.id, 'pending'); }}
                className="flex-1 py-2.5 rounded-full border-2 border-amber-100 bg-amber-600 text-white font-medium hover:bg-amber-700 text-sm"
              >
                Reopen
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const RequestsListContent = () => (
    <>
      <h2 className="text-xl font-bold text-neutral-800 mb-4">All Requests</h2>
      {filteredRequests.length === 0 ? (
        <div className="rounded-xl border border-gray-300 p-12 text-center bg-gray-50">
          <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            {searchQuery || statusFilter !== 'all' ? 'Try adjusting your filters' : 'No requests at the moment'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((request) => (
            <RequestCard key={request.id} request={request} />
          ))}
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-300 bg-white sticky top-0 z-1100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <BackToHomeButton className="mb-1 text-sky-600 hover:text-sky-800" />
              <h1 className="text-2xl sm:text-3xl font-bold text-neutral-800">Responder Dashboard</h1>
              <p className="text-gray-500 text-sm">{activeCount} active request{activeCount !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex gap-2">
              <Link
                to="/admin/login"
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-sky-100 bg-sky-600 text-white hover:bg-sky-700 text-sm font-medium"
              >
                <Shield className="w-4 h-4" />
                Admin
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Mobile: Map is full priority - fills viewport below header */}
        <div className="lg:hidden flex-1 flex flex-col min-h-0">
          <div className="flex-1 min-h-[calc(100vh-140px)] relative">
            <div className="absolute inset-0 rounded-none">
              <LiveMap
                requests={filteredRequests}
                selectedRequest={selectedRequest}
                onSelectRequest={(r) => setSelectedRequest(r ? requests.find(req => req.id === r.id) ?? null : null)}
              />
            </div>
          </div>
          {/* FAB to open drawer */}
          <button
            onClick={() => setShowDrawer(true)}
            className="fixed bottom-6 left-4 -tranneutral-x-1/2 z-[1050] flex items-center gap-2 px-6 py-3 rounded-lg border-2 border-sky-100 bg-sky-600 text-white font-medium shadow-lg hover:bg-sky-700"
          >
            <List className="w-5 h-5" />
            Requests ({filteredRequests.length})
          </button>
        </div>

        {/* Desktop: Original layout */}
        <div className="hidden lg:flex max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 gap-6">
          <aside className="w-72 shrink-0 self-start sticky top-36">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-300">
              {filtersContent}
            </div>
          </aside>
          <main className="flex-1 min-w-0">
            <div className="mb-6 rounded-xl overflow-hidden border border-gray-300 bg-gray-50">
              <div className="h-[400px] relative">
                <LiveMap
                  requests={filteredRequests}
                  selectedRequest={selectedRequest}
                  onSelectRequest={(r) => setSelectedRequest(r ? requests.find(req => req.id === r.id) ?? null : null)}
                />
              </div>
            </div>
            <div className="px-1">
              <RequestsListContent />
            </div>
          </main>
        </div>
      </div>

      <Drawer
        open={showDrawer}
        onClose={() => setShowDrawer(false)}
        title="Requests & Filters"
      >
        <div className="space-y-6">
          {filtersContent}
          <RequestsListContent />
        </div>
      </Drawer>
    </div>
  );
}

export default ResponderDashboard;
