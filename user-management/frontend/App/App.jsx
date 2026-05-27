const API_URL = 'https://fullstack-backend-fz4o.onrender.com/api/users';

function getErrorMessage(status, data) {
    if (data && data.error) {
        return `Lỗi ${status}: ${data.error}`;
    }

    if (status >= 500) {
        return `Lỗi ${status}: Máy chủ đang gặp sự cố`;
    }

    if (status >= 400) {
        return `Lỗi ${status}: Dữ liệu gửi lên không hợp lệ`;
    }

    return 'Có lỗi xảy ra';
}

function normalizeFormData(formData) {
    return {
        name: formData.name.trim(),
        age: Number(formData.age),
        email: formData.email.trim().toLowerCase(),
        address: formData.address.trim()
    };
}

function App() {
    const [users, setUsers] = React.useState([]);
    const [page, setPage] = React.useState(1);
    const [limit, setLimit] = React.useState(5);
    const [search, setSearch] = React.useState('');
    const [total, setTotal] = React.useState(0);
    const [totalPages, setTotalPages] = React.useState(0);
    const [showModal, setShowModal] = React.useState(false);
    const [editingUser, setEditingUser] = React.useState(null);
    const [error, setError] = React.useState('');

    const fetchUsers = () => {
        const params = new URLSearchParams({
            page,
            limit,
            search: search.trim()
        });
        const url = `${API_URL}?${params.toString()}`;

        fetch(url)
            .then(async (res) => {
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(getErrorMessage(res.status, data));
                }
                return data;
            })
            .then((data) => {
                setUsers(data.data || []);
                setTotal(data.total || 0);
                setTotalPages(data.totalPages || 0);
                setError('');
            })
            .catch((err) => {
                setError(err.message);
                console.error('Fetch error:', err);
            });
    };

    React.useEffect(() => {
        fetchUsers();
    }, [page, limit, search]);

    const deleteUser = (id) => {
        fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        })
            .then(async (res) => {
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(getErrorMessage(res.status, data));
                }
                return data;
            })
            .then((data) => {
                alert(data.message);
                fetchUsers();
            })
            .catch((err) => alert(err.message));
    };

    const handleSearchChange = (value) => {
        setPage(1);
        setSearch(value);
    };

    const handleLimitChange = (value) => {
        setLimit(value);
        setPage(1);
    };

    return (
        <div className="container">
            <h1>Quản lý Người dùng</h1>

            <SearchBar value={search} onChange={handleSearchChange} />

            <button
                className="add-button"
                onClick={() => {
                    setEditingUser(null);
                    setShowModal(true);
                }}
            >
                Thêm người dùng
            </button>

            {error && <div className="error-banner">{error}</div>}

            <UserTable
                users={users}
                page={page}
                limit={limit}
                onEdit={(user) => {
                    setEditingUser(user);
                    setShowModal(true);
                }}
                onDelete={(id) => deleteUser(id)}
            />

            <Pagination
                page={page}
                total={total}
                totalPages={totalPages}
                limit={limit}
                onPageChange={setPage}
                onLimitChange={handleLimitChange}
            />

            {showModal && (
                <UserModal
                    user={editingUser}
                    onClose={() => setShowModal(false)}
                    onSave={() => {
                        fetchUsers();
                        setShowModal(false);
                    }}
                />
            )}
        </div>
    );
}

function UserTable({ users, page, limit, onEdit, onDelete }) {
    const handleDelete = (id, name) => {
        if (window.confirm(`Bạn có chắc muốn xóa "${name}"?`)) {
            onDelete(id);
        }
    };

    return (
        <table>
            <thead>
                <tr>
                    <th>STT</th>
                    <th>Họ tên</th>
                    <th>Tuổi</th>
                    <th>Email</th>
                    <th>Địa chỉ</th>
                    <th>Thao tác</th>
                </tr>
            </thead>
            <tbody>
                {users.length === 0 ? (
                    <tr>
                        <td colSpan="6" style={{ textAlign: 'center' }}>
                            Không có dữ liệu
                        </td>
                    </tr>
                ) : (
                    users.map((user, index) => (
                        <tr key={user._id}>
                            <td>{index + 1}</td>
                            <td>{user.name}</td>
                            <td>{user.age}</td>
                            <td>{user.email}</td>
                            <td>{user.address || '-'}</td>
                            <td>
                                <button onClick={() => onEdit(user)}>Sửa</button>
                                <button onClick={() => handleDelete(user._id, user.name)}>Xóa</button>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    );
}

function Pagination({ page, total, totalPages, limit, onPageChange, onLimitChange }) {
    return (
        <div className="pagination">
            <div>
                Hiển thị:
                <select value={limit} onChange={(e) => onLimitChange(Number(e.target.value))}>
                    <option value="3">3</option>
                    <option value="5">5</option>
                    <option value="10">10</option>
                </select>
                dòng/trang
            </div>
            <div>
                <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={page === 1}
                >
                    Prev
                </button>
                <span style={{ margin: '0 15px' }}>
                    Trang {page}/{totalPages || 1} - Tổng {total}
                </span>
                <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={page >= totalPages}
                >
                    Next
                </button>
            </div>
        </div>
    );
}

function UserModal({ user, onClose, onSave }) {
    const [formData, setFormData] = React.useState(
        user || { name: '', age: '', email: '', address: '' }
    );
    const [errors, setErrors] = React.useState({});
    const [submitError, setSubmitError] = React.useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const validate = () => {
        const newErrors = {};
        const name = formData.name.trim();
        const age = Number(formData.age);
        const email = formData.email.trim();

        if (!name || name.length < 2) {
            newErrors.name = 'Tên phải có ít nhất 2 ký tự';
        }

        if (formData.age === '' || !Number.isInteger(age) || age < 0) {
            newErrors.age = 'Tuổi phải là số nguyên >= 0';
        }

        if (!email || !email.includes('@') || !email.includes('.')) {
            newErrors.email = 'Email không hợp lệ';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;

        const url = user ? `${API_URL}/${user._id}` : API_URL;
        const method = user ? 'PUT' : 'POST';

        fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(normalizeFormData(formData))
        })
            .then(async (res) => {
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(getErrorMessage(res.status, data));
                }
                return data;
            })
            .then((data) => {
                alert(data.message);
                onSave();
            })
            .catch((err) => {
                setSubmitError(err.message);
                alert(err.message);
            });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h3>{user ? 'Sửa người dùng' : 'Thêm người dùng'}</h3>

                {submitError && <div className="error-banner">{submitError}</div>}

                <label>Họ tên *</label>
                <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                />
                {errors.name && <p className="error">{errors.name}</p>}

                <label>Tuổi *</label>
                <input
                    name="age"
                    type="number"
                    value={formData.age}
                    onChange={handleChange}
                />
                {errors.age && <p className="error">{errors.age}</p>}

                <label>Email *</label>
                <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                />
                {errors.email && <p className="error">{errors.email}</p>}

                <label>Địa chỉ</label>
                <input
                    name="address"
                    value={formData.address || ''}
                    onChange={handleChange}
                />

                <div className="modal-actions">
                    <button onClick={handleSubmit}>Lưu</button>
                    <button onClick={onClose}>Hủy</button>
                </div>
            </div>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
