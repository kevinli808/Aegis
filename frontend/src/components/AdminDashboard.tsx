import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Trash2, AlertTriangle, Info as InfoIcon, AlertCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

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

  const fetchUpdates = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-636dcea6/get-updates`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      const data = await response.json();
      if (data.success && data.updates) {
        setUpdates(data.updates);
        localStorage.setItem(STORAGE_KEY_UPDATES, JSON.stringify(data.updates));
      }
    } catch (error) {
      console.error('Error fetching updates from server:', error);
      // Fall back to local storage
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

  const fetchRequests = async () => {
    try {
      console.log('Fetching help requests...');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-636dcea6/get-requests`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      console.log('Requests response status:', response.status);
      const data = await response.json();
      console.log('Requests data:', data);
      
      if (data.requests) {
        // Filter out test/example requests
        const testNames = ['Kevin Li'];
        const testSituations = ['i might actually die from a snake', 'helpppp', 'hj'];
        const filteredRequests = data.requests.filter((req: HelpRequest) => {
          return !testNames.includes(req.name) && !testSituations.includes(req.situation);
        });
        setRequests(filteredRequests);
        localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(filteredRequests));
        console.log('Set requests:', filteredRequests.length);
      } else if (data.error) {
        console.error('Error from server:', data.error);
        // Fall back to local storage
        const stored = localStorage.getItem(STORAGE_KEY_REQUESTS);
        if (stored) {
          try {
            setRequests(JSON.parse(stored));
          } catch (e) {
            setRequests([]);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      // Fall back to local storage
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

    // Validate form data
    if (!newUpdate.title.trim() || !newUpdate.message.trim()) {
      alert('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    const update: DisasterUpdate = {
      id: Date.now().toString(),
      title: newUpdate.title,
      message: newUpdate.message,
      severity: newUpdate.severity,
      timestamp: new Date().toISOString(),
      author: adminUser.user_metadata?.name || adminUser.email || 'System Admin',
    };

    try {
      console.log('Posting update with token:', adminToken);
      console.log('Update data:', newUpdate);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (adminToken === 'hardcoded-admin-token') {
        headers['X-Admin-Token'] = adminToken;
      } else {
        headers['Authorization'] = `Bearer ${adminToken}`;
      }
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-636dcea6/admin/post-update`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(newUpdate),
        }
      );

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        alert('Update posted successfully!');
        const updatedUpdates = [update, ...updates];
        setUpdates(updatedUpdates);
        localStorage.setItem(STORAGE_KEY_UPDATES, JSON.stringify(updatedUpdates));
        setNewUpdate({ title: '', message: '', severity: 'info' });
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error posting update:', error);
      // Use local storage as fallback
      console.log('Using local storage fallback for update');
      const updatedUpdates = [update, ...updates];
      setUpdates(updatedUpdates);
      localStorage.setItem(STORAGE_KEY_UPDATES, JSON.stringify(updatedUpdates));
      alert('Update posted successfully (saved locally)!');
      setNewUpdate({ title: '', message: '', severity: 'info' });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteUpdate = async (updateId: string) => {
    if (!confirm('Delete this update?')) return;

    try {
      console.log('Deleting update:', updateId, 'with token:', adminToken);
      
      const headers: Record<string, string> = {};
      
      if (adminToken === 'hardcoded-admin-token') {
        headers['X-Admin-Token'] = adminToken;
      } else {
        headers['Authorization'] = `Bearer ${adminToken}`;
      }
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-636dcea6/admin/delete-update/${updateId}`,
        {
          method: 'DELETE',
          headers,
        }
      );

      console.log('Delete update response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Delete update response data:', data);

      if (data.success) {
        alert('Update deleted');
        const updatedUpdates = updates.filter(u => u.id !== updateId);
        setUpdates(updatedUpdates);
        localStorage.setItem(STORAGE_KEY_UPDATES, JSON.stringify(updatedUpdates));
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error deleting update:', error);
      // Use local storage as fallback
      console.log('Using local storage fallback for delete');
      const updatedUpdates = updates.filter(u => u.id !== updateId);
      setUpdates(updatedUpdates);
      localStorage.setItem(STORAGE_KEY_UPDATES, JSON.stringify(updatedUpdates));
      alert('Update deleted (saved locally)!');
    }
  };

  const deleteRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to delete this help request? This cannot be undone.')) return;

    try {
      console.log('Deleting request:', requestId, 'with token:', adminToken);
      
      const headers: Record<string, string> = {};
      
      if (adminToken === 'hardcoded-admin-token') {
        headers['X-Admin-Token'] = adminToken;
      } else {
        headers['Authorization'] = `Bearer ${adminToken}`;
      }
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-636dcea6/admin/delete-request/${requestId}`,
        {
          method: 'DELETE',
          headers,
        }
      );

      console.log('Delete response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Delete response data:', data);

      if (data.success) {
        alert('Request deleted');
        const updatedRequests = requests.filter(r => r.id !== requestId);
        setRequests(updatedRequests);
        localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(updatedRequests));
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error deleting request:', error);
      // Use local storage as fallback
      console.log('Using local storage fallback for delete');
      const updatedRequests = requests.filter(r => r.id !== requestId);
      setRequests(updatedRequests);
      localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(updatedRequests));
      alert('Request deleted (saved locally)!');
    }
  };

  const deleteAllRequests = async () => {
    if (!confirm('⚠️ WARNING: This will delete ALL help requests permanently. This action cannot be undone. Are you absolutely sure?')) return;
    
    if (!confirm('This is your final confirmation. Delete ALL ' + requests.length + ' requests?')) return;

    setIsLoading(true);
    
    try {
      console.log('Deleting all requests, count:', requests.length);
      
      const headers: Record<string, string> = {};
      
      if (adminToken === 'hardcoded-admin-token') {
        headers['X-Admin-Token'] = adminToken;
      } else {
        headers['Authorization'] = `Bearer ${adminToken}`;
      }
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-636dcea6/admin/delete-all-requests`,
        {
          method: 'DELETE',
          headers,
        }
      );

      console.log('Delete all response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Delete all response data:', data);

      if (data.success) {
        alert(`Successfully deleted ${data.deletedCount || requests.length} requests`);
        setRequests([]);
        localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify([]));
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error deleting all requests:', error);
      // Use local storage as fallback
      console.log('Using local storage fallback for delete all');
      setRequests([]);
      localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify([]));
      alert('All requests deleted (saved locally)!');
    } finally {
      setIsLoading(false);
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
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link to="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-3 text-sm">
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded text-white flex items-center justify-center font-bold text-lg">A</div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome, {adminUser.user_metadata?.name || adminUser.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6">
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
                className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 active:scale-95 transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                {isLoading ? 'Posting...' : 'Post Update'}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
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
                        className="text-red-600 hover:text-red-800"
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

        <div className="bg-white rounded-xl shadow-md p-6 mt-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Manage Help Requests</h2>
          <div className="space-y-3">
            {requests.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No requests to manage</p>
            ) : (
              requests.map(request => (
                <div key={request.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
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
                      className="bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
            <button
              onClick={deleteAllRequests}
              className="w-full bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 active:scale-95 transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              {isLoading ? 'Deleting...' : 'Delete All Requests'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
