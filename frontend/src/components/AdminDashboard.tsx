import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Trash2, AlertTriangle, Info as InfoIcon, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Navbar } from './Navbar';
import { API_BASE } from '../config';
import { useToast } from './Toast';
import { useConfirm } from './ConfirmModal';

interface DisasterUpdate {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: string;
  author: string;
}

interface HelpRequest {
  id: string;
  name: string;
  phone: string;
  location: string;
  city?: string;
  province?: string;
  postalCode?: string;
  situation: string;
  priorityScore: number;
  timestamp: string;
  status: string;
  responders?: string[];
}

const STORAGE_KEY_UPDATES = 'aegis_disaster_updates';
const STORAGE_KEY_REQUESTS = 'aegis_help_requests';

export function AdminDashboard() {
  const [updates, setUpdates] = useState<DisasterUpdate[]>([]);
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [newUpdate, setNewUpdate] = useState({
    title: '',
    message: '',
    severity: 'info' as 'info' | 'warning' | 'critical',
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const adminToken = localStorage.getItem('adminToken');
  const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
  const { success, error } = useToast();
  const { confirm } = useConfirm();

  useEffect(() => {
    console.log('AdminDashboard mounted, checking auth...');
    console.log('Admin token:', adminToken);
    console.log('Admin user:', adminUser);
    
    if (!adminToken) {
      console.log('No admin token found, redirecting to login');
      navigate('/admin/login');
      return;
    }
    
    console.log('Admin authenticated, fetching data...');
    fetchUpdates();
    fetchRequests();
  }, [adminToken, navigate]);

  const mapMongoToDisasterUpdate = (doc: Record<string, unknown>): DisasterUpdate => ({
    id: String(doc._id ?? doc.id ?? ''),
    title: String(doc.title ?? ''),
    message: String(doc.message ?? ''),
    severity: (doc.severity as 'info' | 'warning' | 'critical') || 'info',
    timestamp: String(doc.timestamp ?? ''),
    author: String(doc.author ?? 'System Admin'),
  });

  const fetchUpdates = async () => {
    try {
      const response = await fetch(`${API_BASE}/updates`, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to fetch');
      const data = (await response.json()) as Record<string, unknown>[];
      const mapped = (data || []).map(mapMongoToDisasterUpdate);
      setUpdates(mapped);
      localStorage.setItem(STORAGE_KEY_UPDATES, JSON.stringify(mapped));
    } catch (error) {
      console.error('Error fetching updates:', error);
      const stored = localStorage.getItem(STORAGE_KEY_UPDATES);
      if (stored) {
        try {
          setUpdates(JSON.parse(stored));
        } catch (e) {
          setUpdates([]);
        }
      }
    }
  };

  const mapMongoToHelpRequest = (req: Record<string, unknown>): HelpRequest => {
    const loc = req.location as { type?: string; coordinates?: number[] } | undefined;
    const hasCoords = loc?.type === 'Point' && Array.isArray(loc?.coordinates);
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
      situation: String(req.situation ?? req.type ?? req.safety_status ?? ''),
      priorityScore: Number(req.priorityScore ?? req.score ?? req.final_score ?? 0),
      timestamp: String(req.timestamp ?? ''),
      status: String(req.status ?? 'pending'),
    };
  };

  const fetchRequests = async () => {
    try {
      const response = await fetch(`${API_BASE}/incidents?include_resolved=true`, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to fetch');
      const data = (await response.json()) as Record<string, unknown>[];
      const mapped = (data || []).map(mapMongoToHelpRequest);
      setRequests(mapped);
      localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(mapped));
    } catch (error) {
      console.error('Error fetching requests:', error);
      const stored = localStorage.getItem(STORAGE_KEY_REQUESTS);
      if (stored) {
        try {
          setRequests(JSON.parse(stored));
        } catch (e) {
          setRequests([]);
        }
      }
    }
  };

  const postUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!newUpdate.title.trim() || !newUpdate.message.trim()) {
      error('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    const author = adminUser.user_metadata?.name || adminUser.email || 'System Admin';

    try {
      const response = await fetch(`${API_BASE}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newUpdate.title,
          message: newUpdate.message,
          severity: newUpdate.severity,
          author,
        }),
      });

      if (!response.ok) throw new Error('Failed to post');
      const data = await response.json();
      if (data.success) {
        success('Update posted successfully!');
        setNewUpdate({ title: '', message: '', severity: 'info' });
        fetchUpdates();
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Error posting update:', err);
      error('Failed to post update. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteUpdate = async (updateId: string) => {
    const ok = await confirm('Delete this update?', { confirmLabel: 'Delete', variant: 'danger' });
    if (!ok) return;

    try {
      const response = await fetch(`${API_BASE}/updates/${updateId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to delete');
      const data = await response.json();
      if (data.success) {
        const updatedUpdates = updates.filter(u => u.id !== updateId);
        setUpdates(updatedUpdates);
        localStorage.setItem(STORAGE_KEY_UPDATES, JSON.stringify(updatedUpdates));
        success('Update deleted');
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error deleting update:', error);
      const updatedUpdates = updates.filter(u => u.id !== updateId);
      setUpdates(updatedUpdates);
      localStorage.setItem(STORAGE_KEY_UPDATES, JSON.stringify(updatedUpdates));
      success('Update deleted (saved locally)!');
    }
  };

  const deleteRequest = async (requestId: string) => {
    const ok = await confirm(
      'Are you sure you want to delete this help request? This cannot be undone.',
      { confirmLabel: 'Delete', variant: 'danger' },
    );
    if (!ok) return;

    try {
      const response = await fetch(`${API_BASE}/incidents/${requestId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to delete');
      const data = await response.json();
      if (data.success) {
        const updatedRequests = requests.filter(r => r.id !== requestId);
        setRequests(updatedRequests);
        localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(updatedRequests));
        success('Request deleted');
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error deleting request:', error);
      const updatedRequests = requests.filter(r => r.id !== requestId);
      setRequests(updatedRequests);
      localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(updatedRequests));
      success('Request deleted (saved locally)!');
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 border-red-400 text-red-800';
      case 'warning': return 'bg-yellow-100 border-yellow-400 text-yellow-800';
      default: return 'bg-blue-100 border-blue-400 text-blue-800';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertCircle className="w-5 h-5" />;
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      default: return <InfoIcon className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        rightContent={
          <button
            onClick={logout}
            className="border-2 border-sky-100 bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors text-sm font-medium"
          >
            Logout
          </button>
        }
      />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-600">Welcome, {adminUser.user_metadata?.name || adminUser.email}</p>
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Post Disaster Update</h2>
            <form onSubmit={postUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={newUpdate.title}
                  onChange={(e) => setNewUpdate(prev => ({ ...prev, title: e.target.value }))}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Road Closure on Main St"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={newUpdate.message}
                  onChange={(e) => setNewUpdate(prev => ({ ...prev, message: e.target.value }))}
                  required
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Provide details about the situation..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                <select
                  value={newUpdate.severity}
                  onChange={(e) => setNewUpdate(prev => ({ ...prev, severity: e.target.value as any }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full border-2 border-blue-100 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 active:scale-95 transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                {isLoading ? 'Posting...' : 'Post Update'}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Updates</h2>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {updates.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No updates posted yet</p>
              ) : (
                updates.map(update => (
                  <div
                    key={update.id}
                    className={`border-2 rounded-lg p-4 ${getSeverityColor(update.severity)}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1">
                        {getSeverityIcon(update.severity)}
                        <div className="flex-1">
                          <h3 className="font-bold">{update.title}</h3>
                          <p className="text-sm mt-1">{update.message}</p>
                          <div className="text-xs mt-2 opacity-75">
                            By {update.author} • {new Date(update.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteUpdate(update.id)}
                        className="border-2 border-red-100 text-red-600 hover:text-red-800 rounded-lg p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 mt-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Manage Help Requests</h2>
          <div className="space-y-3">
            {requests.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No requests to manage</p>
            ) : (
              requests.map(request => (
                <div key={request.id} className="border border-gray-300 rounded-lg p-4 hover:border-blue-300 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg">{request.name}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          request.status === 'resolved' ? 'bg-green-100 text-green-800' :
                          request.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {request.status}
                        </span>
                        {request.responders && request.responders.length > 0 && (
                          <span className="px-2 py-1 rounded text-xs font-bold bg-purple-100 text-purple-800">
                            {request.responders.length} responder{request.responders.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Address:</strong> {request.location}
                        {request.city && `, ${request.city}`}
                        {request.province && `, ${request.province}`}
                      </p>
                      <p className="text-sm text-gray-600 mb-1"><strong>Phone:</strong> {request.phone}</p>
                      <p className="text-sm text-gray-600 mb-1"><strong>Situation:</strong> {request.situation}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(request.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteRequest(request.id)}
                      className="border-2 border-red-100 bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
