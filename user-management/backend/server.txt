const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

mongoose
    .connect('mongodb+srv://20235134:20235134@it4409-20235134.fvz6v93.mongodb.net/IT4409-20235134')
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB'));

//TODO: Tạo Schema
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    age: {
        type: Number,
        required: true,
        min: 0,
        validate: {
            validator: Number.isInteger,
            message: 'Tuổi phải là số nguyên'
        }
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ']
    },
    address: {
        type: String,
        required: true,
        trim: true
    }
});
const User = mongoose.model('User', userSchema);

const MAX_LIMIT = 100;

const normalizeString = (value) => {
    if (typeof value !== 'string') {
        return value;
    }

    return value.trim();
};

const normalizeUserData = (data, onlyProvided = false) => {
    const userData = {};

    if (!onlyProvided || data.name !== undefined) {
        const name = normalizeString(data.name);
        if (name !== undefined && name !== null) {
            userData.name = name;
        }
    }

    if (!onlyProvided || data.age !== undefined) {
        const age = Number(data.age);
        if (!Number.isInteger(age)) {
            throw new Error('Tuổi phải là số nguyên');
        }
        userData.age = age;
    }

    if (!onlyProvided || data.email !== undefined) {
        const email = normalizeString(data.email);
        if (email !== undefined && email !== null) {
            userData.email = email.toLowerCase();
        }
    }

    if (!onlyProvided || data.address !== undefined) {
        const address = normalizeString(data.address);
        if (address !== undefined && address !== null) {
            userData.address = address;
        }
    }

    return userData;
};

//TODO: Implement API endpoints
app.get('/api/users', async (req, res) => {
    try {
        const pageNumber = parseInt(req.query.page);
        const limitNumber = parseInt(req.query.limit);
        const page = Number.isInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1;
        const limit = Number.isInteger(limitNumber) && limitNumber > 0 ? Math.min(limitNumber, MAX_LIMIT) : 5;
        const search = normalizeString(req.query.search || '');

        const filter = search
            ? {
                  $or: [
                        { name: { $regex: search, $options: 'i' } },
                        { email: { $regex: search, $options: 'i' } },
                        { address: { $regex: search, $options: 'i' } },
                  ],
              }
            : {};

        const skip = (page - 1) * limit;

        const [users, total] = await Promise.all([
            User.find(filter).skip(skip).limit(limit),
            User.countDocuments(filter)
        ]);
        const totalPages = Math.ceil(total / limit);

        res.json({
            page,
            limit,
            total,
            totalPages,
            data: users
        });
    } catch (err) {
        res.status(500).json({ error: err.message });

    }
});
app.post('/api/users', async (req, res) => {
    try {
        const userData = normalizeUserData(req.body);

        const existedUser = await User.findOne({ email: userData.email });
        if (existedUser) {
            return res.status(400).json({ error: "Email đã tồn tại" });
        }

        const newUser = await User.create(userData);

        res.status(201).json({
            message: "Tạo người dùng thành công",
            data: newUser
        })
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ error: "Email đã tồn tại" });
        }

        res.status(400).json({ error: err.message });
    }
});
app.put('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "ID không hợp lệ" });
        }

        const userData = normalizeUserData(req.body, true);
        if (Object.keys(userData).length === 0) {
            return res.status(400).json({ error: "Không có dữ liệu để cập nhật" });
        }

        if (userData.email) {
            const existedUser = await User.findOne({ email: userData.email, _id: { $ne: id } });
            if (existedUser) {
                return res.status(400).json({ error: "Email đã tồn tại" });
            }
        }

        const updatedUser = await User.findByIdAndUpdate(id, { $set: userData }, { new: true, runValidators: true });

        if(!updatedUser) {
            return res.status(404).json({ error: "Không tìm thấy người dùng" });
        }
        res.json({
            message: "Cập nhật người dùng thành công",
            data: updatedUser
        });
    }catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ error: "Email đã tồn tại" });
        }

        res.status(400).json({ error: err.message });
    }
});
app.delete('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "ID không hợp lệ" });
        }

        const deletedUser = await User.findByIdAndDelete(id);

        if(!deletedUser) {
            return res.status(404).json({ error: "Không tìm thấy người dùng" });
        }

        res.json({
            message: "Xóa người dùng thành công",
            data: deletedUser
        });
    }catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Start server
app.listen(3001, () => {
    console.log('Server running on port 3001');
});

