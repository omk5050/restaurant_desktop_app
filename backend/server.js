const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, ".env") });

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const dns = require("dns");
const authenticateToken = require("./authenticationmiddleware");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ storage: multer.memoryStorage() });

// Use Google Public DNS to reliably resolve mongodb+srv SRV records
try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
  console.log("DNS servers set to Google Public DNS");
} catch (dnsErr) {
  console.warn("Could not set custom DNS servers:", dnsErr.message);
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.url}`);
  res.on("finish", () =>
    console.log(`[API] ${req.method} ${req.url} -> ${res.statusCode}`)
  );
  next();
});

// Serve built frontend (Vite dist) — only useful when deployed
app.use(express.static(path.join(__dirname, "../appss/web/dist")));

// ============================================================
// 1. MONGODB CONNECTION
// ============================================================
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/restaurantappDB";

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB successfully.");
    seedDatabase();
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// ============================================================
// 2. SCHEMAS & MODELS
// ============================================================

const SettingsSchema = new mongoose.Schema({
  adminId:              { type: String, required: true, unique: true },
  restaurantName:       { type: String, default: "Hotel Grand" },
  tagline:              { type: String, default: "" },
  address:              { type: String, default: "123 MG Road, Your City" },
  phone:                { type: String, default: "" },
  email:                { type: String, default: "" },
  website:              { type: String, default: "" },
  gstNumber:            { type: String, default: "07AABC1234D1Z5" },
  gstPercent:           { type: Number, default: 5 },
  serviceChargePercent: { type: Number, default: 0 },
  currency:             { type: String, default: "₹" },
  receiptFooter:        { type: String, default: "Thank you for dining with us!" },
  theme:                { type: String, default: "orange" },
  timezone:             { type: String, default: "Asia/Kolkata" },
  tableCount:           { type: Number, default: 14 },
  restaurantTableCount: { type: Number, default: 6 },
  familyTableCount:     { type: Number, default: 4 },
  takeawayTableCount:   { type: Number, default: 4 },
  logoUrl:              { type: String, default: "" },
});
const Settings = mongoose.model("Settings", SettingsSchema);

const TableSchema = new mongoose.Schema({
  adminId:        { type: String, required: true },
  id:             { type: Number, required: true },
  name:           { type: String, required: true },
  seats:          { type: Number, default: 4 },
  section:        { type: String, default: "Restaurant" },
  status:         { type: String, enum: ["empty", "active", "bill", "paid"], default: "empty" },
  currentOrderId: { type: String, default: null },
  paidAt:         { type: Date, default: null },
});
TableSchema.index({ adminId: 1, id: 1 }, { unique: true });
const Table = mongoose.model("Table", TableSchema);

const CategorySchema = new mongoose.Schema({
  adminId:   { type: String, required: true },
  id:        { type: String, required: true },
  name:      { type: String, required: true },
  icon:      { type: String, default: "🍽️" },
  color:     { type: String, default: "#F97316" },
  sortOrder: { type: Number, default: 0 },
  section:   { type: String, enum: ["restaurant", "cafe"], default: "restaurant" },
  active:    { type: Boolean, default: true },
});
CategorySchema.index({ adminId: 1, id: 1 }, { unique: true });
const Category = mongoose.model("Category", CategorySchema);

const MenuItemSchema = new mongoose.Schema({
  adminId:     { type: String, required: true },
  id:          { type: String, required: true },
  categoryId:  { type: String, required: true },
  name:        { type: String, required: true },
  price:       { type: Number, required: true },
  emoji:       { type: String, default: "🍔" },
  isAvailable: { type: Boolean, default: true },
  isVeg:       { type: Boolean, default: true },
  imageUrl:    { type: String, default: "" },
  shortCode:   { type: String, default: "" },
  description: { type: String, default: "" },
});
MenuItemSchema.index({ adminId: 1, id: 1 }, { unique: true });
const MenuItem = mongoose.model("MenuItem", MenuItemSchema);

const OrderItemSchema = new mongoose.Schema({
  menuItemId: { type: String, required: true },
  name:       { type: String, required: true },
  price:      { type: Number, required: true },
  qty:        { type: Number, required: true },
  notes:      { type: String, default: "" },
});

const OrderSchema = new mongoose.Schema({
  adminId:        { type: String, required: true },
  id:             { type: String, required: true },
  tableId:        { type: Number, required: true },
  orderNo:        { type: String, required: true },
  guests:         { type: Number, default: 1 },
  status:         { type: String, enum: ["open", "hold", "billed", "paid"], default: "open" },
  items:          [OrderItemSchema],
  subtotal:       { type: Number, default: 0 },
  gstAmount:      { type: Number, default: 0 },
  total:          { type: Number, default: 0 },
  openedAt:       { type: String, required: true },
  closedAt:       { type: String, default: null },
  paymentMethod:  { type: String, default: null },
  paymentSplits:  [{ method: String, amount: Number }],
  isTakeaway:     { type: Boolean, default: false },
  customerName:   { type: String, default: "" },
  customerPhone:  { type: String, default: "" },
});
OrderSchema.index({ adminId: 1, id: 1 }, { unique: true });
const Order = mongoose.model("Order", OrderSchema);

const InvoiceSchema = new mongoose.Schema({
  adminId:       { type: String, required: true },
  id:            { type: String, required: true },
  orderId:       { type: String, required: true },
  tableId:       { type: Number, required: true },
  orderNo:       { type: String, required: true },
  items:         [OrderItemSchema],
  subtotal:      { type: Number, required: true },
  gstAmount:     { type: Number, required: true },
  total:         { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  paymentSplits: [{ method: String, amount: Number }],
  createdAt:     { type: String, required: true },
  isTakeaway:    { type: Boolean, default: false },
  customerName:  { type: String, default: "" },
  customerPhone: { type: String, default: "" },
});
InvoiceSchema.index({ adminId: 1, id: 1 }, { unique: true });
const Invoice = mongoose.model("Invoice", InvoiceSchema);

const UserSchema = new mongoose.Schema({
  email:               { type: String, required: true, unique: true },
  password:            { type: String, required: true },
  role:                { type: String, enum: ["admin", "super-admin"], required: true },
  name:                { type: String, required: true },
  createdAt:           { type: String, required: true },
  subscriptionPaid:    { type: Boolean, default: true },
  authoritiesEnabled:  { type: Boolean, default: true },
});
const User = mongoose.model("User", UserSchema);

const RegistrationRequestSchema = new mongoose.Schema({
  name:           { type: String, required: true },
  email:          { type: String, required: true, unique: true },
  phone:          { type: String, required: true },
  password:       { type: String, required: true },
  restaurantName: { type: String, required: true },
  status:         { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  createdAt:      { type: String, required: true },
});
const RegistrationRequest = mongoose.model("RegistrationRequest", RegistrationRequestSchema);

// ============================================================
// 3. SEED DATA
// ============================================================
const REQUIRED_CATEGORIES = [
  { id: "popular",   name: "Popular",     icon: "★",  color: "#F97316", sortOrder: 0,  section: "restaurant" },
  { id: "starters",  name: "Starters",    icon: "🥗", color: "#16A34A", sortOrder: 1,  section: "restaurant" },
  { id: "main",      name: "Main Course", icon: "🍛", color: "#2563EB", sortOrder: 2,  section: "restaurant" },
  { id: "rice",      name: "Rice",        icon: "🍚", color: "#F59E0B", sortOrder: 3,  section: "restaurant" },
  { id: "beverages", name: "Beverages",   icon: "🥤", color: "#0EA5E9", sortOrder: 0,  section: "cafe" },
  { id: "snacks",    name: "Snacks",      icon: "🍟", color: "#EF4444", sortOrder: 1,  section: "cafe" },
  { id: "desserts",  name: "Desserts",    icon: "🍰", color: "#EC4899", sortOrder: 2,  section: "cafe" },
];

// No default menu items — restaurant adds their own
const REQUIRED_MENU_ITEMS = [];


const SUPER_ADMIN_EMAIL = "superadmin@restaurant.com";
const SUPER_ADMIN_PASS  = "superadmin123";
const DEMO_ADMIN_EMAIL  = "admin@restaurant.com";
const DEMO_ADMIN_PASS   = "admin123";

async function seedDatabase() {
  try {
    // ── Create super-admin ──
    let superAdmin = await User.findOne({ email: SUPER_ADMIN_EMAIL });
    if (!superAdmin) {
      const hashed = await bcrypt.hash(SUPER_ADMIN_PASS, 10);
      superAdmin = await User.create({
        email: SUPER_ADMIN_EMAIL,
        password: hashed,
        role: "super-admin",
        name: "Super Admin",
        createdAt: new Date().toISOString(),
      });
      console.log("Super-admin created:", SUPER_ADMIN_EMAIL);
    }

    // ── Create demo admin ──
    let demoAdmin = await User.findOne({ email: DEMO_ADMIN_EMAIL });
    if (!demoAdmin) {
      const hashed = await bcrypt.hash(DEMO_ADMIN_PASS, 10);
      demoAdmin = await User.create({
        email: DEMO_ADMIN_EMAIL,
        password: hashed,
        role: "admin",
        name: "Hotel Grand Admin",
        createdAt: new Date().toISOString(),
      });
      console.log("Demo admin created:", DEMO_ADMIN_EMAIL);
    }

    const adminId = demoAdmin._id.toString();

    // ── Settings ──
    const existingSettings = await Settings.findOne({ adminId });
    if (!existingSettings) {
      await Settings.create({
        adminId,
        restaurantName: "Hotel Grand",
        address: "123 Main Street, Hyderabad, Telangana 500001",
        phone: "+91 98765 43210",
        email: "info@hotelgrand.com",
        gstNumber: "29ABCDE1234F1Z5",
        gstPercent: 5,
        currency: "₹",
        tableCount: 14,
        restaurantTableCount: 6,
        familyTableCount: 5,
        takeawayTableCount: 3,
      });
      console.log("Settings seeded.");
    }

    // ── Tables ──
    const existingTables = await Table.countDocuments({ adminId });
    if (existingTables === 0) {
      const tableData = [
        { id: 1,  name: "T1",  seats: 2, section: "Restaurant",     status: "empty"  },
        { id: 2,  name: "T2",  seats: 4, section: "Restaurant",     status: "empty"  },
        { id: 3,  name: "T3",  seats: 4, section: "Restaurant",     status: "empty"  },
        { id: 4,  name: "T4",  seats: 6, section: "Restaurant",     status: "empty"  },
        { id: 5,  name: "T5",  seats: 2, section: "Restaurant",     status: "empty"  },
        { id: 6,  name: "T6",  seats: 4, section: "Restaurant",     status: "empty"  },
        { id: 7,  name: "T7",  seats: 8, section: "Family Section", status: "empty"  },
        { id: 8,  name: "T8",  seats: 6, section: "Family Section", status: "empty"  },
        { id: 9,  name: "T9",  seats: 8, section: "Family Section", status: "empty"  },
        { id: 10, name: "T10", seats: 6, section: "Family Section", status: "empty"  },
        { id: 11, name: "T11", seats: 4, section: "Family Section", status: "empty"  },
        { id: 12, name: "PK1", seats: 2, section: "Takeaway",       status: "empty"  },
        { id: 13, name: "PK2", seats: 2, section: "Takeaway",       status: "empty"  },
        { id: 14, name: "PK3", seats: 2, section: "Takeaway",       status: "empty"  },
      ];
      await Table.insertMany(tableData.map(t => ({ ...t, adminId })));
      console.log("Tables seeded.");
    }

    // ── Categories ──
    for (const cat of REQUIRED_CATEGORIES) {
      await Category.updateOne(
        { adminId, id: cat.id },
        { $setOnInsert: { ...cat, adminId } },
        { upsert: true }
      );
    }
    console.log("Categories seeded.");

    // ── Menu Items — no defaults, restaurant populates their own ──
    console.log("Menu items: no defaults seeded. Use the Menu page to add items.");

  } catch (err) {
    console.error("Seed error:", err);
  }
}

// ============================================================
// 4. ROUTES — Auth
// ============================================================
const authRoutes = require("./authentucationroutes");
app.use("/api/auth", authRoutes);

// --- JWT Verification and Admin Isolation Middleware ---
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key";

app.use((req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  
  if (!token) {
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token." });
    }
    req.user = decoded;
    
    // For normal admins, force the query to target their authenticated user ID
    if (decoded && decoded.role !== "super-admin") {
      req.query.adminId = decoded.userId || decoded.id;
    }
    next();
  });
});

// ============================================================
// 5. ROUTES — Settings
// ============================================================

// GET /api/settings — get settings for an admin
// For the desktop app (no auth yet) we use a query param adminId or default to demo admin
app.get("/api/settings", async (req, res) => {
  try {
    const adminId = req.query.adminId || (await getDemoAdminId());
    if (!adminId) return res.status(404).json({ error: "No admin found." });

    let settings = await Settings.findOne({ adminId });
    if (!settings) {
      settings = await Settings.create({ adminId });
    }
    res.json(settings);
  } catch (err) {
    console.error("Get settings error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// PUT /api/settings
app.put("/api/settings", async (req, res) => {
  try {
    const adminId = req.query.adminId || (await getDemoAdminId());
    if (!adminId) return res.status(404).json({ error: "No admin found." });

    const settings = await Settings.findOneAndUpdate(
      { adminId },
      { $set: req.body },
      { new: true, upsert: true }
    );
    res.json(settings);
  } catch (err) {
    console.error("Update settings error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// ============================================================
// 6. ROUTES — Tables
// ============================================================

app.get("/api/tables", async (req, res) => {
  try {
    const adminId = req.query.adminId || (await getDemoAdminId());
    const tables = await Table.find({ adminId }).sort({ id: 1 });

    // Auto-empty tables after 2 minutes grace time
    const now = new Date();
    for (const table of tables) {
      if (table.status === "paid" && table.paidAt) {
        const elapsed = now.getTime() - new Date(table.paidAt).getTime();
        if (elapsed >= 2 * 60 * 1000) {
          table.status = "empty";
          table.paidAt = null;
          await table.save();
        }
      }
    }

    res.json(tables);
  } catch (err) {
    console.error("Get tables error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.post("/api/tables", async (req, res) => {
  try {
    const adminId = req.query.adminId || (await getDemoAdminId());
    const { id, name, seats, section } = req.body;
    const table = await Table.create({ adminId, id, name, seats, section });
    res.status(201).json(table);
  } catch (err) {
    console.error("Create table error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.patch("/api/tables/:id", async (req, res) => {
  try {
    const adminId = req.query.adminId || (await getDemoAdminId());
    const table = await Table.findOneAndUpdate(
      { adminId, id: Number(req.params.id) },
      { $set: req.body },
      { new: true }
    );
    if (!table) return res.status(404).json({ error: "Table not found." });
    res.json(table);
  } catch (err) {
    console.error("Update table error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.post("/api/tables/:id/clear", async (req, res) => {
  try {
    const adminId = req.query.adminId || (await getDemoAdminId());
    const tableId = Number(req.params.id);

    const tableData = await Table.findOne({ adminId, id: tableId });
    if (tableData && tableData.currentOrderId) {
      await Order.deleteOne({ adminId, id: tableData.currentOrderId });
    }

    await Order.deleteMany({ adminId, tableId, status: { $ne: "paid" } });

    const table = await Table.findOneAndUpdate(
      { adminId, id: tableId },
      { status: "empty", currentOrderId: null },
      { new: true }
    );
    res.json(table);
  } catch (err) {
    console.error("Clear table error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.delete("/api/tables/:id", async (req, res) => {
  try {
    const adminId = req.query.adminId || (await getDemoAdminId());
    await Table.findOneAndDelete({ adminId, id: Number(req.params.id) });
    res.json({ success: true });
  } catch (err) {
    console.error("Delete table error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// ============================================================
// 7. ROUTES — Categories
// ============================================================

app.get("/api/categories", async (req, res) => {
  try {
    const adminId = req.query.adminId || (await getDemoAdminId());
    const cats = await Category.find({ adminId }).sort({ sortOrder: 1 });
    res.json(cats);
  } catch (err) {
    console.error("Get categories error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.post("/api/categories", async (req, res) => {
  try {
    const adminId = req.query.adminId || (await getDemoAdminId());
    const { name, icon, color, sortOrder, section, active } = req.body;
    const id = `cat_${Date.now()}`;
    const cat = await Category.create({ adminId, id, name, icon: icon || "🍽️", color: color || "#F97316", sortOrder: sortOrder || 0, section: section || "restaurant", active: active !== false });
    res.status(201).json(cat);
  } catch (err) {
    console.error("Create category error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.patch("/api/categories/:id", async (req, res) => {
  try {
    const adminId = req.query.adminId || (await getDemoAdminId());
    const cat = await Category.findOneAndUpdate(
      { adminId, id: req.params.id },
      { $set: req.body },
      { new: true }
    );
    if (!cat) return res.status(404).json({ error: "Category not found." });
    res.json(cat);
  } catch (err) {
    console.error("Update category error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.delete("/api/categories/:id", async (req, res) => {
  try {
    const adminId = req.query.adminId || (await getDemoAdminId());
    await Category.findOneAndDelete({ adminId, id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    console.error("Delete category error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// ============================================================
// 8. ROUTES — Menu Items
// ============================================================

app.get("/api/menu", async (req, res) => {
  try {
    const adminId = req.query.adminId || (await getDemoAdminId());
    const items = await MenuItem.find({ adminId }).sort({ categoryId: 1, name: 1 });
    res.json(items);
  } catch (err) {
    console.error("Get menu error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.post("/api/menu", async (req, res) => {
  try {
    const adminId = req.query.adminId || (await getDemoAdminId());
    const { categoryId, name, price, emoji, isVeg, imageUrl, shortCode, description } = req.body;
    const id = `m_${Date.now()}`;
    const item = await MenuItem.create({
      adminId, id, categoryId, name, price: Number(price),
      emoji: emoji || "🍔", isVeg: isVeg !== false, isAvailable: true,
      imageUrl: imageUrl || "", shortCode: shortCode || "", description: description || "",
    });
    res.status(201).json(item);
  } catch (err) {
    console.error("Create menu item error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.patch("/api/menu/:id", async (req, res) => {
  try {
    const adminId = req.query.adminId || (await getDemoAdminId());
    const item = await MenuItem.findOneAndUpdate(
      { adminId, id: req.params.id },
      { $set: req.body },
      { new: true }
    );
    if (!item) return res.status(404).json({ error: "Menu item not found." });
    res.json(item);
  } catch (err) {
    console.error("Update menu item error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.patch("/api/menu/:id/availability", async (req, res) => {
  try {
    const adminId = req.query.adminId || (await getDemoAdminId());
    const item = await MenuItem.findOneAndUpdate(
      { adminId, id: req.params.id },
      { $set: { isAvailable: req.body.isAvailable } },
      { new: true }
    );
    if (!item) return res.status(404).json({ error: "Menu item not found." });
    res.json(item);
  } catch (err) {
    console.error("Toggle availability error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.delete("/api/menu/:id", async (req, res) => {
  try {
    const adminId = req.query.adminId || (await getDemoAdminId());
    await MenuItem.findOneAndDelete({ adminId, id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    console.error("Delete menu item error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Upload menu item image to Cloudinary
app.post("/api/menu/upload-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded." });

    // Convert buffer to base64 data URI — works reliably without stream pipes
    const b64 = req.file.buffer.toString("base64");
    const dataUri = `data:${req.file.mimetype};base64,${b64}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: "restaurant_menu",
      resource_type: "image",
    });

    res.json({ url: result.secure_url });
  } catch (err) {
    console.error("Image upload error:", err);
    res.status(500).json({ error: "Image upload failed." });
  }
});

// Upload restaurant logo to Cloudinary
app.post("/api/settings/upload-logo", upload.single("logo"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded." });

    const b64 = req.file.buffer.toString("base64");
    const dataUri = `data:${req.file.mimetype};base64,${b64}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: "restaurant_logo",
      resource_type: "image",
    });

    res.json({ url: result.secure_url });
  } catch (err) {
    console.error("Logo upload error:", err);
    res.status(500).json({ error: "Logo upload failed." });
  }
});


// ============================================================
// 9. ROUTES — Orders
// ============================================================

app.get("/api/orders", async (req, res) => {
  try {
    const adminId = req.query.adminId || (await getDemoAdminId());
    const { status, tableId, limit } = req.query;
    const filter = { adminId };
    if (status) {
      if (typeof status === "string" && status.includes(",")) {
        filter.status = { $in: status.split(",") };
      } else {
        filter.status = status;
      }
    }
    if (tableId) filter.tableId = Number(tableId);

    const orders = await Order.find(filter)
      .sort({ openedAt: -1 })
      .limit(limit ? Number(limit) : 100);
    res.json(orders);
  } catch (err) {
    console.error("Get orders error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.get("/api/orders/:id", async (req, res) => {
  try {
    const adminId = req.query.adminId || (await getDemoAdminId());
    const order = await Order.findOne({ adminId, id: req.params.id });
    if (!order) return res.status(404).json({ error: "Order not found." });
    res.json(order);
  } catch (err) {
    console.error("Get order error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.post("/api/orders", async (req, res) => {
  try {
    const adminId = req.query.adminId || (await getDemoAdminId());
    const { tableId, items, guests, isTakeaway, customerName, customerPhone, gstPercent } = req.body;

    const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
    const gstPct   = gstPercent !== undefined ? gstPercent : 5;
    const gstAmount = Math.round(subtotal * (gstPct / 100));
    const total    = subtotal + gstAmount;

    const orderCount = await Order.countDocuments({ adminId });
    const orderNo   = `ORD-${String(orderCount + 1).padStart(4, "0")}`;
    const id        = `order_${Date.now()}`;

    const order = await Order.create({
      adminId, id, tableId: Number(tableId), orderNo,
      guests: guests || 1, items, subtotal, gstAmount, total,
      status: "open", openedAt: new Date().toISOString(),
      isTakeaway: isTakeaway || false,
      customerName: customerName || "", customerPhone: customerPhone || "",
    });

    // Update table status to active
    await Table.findOneAndUpdate(
      { adminId, id: Number(tableId) },
      { $set: { status: "active", currentOrderId: id } }
    );

    res.status(201).json(order);
  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.patch("/api/orders/:id", async (req, res) => {
  try {
    const adminId = req.query.adminId || (await getDemoAdminId());
    const updateData = { ...req.body };

    // Recalculate totals if items are being updated
    if (updateData.items) {
      const gstPct = updateData.gstPercent || 5;
      updateData.subtotal  = updateData.items.reduce((sum, i) => sum + i.price * i.qty, 0);
      updateData.gstAmount = Math.round(updateData.subtotal * (gstPct / 100));
      updateData.total     = updateData.subtotal + updateData.gstAmount;
    }

    const order = await Order.findOneAndUpdate(
      { adminId, id: req.params.id },
      { $set: updateData },
      { new: true }
    );
    if (!order) return res.status(404).json({ error: "Order not found." });

    // Sync table status when order status changes
    if (updateData.status === "billed") {
      await Table.findOneAndUpdate({ adminId, id: order.tableId }, { $set: { status: "bill" } });
    } else if (updateData.status === "hold") {
      await Table.findOneAndUpdate({ adminId, id: order.tableId }, { $set: { status: "active" } });
    }

    res.json(order);
  } catch (err) {
    console.error("Update order error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// POST /api/orders/:id/pay — process payment and create invoice
app.post("/api/orders/:id/pay", async (req, res) => {
  try {
    const adminId = req.query.adminId || (await getDemoAdminId());
    const { paymentMethod, paymentSplits } = req.body;

    const order = await Order.findOne({ adminId, id: req.params.id });
    if (!order) return res.status(404).json({ error: "Order not found." });
    if (order.status === "paid") return res.status(400).json({ error: "Order already paid." });

    const now = new Date().toISOString();

    // Mark order as paid
    order.status = "paid";
    order.paymentMethod = paymentMethod;
    order.paymentSplits = paymentSplits || [];
    order.closedAt = now;
    await order.save();

    // Free the table
    await Table.findOneAndUpdate(
      { adminId, id: order.tableId },
      { $set: { status: "paid", currentOrderId: null, paidAt: new Date() } }
    );

    // Create invoice
    const invoiceId = `inv_${Date.now()}`;
    const invoice = await Invoice.create({
      adminId,
      id: invoiceId,
      orderId: order.id,
      tableId: order.tableId,
      orderNo: order.orderNo,
      items: order.items,
      subtotal: order.subtotal,
      gstAmount: order.gstAmount,
      total: order.total,
      paymentMethod,
      paymentSplits: paymentSplits || [],
      createdAt: now,
      isTakeaway: order.isTakeaway,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
    });

    res.json({ success: true, order, invoice });
  } catch (err) {
    console.error("Payment error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// ============================================================
// 10. ROUTES — Invoices
// ============================================================

app.get("/api/invoices", async (req, res) => {
  try {
    const adminId = req.query.adminId || (await getDemoAdminId());
    const { limit, date } = req.query;
    const filter = { adminId };
    if (date) {
      filter.createdAt = { $regex: `^${date}` };
    }
    const invoices = await Invoice.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit ? Number(limit) : 100);
    res.json(invoices);
  } catch (err) {
    console.error("Get invoices error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.get("/api/invoices/:id", async (req, res) => {
  try {
    const adminId = req.query.adminId || (await getDemoAdminId());
    const invoice = await Invoice.findOne({ adminId, id: req.params.id });
    if (!invoice) return res.status(404).json({ error: "Invoice not found." });
    res.json(invoice);
  } catch (err) {
    console.error("Get invoice error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// ============================================================
// 11. ROUTES — Reports
// ============================================================

app.get("/api/reports/daily", async (req, res) => {
  try {
    const adminId = req.query.adminId || (await getDemoAdminId());
    const date = req.query.date || new Date().toISOString().split("T")[0];

    const invoices = await Invoice.find({
      adminId,
      createdAt: { $regex: `^${date}` },
    });

    const totalRevenue  = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalOrders   = invoices.length;
    const totalTax      = invoices.reduce((sum, inv) => sum + inv.gstAmount, 0);
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // Payment method breakdown
    const paymentBreakdown = {};
    for (const inv of invoices) {
      const method = inv.paymentMethod || "unknown";
      if (!paymentBreakdown[method]) paymentBreakdown[method] = { count: 0, amount: 0 };
      paymentBreakdown[method].count++;
      paymentBreakdown[method].amount += inv.total;
    }

    res.json({
      date, totalRevenue, totalOrders, totalTax, avgOrderValue,
      paymentBreakdown, invoices,
    });
  } catch (err) {
    console.error("Daily report error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.get("/api/reports/summary", async (req, res) => {
  try {
    const adminId = req.query.adminId || (await getDemoAdminId());
    const today = new Date().toISOString().split("T")[0];

    const todayInvoices = await Invoice.find({ adminId, createdAt: { $regex: `^${today}` } });
    const allInvoices   = await Invoice.find({ adminId });
    const openOrders    = await Order.countDocuments({ adminId, status: "open" });
    const tables        = await Table.find({ adminId });

    const todayRevenue  = todayInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalRevenue  = allInvoices.reduce((sum, inv) => sum + inv.total, 0);

    const tableStatusCounts = {
      empty:  tables.filter(t => t.status === "empty").length,
      active: tables.filter(t => t.status === "active").length,
      bill:   tables.filter(t => t.status === "bill").length,
      paid:   tables.filter(t => t.status === "paid").length,
    };

    res.json({
      todayRevenue, todayOrders: todayInvoices.length,
      totalRevenue, totalOrders: allInvoices.length,
      openOrders, tableStatusCounts,
    });
  } catch (err) {
    console.error("Summary report error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// ============================================================
// 12. HELPER — Get demo admin ID (for no-auth mode)
// ============================================================
async function getDemoAdminId() {
  const admin = await User.findOne({ email: DEMO_ADMIN_EMAIL });
  return admin ? admin._id.toString() : null;
}


// ============================================================
// 14. START SERVER
// ============================================================
app.listen(PORT, () => {
  console.log(`Restaurant POS Backend running on port ${PORT}`);
});

// ============================================================
// 15. MONTHLY REPORT — Excel + Email via Resend
// ============================================================
const cron    = require("node-cron");
const ExcelJS = require("exceljs");
const { Resend } = require("resend");

const resend     = new Resend(process.env.RESEND_API_KEY);
const RESEND_FROM = process.env.RESEND_FROM || "reports@restaurant-pos.app";

// ── Build Excel buffer ────────────────────────────────────────────────────
async function buildMonthlyExcel({ adminName, monthLabel, completed, cancelled }) {
  const workbook  = new ExcelJS.Workbook();
  workbook.creator = "Restaurant POS";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Monthly Transactions", {
    pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true },
  });

  // Theme colours
  const HEADER_FILL = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1C0A00" } };
  const ALT_FILL    = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF7ED" } };
  const GREEN_FILL  = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD1FAE5" } };
  const RED_FILL    = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } };
  const TOTAL_FILL  = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF97316" } };
  const PLAIN_FILL  = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } };
  const BORDER      = { style: "thin", color: { argb: "FFE5E7EB" } };
  const CELL_BORDER = { top: BORDER, left: BORDER, bottom: BORDER, right: BORDER };

  const headerFont = { name: "Calibri", bold: true, size: 11, color: { argb: "FFFFFFFF" } };
  const bodyFont   = { name: "Calibri", size: 10 };
  const totalFont  = { name: "Calibri", bold: true, size: 11, color: { argb: "FFFFFFFF" } };

  // Title row
  sheet.mergeCells("A1:L1");
  const titleCell = sheet.getCell("A1");
  titleCell.value = `${adminName} — Monthly Report · ${monthLabel}`;
  titleCell.font  = { name: "Calibri", bold: true, size: 14, color: { argb: "FF1C0A00" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  titleCell.fill  = ALT_FILL;
  sheet.getRow(1).height = 28;

  // Column definitions
  sheet.columns = [
    { key: "no",      header: "#",              width: 6  },
    { key: "orderNo", header: "Order No",       width: 12 },
    { key: "table",   header: "Table",          width: 10 },
    { key: "date",    header: "Date",           width: 13 },
    { key: "time",    header: "Time",           width: 10 },
    { key: "items",   header: "Items",          width: 36 },
    { key: "subtotal",header: "Subtotal (Rs)",  width: 14 },
    { key: "gst",     header: "GST (Rs)",       width: 11 },
    { key: "total",   header: "Total (Rs)",     width: 14 },
    { key: "payment", header: "Payment Method", width: 16 },
    { key: "type",    header: "Type",           width: 11 },
    { key: "status",  header: "Status",         width: 14 },
  ];

  // Header row (row 2)
  const headerRow = sheet.getRow(2);
  headerRow.height = 22;
  sheet.columns.forEach((col, i) => {
    const cell     = headerRow.getCell(i + 1);
    cell.value     = col.header;
    cell.font      = headerFont;
    cell.fill      = HEADER_FILL;
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border    = CELL_BORDER;
  });

  // Helpers
  const fmtDate = (iso) => {
    try {
      return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    } catch { return iso || ""; }
  };
  const fmtTime = (iso) => {
    try {
      return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    } catch { return ""; }
  };
  const fmtItems = (items = []) =>
    (items || []).map(it => `${it.name} x${it.qty}`).join(", ") || "—";

  // Merge + sort all rows by date
  const allRows = [
    ...completed.map(inv => ({ ...inv, _status: "completed" })),
    ...cancelled.map(ord => ({ ...ord, _status: "cancelled"  })),
  ].sort((a, b) => {
    const ta = (a.createdAt || a.openedAt || "");
    const tb = (b.createdAt || b.openedAt || "");
    return ta.localeCompare(tb);
  });

  let rowIdx   = 3;
  let rowCount = 0;

  for (const rec of allRows) {
    rowCount++;
    const isCompleted = rec._status === "completed";
    const dateStr     = rec.createdAt || rec.openedAt || "";
    const tableLabel  = rec.isTakeaway ? "Takeaway" : `T${rec.tableId}`;
    const isEven      = rowCount % 2 === 0;

    const rowData = {
      no:       rowCount,
      orderNo:  rec.orderNo || rec.id,
      table:    tableLabel,
      date:     fmtDate(dateStr),
      time:     fmtTime(dateStr),
      items:    fmtItems(rec.items),
      subtotal: rec.subtotal ?? 0,
      gst:      rec.gstAmount ?? 0,
      total:    isCompleted ? (rec.total ?? 0) : 0,
      payment:  isCompleted ? (rec.paymentMethod || "—") : "—",
      type:     rec.isTakeaway ? "Takeaway" : "Dine-in",
      status:   isCompleted ? "Completed" : "Cancelled",
    };

    const baseFill = isEven ? ALT_FILL : PLAIN_FILL;
    const row      = sheet.getRow(rowIdx);
    row.height     = 18;

    sheet.columns.forEach((col, ci) => {
      const cell = row.getCell(ci + 1);
      cell.value     = rowData[col.key];
      cell.font      = bodyFont;
      cell.border    = CELL_BORDER;
      cell.alignment = { vertical: "middle", wrapText: col.key === "items" };

      if (col.key === "status") {
        cell.fill  = isCompleted ? GREEN_FILL : RED_FILL;
        cell.font  = { ...bodyFont, bold: true, color: { argb: isCompleted ? "FF065F46" : "FF991B1B" } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
      } else {
        cell.fill = baseFill;
      }

      if (["subtotal", "gst", "total"].includes(col.key)) {
        cell.alignment = { horizontal: "right", vertical: "middle" };
        cell.numFmt    = "#,##0.00";
      }
      if (col.key === "no") {
        cell.alignment = { horizontal: "right", vertical: "middle" };
      }
    });

    rowIdx++;
  }

  // Total row
  const totalRevenue = completed.reduce((s, inv) => s + (inv.total ?? 0), 0);
  const totalRow     = sheet.getRow(rowIdx);
  totalRow.height    = 24;

  sheet.mergeCells(`A${rowIdx}:H${rowIdx}`);
  const labelCell         = totalRow.getCell(1);
  labelCell.value         = `Total Revenue for ${monthLabel}`;
  labelCell.font          = totalFont;
  labelCell.fill          = TOTAL_FILL;
  labelCell.alignment     = { horizontal: "right", vertical: "middle" };
  labelCell.border        = CELL_BORDER;

  const totalCell         = totalRow.getCell(9);
  totalCell.value         = totalRevenue;
  totalCell.numFmt        = "#,##0.00";
  totalCell.font          = totalFont;
  totalCell.fill          = TOTAL_FILL;
  totalCell.border        = CELL_BORDER;
  totalCell.alignment     = { horizontal: "right", vertical: "middle" };

  for (let c = 10; c <= 12; c++) {
    const cell  = totalRow.getCell(c);
    cell.fill   = TOTAL_FILL;
    cell.border = CELL_BORDER;
  }

  sheet.views = [{ state: "frozen", ySplit: 2 }];

  const buffer = await workbook.xlsx.writeBuffer();
  return { buffer, totalRevenue, rowCount };
}

// ── Core report sender ────────────────────────────────────────────────────
async function sendMonthlyReport(adminId, adminEmail, adminName) {
  try {
    const now       = new Date();
    const year      = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const month     = now.getMonth() === 0 ? 12 : now.getMonth();
    const monthStr  = String(month).padStart(2, "0");
    const prefix    = `${year}-${monthStr}`;
    const monthLabel = new Date(year, month - 1, 1)
      .toLocaleDateString("en-IN", { month: "long", year: "numeric" });

    console.log(`[Monthly Report] Generating — adminId=${adminId}, month=${prefix}`);

    const completed = await Invoice.find({
      adminId,
      createdAt: { $regex: `^${prefix}` },
    }).lean();

    const cancelled = await Order.find({
      adminId,
      openedAt: { $regex: `^${prefix}` },
      status:   { $in: ["open", "hold"] },
    }).lean();

    if (completed.length === 0 && cancelled.length === 0) {
      console.log(`[Monthly Report] No data for ${prefix}, skipping.`);
      return { skipped: true, reason: "No transactions" };
    }

    const { buffer, totalRevenue, rowCount } = await buildMonthlyExcel({
      adminName, monthLabel, completed, cancelled,
    });

    const filename = `${adminName.replace(/\s+/g, "_")}_Report_${prefix}.xlsx`;

    const settings = await Settings.findOne({ adminId }).lean();
    const restaurantName = settings?.restaurantName || adminName;

    const emailResult = await resend.emails.send({
      from:    RESEND_FROM,
      to:      adminEmail,
      subject: `Monthly Report — ${restaurantName} · ${monthLabel}`,
      html: `
        <div style="font-family:'Segoe UI',Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#fff;">
          <div style="background:#1C0A00;padding:28px 32px;border-radius:12px 12px 0 0;">
            <h1 style="color:#F97316;margin:0;font-size:22px;">Monthly Transaction Report</h1>
            <p style="color:rgba(255,255,255,0.7);margin:6px 0 0;font-size:14px;">${restaurantName} &middot; ${monthLabel}</p>
          </div>
          <div style="padding:28px 32px;background:#FFFBF5;border:1px solid #F3E8D8;border-top:none;border-radius:0 0 12px 12px;">
            <p style="color:#374151;font-size:15px;margin:0 0 16px;">Hi <strong>${adminName}</strong>,</p>
            <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 20px;">
              Your monthly transaction report for <strong>${monthLabel}</strong> is attached as an Excel file.
            </p>
            <div style="background:#fff;border:1px solid #E5E7EB;border-radius:10px;padding:20px;margin-bottom:24px;">
              <table style="width:100%;border-collapse:collapse;">
                <tr>
                  <td style="padding:8px 0;color:#6B7280;font-size:13px;">Total Transactions</td>
                  <td style="padding:8px 0;font-weight:700;font-size:14px;text-align:right;">${rowCount}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#6B7280;font-size:13px;">Completed Orders</td>
                  <td style="padding:8px 0;font-weight:700;color:#065F46;font-size:14px;text-align:right;">${completed.length}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#6B7280;font-size:13px;">Cancelled Orders</td>
                  <td style="padding:8px 0;font-weight:700;color:#991B1B;font-size:14px;text-align:right;">${cancelled.length}</td>
                </tr>
                <tr style="border-top:2px solid #F97316;">
                  <td style="padding:12px 0 4px;color:#111827;font-weight:700;font-size:15px;">Total Revenue</td>
                  <td style="padding:12px 0 4px;font-weight:800;color:#F97316;font-size:18px;text-align:right;">
                    Rs ${totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </table>
            </div>
            <p style="color:#9CA3AF;font-size:12px;margin:0;">
              Auto-generated by Restaurant POS on ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}.
            </p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename,
          content: Buffer.from(buffer).toString("base64"),
        },
      ],
    });

    console.log(`[Monthly Report] Sent to ${adminEmail} — id: ${emailResult?.data?.id}`);
    return { success: true, emailId: emailResult?.data?.id, totalRevenue, rowCount };
  } catch (err) {
    console.error(`[Monthly Report] Error for ${adminId}:`, err);
    return { success: false, error: err.message };
  }
}

// ── Cron: 00:00 on the 1st of every month (IST) ──────────────────────────
cron.schedule("0 0 1 * *", async () => {
  console.log("[Monthly Report] Cron fired — emailing all admins...");
  try {
    const admins = await User.find({ role: "admin" });
    for (const admin of admins) {
      await sendMonthlyReport(admin._id.toString(), admin.email, admin.name);
    }
    console.log("[Monthly Report] All admins processed.");
  } catch (err) {
    console.error("[Monthly Report] Cron error:", err);
  }
}, { scheduled: true, timezone: "Asia/Kolkata" });

// ── Manual trigger for testing: POST /api/reports/send-monthly ───────────
app.post("/api/reports/send-monthly", async (req, res) => {
  try {
    const adminId = req.query.adminId || (await getDemoAdminId());
    const admin   = await User.findById(adminId);
    if (!admin) return res.status(404).json({ error: "Admin not found." });
    const result = await sendMonthlyReport(adminId, admin.email, admin.name);
    res.json(result);
  } catch (err) {
    console.error("[Monthly Report] Manual trigger error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/reports/export-excel (downloads current month's report) ───────
app.get("/api/reports/export-excel", async (req, res) => {
  try {
    const adminId = req.query.adminId || (await getDemoAdminId());
    const admin   = await User.findById(adminId);
    if (!admin) return res.status(404).json({ error: "Admin not found." });

    const now       = new Date();
    const year      = now.getFullYear();
    const month     = now.getMonth() + 1; // 1-based current month
    const monthStr  = String(month).padStart(2, "0");
    const prefix    = req.query.month || `${year}-${monthStr}`; // e.g. "2026-07"
    
    // Parse year and month from prefix to get month label
    const [pYear, pMonth] = prefix.split("-").map(Number);
    const monthLabel = new Date(pYear, pMonth - 1, 1)
      .toLocaleDateString("en-IN", { month: "long", year: "numeric" });

    console.log(`[Monthly Report] Manual Excel Export — adminId=${adminId}, prefix=${prefix}`);

    const completed = await Invoice.find({
      adminId,
      createdAt: { $regex: `^${prefix}` },
    }).lean();

    const cancelled = await Order.find({
      adminId,
      openedAt: { $regex: `^${prefix}` },
      status:   { $in: ["open", "hold"] },
    }).lean();

    const { buffer } = await buildMonthlyExcel({
      adminName: admin.name,
      monthLabel,
      completed,
      cancelled,
    });

    const filename = `${admin.name.replace(/\s+/g, "_")}_Report_${prefix}.xlsx`;

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    console.error("[Monthly Report] Export Excel error:", err);
    res.status(500).json({ error: err.message });
  }
});
// ============================================================
// 13. CATCH-ALL — Serve frontend SPA (MUST BE LAST ROUTE)
// ============================================================
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../appss/web/dist", "index.html"));
});
