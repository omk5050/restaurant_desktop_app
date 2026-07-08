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


const SUPER_ADMIN_EMAIL = "superadmin@restaurantapp.com";
const SUPER_ADMIN_PASS  = "SuperAdmin@123";
const DEMO_ADMIN_EMAIL  = "admin@hotelgrand.com";
const DEMO_ADMIN_PASS   = "Admin@123";

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
// 13. CATCH-ALL — Serve frontend SPA
// ============================================================
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../appss/web/dist", "index.html"));
});

// ============================================================
// 14. START SERVER
// ============================================================
app.listen(PORT, () => {
  console.log(`Restaurant POS Backend running on port ${PORT}`);
});
