import { useState, useEffect } from 'react';
import { useAuthContext } from '../../context/AuthContext';
import { getAllUsers, toggleUserStatus, deleteUser } from '../../api/admin.api';
import {
    Search,
    UserCircle,
    CheckCircle2,
    XCircle,
    UserMinus,
    Power,
    Shield,
    X,
} from 'lucide-react';

function Users() {
    const { token, user: loggedInAdmin } = useAuthContext();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('ALL'); // ALL, PATIENT, DOCTOR, ADMIN
    const [searchQuery, setSearchQuery] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await getAllUsers();
            setUsers(res.data);
            setLoading(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load users');
            setLoading(false);
        }
    };

    const handleToggleStatus = async (userId, currentStatus) => {
        try {
            // Optimistic update
            setUsers(users.map(u =>
                u._id === userId ? { ...u, isActive: !currentStatus } : u
            ));

            await toggleUserStatus(userId);
        } catch (err) {
            // Revert on failure
            setUsers(users.map(u =>
                u._id === userId ? { ...u, isActive: currentStatus } : u
            ));
            console.error('Failed to toggle status', err);
        }
    };

    const confirmDelete = (user) => {
        setUserToDelete(user);
        setShowDeleteModal(true);
    };

    const handleDelete = async () => {
        if (!userToDelete) return;

        try {
            await deleteUser(userToDelete._id);

            setUsers(users.filter(u => u._id !== userToDelete._id));
            setShowDeleteModal(false);
            setUserToDelete(null);
        } catch (err) {
            console.error('Failed to delete user', err);
            setShowDeleteModal(false);
            setUserToDelete(null);
        }
    };

    const filteredUsers = users.filter((u) => {
        const matchesTab = filter === 'ALL' || u.role === filter;
        const matchesSearch =
            u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTab && matchesSearch;
    });

    const getRoleBadge = (role) => {
        const styles = {
            PATIENT: 'bg-blue-50 text-blue-700 border-blue-200',
            DOCTOR: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            ADMIN: 'bg-purple-50 text-purple-700 border-purple-200',
        };
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[role]}`}>
                {role.charAt(0) + role.slice(1).toLowerCase()}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3">
                <XCircle className="w-5 h-5" />
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                <p className="text-sm text-gray-500 mt-1">Manage system users across all roles</p>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex bg-white rounded-lg p-1 border border-gray-200 flex-wrap">
                    {['ALL', 'PATIENT', 'DOCTOR', 'ADMIN'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setFilter(tab)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === tab
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            {tab === 'ALL' ? 'All Users' : tab.charAt(0) + tab.slice(1).toLowerCase() + 's'}
                        </button>
                    ))}
                </div>

                <div className="relative w-full sm:w-64 shrink-0">
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all text-sm"
                    />
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto hide-scrollbar">
                    <table className="min-w-[800px] divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Name
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Role
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Joined Date
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-sm text-gray-500">
                                        No users found matching your criteria
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((u) => {
                                    const isSelf = u._id === loggedInAdmin?._id;

                                    return (
                                        <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-medium shrink-0">
                                                        {u.role === 'ADMIN' ? (
                                                            <Shield className="w-4 h-4 text-indigo-600" />
                                                        ) : (
                                                            <UserCircle className="w-4 h-4" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                                            {u.name}
                                                            {isSelf && (
                                                                <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold">YOU</span>
                                                            )}
                                                        </div>
                                                        <div className="text-sm text-gray-500">{u.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getRoleBadge(u.role)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${u.isActive
                                                    ? 'bg-green-50 text-green-700 border-green-200'
                                                    : 'bg-red-50 text-red-700 border-red-200'
                                                    }`}>
                                                    {u.isActive ? (
                                                        <>
                                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                            Active
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                                            Inactive
                                                        </>
                                                    )}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(u.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                {!isSelf && (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleToggleStatus(u._id, u.isActive)}
                                                            className={`p-1.5 rounded-lg transition-colors ${u.isActive
                                                                ? 'text-yellow-600 hover:bg-yellow-50'
                                                                : 'text-green-600 hover:bg-green-50'
                                                                }`}
                                                            title={u.isActive ? "Disable User" : "Enable User"}
                                                        >
                                                            <Power className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => confirmDelete(u)}
                                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete User"
                                                        >
                                                            <UserMinus className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between mb-5">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                <UserMinus className="w-6 h-6 text-red-600" />
                            </div>
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 mb-2">Delete User Record</h3>
                        <p className="text-gray-600 mb-6 leading-relaxed">
                            Are you sure you want to delete <span className="font-semibold text-gray-900">{userToDelete?.name}</span>?
                            This action cannot be undone and will permanently remove their access to the system.
                        </p>

                        <div className="flex gap-3 justify-end mt-6">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 shadow-sm shadow-red-200 transition-all active:scale-[0.98]"
                            >
                                Delete User
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Users;
