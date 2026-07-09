export interface RestaurantSettings {
  name:                  string
  tagline:               string
  address:               string
  phone:                 string
  email:                 string
  website:               string
  gstNumber:             string
  gstPercent:            number
  serviceChargePercent:  number
  currency:              string
  currencySymbol:        string
  receiptFooter:         string
  theme:                 "orange" | "blue" | "green" | "purple"
  timezone:              string
  logoUrl?:              string
}

export const defaultSettings: RestaurantSettings = {
  name:                 "Hotel Grand",
  tagline:              "Restaurant & Family Dining",
  address:              "123 Main Street, Hyderabad, Telangana 500001",
  phone:                "+91 98765 43210",
  email:                "info@hotelgrand.com",
  website:              "www.hotelgrand.com",
  gstNumber:            "29ABCDE1234F1Z5",
  gstPercent:           15,
  serviceChargePercent: 0,
  currency:             "INR",
  currencySymbol:       "₹",
  receiptFooter:        "Thank you for dining with us!\nVisit again soon.",
  theme:                "orange",
  timezone:             "Asia/Kolkata",
}
