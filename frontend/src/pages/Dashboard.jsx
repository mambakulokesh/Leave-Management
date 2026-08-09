import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  applyLeave,
  approveLeaveRequest,
  createLeaveType,
  createUser,
  deleteLeaveType,
  getLeaveTypes,
  getManagerLeaveRequests,
  getMyLeaveBalances,
  getMyLeaveRequests,
  getUsers,
  rejectLeaveRequest,
  updateLeaveType,
} from "../services/api";

function Dashboard() {
  const { user, logout } = useAuth();

  const [leaveBalances, setLeaveBalances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [leaveForm, setLeaveForm] = useState({
    leave_type_id: "",
    from_date: "",
    to_date: "",
    leave_reason: "",
  });

  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState("");

  const [leaveTypes, setLeaveTypes] = useState([]);

  const [leaveRequests, setLeaveRequests] = useState([]);
  const [managerRequests, setManagerRequests] = useState([]);

  const [users, setUsers] = useState([]);

  const [leaveTypeForm, setLeaveTypeForm] = useState({
    leave_type: "",
    leave_reason: "",
    default_days: "",
  });

  const [userForm, setUserForm] = useState({
    username: "",
    email: "",
    full_name: "",
    password: "",
    role: "employee",
  });

  const [editingLeaveType, setEditingLeaveType] = useState(null);

  const fetchLeaveBalances = async () => {
    try {
      setLoading(true);

      const data = await getMyLeaveBalances();

      setLeaveBalances(data);
    } catch (error) {
      console.error("Failed to get leave balances:", error);

      setError("Failed to load leave balances");
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveChange = (e) => {
    const { name, value } = e.target;

    setLeaveForm({
      ...leaveForm,
      [name]: value,
    });
  };
  const handleUserFormChange = (e) => {
    const { name, value } = e.target;

    setUserForm({
      ...userForm,
      [name]: value,
    });
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();

    try {
      await createUser(userForm);

      alert("User created successfully");

      setUserForm({
        username: "",
        email: "",
        full_name: "",
        password: "",
        role: "employee",
      });

      fetchUsers();
    } catch (error) {
      console.error("Failed to create user:", error);

      alert(error.response?.data?.detail || "Failed to create user");
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();

    setSubmitMessage("");
    setSubmitError("");

    const fromDate = new Date(leaveForm.from_date);
    const toDate = new Date(leaveForm.to_date);

    if (toDate < fromDate) {
      setSubmitError("To date cannot be before from date");

      return;
    }

    const requestedDays = calculateDays();

    const selectedBalance = getSelectedLeaveBalance();

    if (!selectedBalance) {
      setSubmitError("Leave balance not found");

      return;
    }

    if (requestedDays > selectedBalance.remaining_days) {
      setSubmitError(
        `You only have ${selectedBalance.remaining_days} days remaining`,
      );

      return;
    }

    try {
      const data = await applyLeave(leaveForm);

      setSubmitMessage(data.message);

      setLeaveForm({
        leave_type_id: "",
        from_date: "",
        to_date: "",
        leave_reason: "",
      });
    } catch (error) {
      console.error("Failed to apply leave:", error);

      setSubmitError(error.response?.data?.detail || "Failed to apply leave");
    }
  };
  const fetchLeaveTypes = async () => {
    try {
      const data = await getLeaveTypes();

      setLeaveTypes(data);
    } catch (error) {
      console.error("Failed to get leave types:", error);
    }
  };

  const fetchManagerLeaveRequests = async () => {
    try {
      const data = await getManagerLeaveRequests();

      setManagerRequests(data);
    } catch (error) {
      console.error("Failed to get manager leave requests:", error);
    }
  };

  const handleApproveLeave = async (requestId) => {
    try {
      await approveLeaveRequest(requestId);

      // Refresh pending requests
      fetchManagerLeaveRequests();
    } catch (error) {
      console.error("Failed to approve leave:", error);
    }
  };

  const handleRejectLeave = async (requestId) => {
    try {
      await rejectLeaveRequest(requestId);

      // Refresh pending requests
      fetchManagerLeaveRequests();
    } catch (error) {
      console.error("Failed to reject leave:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await getUsers();

      setUsers(data);
    } catch (error) {
      console.error("Failed to get users:", error);
    }
  };

  const handleCreateLeaveType = async (e) => {
    e.preventDefault();

    try {
      await createLeaveType({
        leave_type: leaveTypeForm.leave_type,
        leave_reason: leaveTypeForm.leave_reason,
        default_days: Number(leaveTypeForm.default_days),
      });

      setLeaveTypeForm({
        leave_type: "",
        leave_reason: "",
        default_days: "",
      });

      // Refresh leave types
      const data = await getLeaveTypes();

      setLeaveTypes(data);
    } catch (error) {
      console.error("Failed to create leave type:", error);
    }
  };
  
  const handleEditLeaveType = (leaveType) => {
    setEditingLeaveType({
      _id: leaveType._id,
      leave_type: leaveType.leave_type,
      leave_reason: leaveType.leave_reason,
      default_days: leaveType.default_days,
    });
  };

  const handleUpdateLeaveType = async (e) => {
    e.preventDefault();

    try {
      await updateLeaveType(editingLeaveType._id, {
        leave_type: editingLeaveType.leave_type,
        leave_reason: editingLeaveType.leave_reason,
        default_days: Number(editingLeaveType.default_days),
      });

      alert("Leave type updated successfully");

      setEditingLeaveType(null);

      fetchLeaveTypes();
    } catch (error) {
      console.error("Failed to update leave type:", error);

      alert(error.response?.data?.detail || "Failed to update leave type");
    }
  };

  const handleDeleteLeaveType = async (leaveTypeId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this leave type?",
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteLeaveType(leaveTypeId);

      alert("Leave type deleted successfully");

      fetchLeaveTypes();
    } catch (error) {
      console.error("Failed to delete leave type:", error);

      alert(error.response?.data?.detail || "Failed to delete leave type");
    }
  };

  const calculateDays = () => {
    if (!leaveForm.from_date || !leaveForm.to_date) {
      return 0;
    }

    const fromDate = new Date(leaveForm.from_date);
    const toDate = new Date(leaveForm.to_date);

    const difference = toDate.getTime() - fromDate.getTime();

    const days = difference / (1000 * 60 * 60 * 24) + 1;

    return days;
  };

  const handleLeaveTypeChange = (e) => {
    const { name, value } = e.target;

    setLeaveTypeForm({
      ...leaveTypeForm,
      [name]: value,
    });
  };

  const today = new Date().toISOString().split("T")[0];

  const getSelectedLeaveBalance = () => {
    return leaveBalances.find(
      (balance) => balance.leave_type_id === leaveForm.leave_type_id,
    );
  };

  const fetchLeaveRequests = async () => {
    try {
      const data = await getMyLeaveRequests();

      setLeaveRequests(data);
    } catch (error) {
      console.error("Failed to get leave requests:", error);
    }
  };

  const getLeaveTypeName = (leaveTypeId) => {
    const leaveType = leaveTypes.find((type) => type._id === leaveTypeId);

    return leaveType ? leaveType.leave_type : "Unknown";
  };

  useEffect(() => {
    if (user?.role === "employee") {
      fetchLeaveBalances();
      fetchLeaveTypes();
      fetchLeaveRequests();
    }

    if (user?.role === "manager") {
      fetchManagerLeaveRequests();
    }

    if (user?.role === "admin") {
      fetchUsers();
      fetchLeaveTypes();
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Leave Management System</h1>
              <p className="text-sm text-gray-500 mt-1">Welcome, {user.full_name}</p>
            </div>
            <button 
              onClick={logout}
              className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* User Info Card */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Username</p>
              <p className="text-lg font-semibold text-gray-900">{user.username}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="text-lg font-semibold text-gray-900">{user.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Role</p>
              <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${
                user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                'bg-green-100 text-green-800'
              }`}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </span>
            </div>
          </div>
        </div>

      {/* =========================
          EMPLOYEE DASHBOARD
      ========================= */}

      {user.role === "employee" && (
        <div className="space-y-8">
          {/* Leave Balances */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">My Leave Balance</h2>

            {loading && <p className="text-gray-500">Loading leave balances...</p>}

            {error && <p className="text-red-500">{error}</p>}

            {!loading && !error && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {leaveBalances.map((leave) => (
                  <div key={leave.leave_type} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-5 border border-blue-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{leave.leave_type}</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Total Days</span>
                        <span className="text-sm font-medium text-gray-900">{leave.total_days}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Used Days</span>
                        <span className="text-sm font-medium text-gray-900">{leave.used_days}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Remaining Days</span>
                        <span className="text-sm font-medium text-green-600">{leave.remaining_days}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Apply Leave Form */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Apply Leave</h2>

            <form onSubmit={handleApplyLeave} className="space-y-5 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Leave Type</label>
                <select
                  name="leave_type_id"
                  value={leaveForm.leave_type_id}
                  onChange={handleLeaveChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                >
                  <option value="">Select Leave Type</option>
                  {leaveTypes.map((leaveType) => (
                    <option key={leaveType._id} value={leaveType._id}>
                      {leaveType.leave_type}
                    </option>
                  ))}
                </select>
              </div>

              {leaveForm.leave_type_id && (
                <p className="text-sm text-green-600 font-medium">
                  Available Days: {getSelectedLeaveBalance()?.remaining_days ?? 0}
                </p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                  <input
                    type="date"
                    name="from_date"
                    value={leaveForm.from_date}
                    onChange={handleLeaveChange}
                    min={today}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                  <input
                    type="date"
                    name="to_date"
                    value={leaveForm.to_date}
                    onChange={handleLeaveChange}
                    min={today}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  />
                </div>
              </div>

              <p className="text-sm font-medium text-gray-700">
                Number of Days: <span className="text-blue-600">{calculateDays()}</span>
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                <textarea
                  name="leave_reason"
                  value={leaveForm.leave_reason}
                  onChange={handleLeaveChange}
                  placeholder="Enter reason"
                  required
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none"
                />
              </div>

              <button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Apply Leave
              </button>
            </form>

            {submitMessage && <p className="mt-4 text-green-600 font-medium">{submitMessage}</p>}
            {submitError && <p className="mt-4 text-red-600 font-medium">{submitError}</p>}
          </div>

          {/* My Leave Requests */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">My Leave Requests</h2>

            {leaveRequests.length === 0 ? (
              <p className="text-gray-500">No leave requests found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {leaveRequests.map((request) => (
                  <div key={request._id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{getLeaveTypeName(request.leave_type_id)}</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">From</span>
                        <span className="text-sm font-medium text-gray-900">{request.from_date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">To</span>
                        <span className="text-sm font-medium text-gray-900">{request.to_date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Days</span>
                        <span className="text-sm font-medium text-gray-900">{request.requested_days}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Reason</span>
                        <span className="text-sm font-medium text-gray-900 max-w-[60%] truncate">{request.leave_reason}</span>
                      </div>
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-sm text-gray-500">Status</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          request.status === 'approved' ? 'bg-green-100 text-green-800' :
                          request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================
          MANAGER DASHBOARD
      ========================= */}

      {user?.role === "manager" && (
        <div className="space-y-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Manager Dashboard</h2>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Pending Leave Requests</h3>

            {managerRequests.length === 0 ? (
              <p className="text-gray-500">No pending leave requests.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {managerRequests.map((request) => (
                  <div key={request._id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{request.username}</h3>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">From</span>
                        <span className="text-sm font-medium text-gray-900">{request.from_date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">To</span>
                        <span className="text-sm font-medium text-gray-900">{request.to_date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Days</span>
                        <span className="text-sm font-medium text-gray-900">{request.requested_days}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Reason</span>
                        <span className="text-sm font-medium text-gray-900 max-w-[60%] truncate">{request.leave_reason}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Status</span>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleApproveLeave(request._id)}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleRejectLeave(request._id)}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================
          ADMIN DASHBOARD
      ========================= */}

      {user?.role === "admin" && (
        <div className="space-y-8">
          {/* Users Section */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Admin Dashboard</h2>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Users</h3>

            {users.length === 0 ? (
              <p className="text-gray-500">No users found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.full_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.username}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                            user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Leave Types Section */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Leave Types</h3>
            
            {/* Create Leave Type Form */}
            <form onSubmit={handleCreateLeaveType} className="mb-8 p-5 bg-gray-50 rounded-lg">
              <h4 className="text-md font-medium text-gray-900 mb-4">Create New Leave Type</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Leave Type</label>
                  <input
                    type="text"
                    name="leave_type"
                    value={leaveTypeForm.leave_type}
                    onChange={handleLeaveTypeChange}
                    placeholder="Casual Leave"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Leave Reason</label>
                  <input
                    type="text"
                    name="leave_reason"
                    value={leaveTypeForm.leave_reason}
                    onChange={handleLeaveTypeChange}
                    placeholder="Leave for personal reasons"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div className="flex items-end">
                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Default Days</label>
                    <input
                      type="number"
                      name="default_days"
                      value={leaveTypeForm.default_days}
                      onChange={handleLeaveTypeChange}
                      placeholder="12"
                      min="1"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="ml-3 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
                  >
                    Create
                  </button>
                </div>
              </div>
            </form>

            {/* Existing Leave Types */}
            <h4 className="text-md font-medium text-gray-900 mb-4">Existing Leave Types</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {leaveTypes.map((leaveType) => (
                <div key={leaveType._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-900">{leaveType.leave_type}</p>
                      <p className="text-sm text-gray-500 mt-1">{leaveType.leave_reason}</p>
                      <p className="text-sm font-medium text-gray-700 mt-2">Default Days: {leaveType.default_days}</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEditLeaveType(leaveType)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium py-1 px-3 rounded transition-colors duration-200"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteLeaveType(leaveType._id)}
                        className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-1 px-3 rounded transition-colors duration-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Edit Leave Type Form */}
            {editingLeaveType && (
              <div className="mt-6 p-5 bg-blue-50 rounded-lg border border-blue-100">
                <h4 className="text-md font-medium text-gray-900 mb-4">Edit Leave Type</h4>
                <form onSubmit={handleUpdateLeaveType} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <input
                      type="text"
                      value={editingLeaveType.leave_type}
                      onChange={(e) =>
                        setEditingLeaveType({
                          ...editingLeaveType,
                          leave_type: e.target.value,
                        })
                      }
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="Leave Type"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={editingLeaveType.leave_reason}
                      onChange={(e) =>
                        setEditingLeaveType({
                          ...editingLeaveType,
                          leave_reason: e.target.value,
                        })
                      }
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="Leave Reason"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      value={editingLeaveType.default_days}
                      onChange={(e) =>
                        setEditingLeaveType({
                          ...editingLeaveType,
                          default_days: e.target.value,
                        })
                      }
                      min="1"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="Default Days"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      type="submit" 
                      className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
                    >
                      Update
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setEditingLeaveType(null)}
                      className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Create User Section */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Create User</h3>
            <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
              <div>
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={userForm.username}
                  onChange={handleUserFormChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={userForm.email}
                  onChange={handleUserFormChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <input
                  type="text"
                  name="full_name"
                  placeholder="Full Name"
                  value={userForm.full_name}
                  onChange={handleUserFormChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={userForm.password}
                  onChange={handleUserFormChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <select
                  name="role"
                  value={userForm.role}
                  onChange={handleUserFormChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
              <div className="flex items-end">
                <button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

export default Dashboard;