export type AdminTableStatus  = "empty" | "active" | "bill" | "paid"
export type AdminTableSection = "Restaurant" | "Family Section" | "Takeaway"

export interface AdminTable {
  id:       string
  name:     string
  seats:    number
  section:  AdminTableSection
  status:   AdminTableStatus
  floor:    string
}

export const adminTables: AdminTable[] = [
  { id: "t1",  name: "T1",  seats: 2, section: "Restaurant",     floor: "Ground",  status: "empty"  },
  { id: "t2",  name: "T2",  seats: 4, section: "Restaurant",     floor: "Ground",  status: "active" },
  { id: "t3",  name: "T3",  seats: 4, section: "Restaurant",     floor: "Ground",  status: "active" },
  { id: "t4",  name: "T4",  seats: 6, section: "Restaurant",     floor: "Ground",  status: "bill"   },
  { id: "t5",  name: "T5",  seats: 2, section: "Restaurant",     floor: "Ground",  status: "empty"  },
  { id: "t6",  name: "T6",  seats: 4, section: "Restaurant",     floor: "Ground",  status: "active" },
  { id: "t7",  name: "T7",  seats: 8, section: "Family Section", floor: "Ground",  status: "active" },
  { id: "t8",  name: "T8",  seats: 6, section: "Family Section", floor: "Ground",  status: "active" },
  { id: "t9",  name: "T9",  seats: 8, section: "Family Section", floor: "First",   status: "empty"  },
  { id: "t10", name: "T10", seats: 6, section: "Family Section", floor: "First",   status: "active" },
  { id: "t11", name: "T11", seats: 4, section: "Family Section", floor: "First",   status: "paid"   },
  { id: "t12", name: "PK1", seats: 2, section: "Takeaway",       floor: "Ground",  status: "empty"  },
  { id: "t13", name: "PK2", seats: 2, section: "Takeaway",       floor: "Ground",  status: "active" },
  { id: "t14", name: "PK3", seats: 2, section: "Takeaway",       floor: "Ground",  status: "empty"  },
]
