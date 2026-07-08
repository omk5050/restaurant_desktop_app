export interface Category {
  id:        string
  name:      string
  icon?:     string
  color:     string
  sortOrder: number
  itemCount: number
  active:    boolean
}

export const categories: Category[] = [
  { id: "c1",  name: "Hyderabadi Dum Biryani",      color: "#F97316", sortOrder: 1,  itemCount: 7,  active: true  },
  { id: "c2",  name: "Non-Veg Tandoor & Kebabs",    color: "#EF4444", sortOrder: 2,  itemCount: 4,  active: true  },
  { id: "c3",  name: "Veg Starters",                color: "#16A34A", sortOrder: 3,  itemCount: 3,  active: true  },
  { id: "c4",  name: "Non-Veg Starters",            color: "#DC2626", sortOrder: 4,  itemCount: 5,  active: true  },
  { id: "c5",  name: "Egg Starters",                color: "#F59E0B", sortOrder: 5,  itemCount: 2,  active: true  },
  { id: "c6",  name: "Veg",                         color: "#22C55E", sortOrder: 6,  itemCount: 6,  active: true  },
  { id: "c7",  name: "Chicken",                     color: "#EA580C", sortOrder: 7,  itemCount: 8,  active: true  },
  { id: "c8",  name: "Mutton",                      color: "#B91C1C", sortOrder: 8,  itemCount: 4,  active: true  },
  { id: "c9",  name: "Fish",                        color: "#0EA5E9", sortOrder: 9,  itemCount: 3,  active: true  },
  { id: "c10", name: "Family Combo",                color: "#7C3AED", sortOrder: 10, itemCount: 5,  active: true  },
  { id: "c11", name: "Veg Soup",                    color: "#65A30D", sortOrder: 11, itemCount: 3,  active: false },
  { id: "c12", name: "Chicken Soup",                color: "#D97706", sortOrder: 12, itemCount: 3,  active: true  },
  { id: "c13", name: "Biryani",                     color: "#F97316", sortOrder: 13, itemCount: 9,  active: true  },
  { id: "c14", name: "Tandoor Platter",             color: "#DC2626", sortOrder: 14, itemCount: 4,  active: true  },
  { id: "c15", name: "Ice Cream",                   color: "#EC4899", sortOrder: 15, itemCount: 5,  active: true  },
  { id: "c16", name: "Beverages",                   color: "#0EA5E9", sortOrder: 16, itemCount: 6,  active: true  },
  { id: "c17", name: "Breads",                      color: "#92400E", sortOrder: 17, itemCount: 4,  active: true  },
]
