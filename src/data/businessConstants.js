// ─── Business Registration Constants ───────────────────────────────────────
// Used by RegisterBusinessScreen and future admin review UI.

export const BUSINESS_TYPE_OPTIONS = [
  { id: 'shop',               label: 'Shop / Retail Store',              icon: '🏪' },
  { id: 'individual_provider', label: 'Individual Service Provider',      icon: '👷' },
  { id: 'medical_facility',   label: 'Clinic / Medical Facility',         icon: '🏥' },
  { id: 'education_institute', label: 'Education / Training Institute',   icon: '🎓' },
  { id: 'society_vendor',     label: 'Society Vendor',                    icon: '🏘️' },
  { id: 'other',              label: 'Other Local Business',              icon: '🏢' },
]

// Categories that require admin verification before showing as verified
export const MEDICAL_CATEGORIES = ['pharmacy', 'clinic', 'diagnostic', 'dental', 'blood']

export const BUSINESS_CATEGORY_TREE = [
  {
    id: 'grocery',
    label: 'Grocery & Daily Needs',
    icon: '🛒',
    subcategories: ['Grocery Store', 'Vegetable Vendor', 'Dairy', 'General Store', 'Kirana Shop'],
  },
  {
    id: 'pharmacy',
    label: 'Pharmacy',
    icon: '💊',
    subcategories: ['Medical Shop', 'Generic Medicine Store', 'Wellness Products'],
  },
  {
    id: 'food',
    label: 'Food',
    icon: '🍱',
    subcategories: ['Restaurant', 'Tiffin Service', 'Bakery', 'Snacks & Chat', 'Cloud Kitchen', 'Juice Bar'],
  },
  {
    id: 'repair',
    label: 'Repair & Hardware',
    icon: '🔧',
    subcategories: ['Electrician', 'Plumber', 'Carpenter', 'Hardware Shop', 'Mobile Repair', 'Appliance Repair', 'AC Repair', 'Painting'],
  },
  {
    id: 'home_services',
    label: 'Home Services',
    icon: '🏠',
    subcategories: ['Maid / House Help', 'Cook', 'Driver', 'Babysitter / Nanny', 'Security Guard', 'Pest Control', 'Gardener', 'Home Nurse'],
  },
  {
    id: 'clinic',
    label: 'Medical & Clinics',
    icon: '🏥',
    subcategories: ['General Clinic', 'Hospital', 'Dental Clinic', 'Eye Clinic', 'Physiotherapy', 'Diagnostic Lab', 'Blood Bank', 'Paediatric Clinic', 'Ayurveda / Homeopathy'],
  },
  {
    id: 'education',
    label: 'Education',
    icon: '📚',
    subcategories: ['Tuition Class', 'Coaching Class', 'Preschool / Nursery', 'School (K–12)', 'College / Institute', 'Skill Training', 'Music / Dance / Art', 'Sports Academy', 'Computer / IT Training'],
  },
  {
    id: 'wellness',
    label: 'Fitness & Wellness',
    icon: '🏋️',
    subcategories: ['Gym', 'Yoga Studio', 'Spa', 'Ayurveda Wellness', 'Zumba / Dance Fitness', 'Crossfit / Martial Arts'],
  },
  {
    id: 'salon',
    label: 'Salon & Beauty',
    icon: '✂️',
    subcategories: ["Women's Salon", "Men's Salon / Barbershop", 'Beauty Parlour', 'Makeup Artist', 'Mehndi Artist'],
  },
  {
    id: 'laundry',
    label: 'Laundry',
    icon: '👕',
    subcategories: ['Laundry', 'Dry Cleaning', 'Ironing / Press Service'],
  },
  {
    id: 'vet',
    label: 'Veterinary',
    icon: '🐾',
    subcategories: ['Vet Clinic', 'Pet Grooming', 'Pet Shop', 'Dog Walker'],
  },
  {
    id: 'sports',
    label: 'Sports',
    icon: '⚽',
    subcategories: ['Cricket Academy', 'Football Ground', 'Badminton Court', 'Swimming Pool', 'Sports Shop'],
  },
  {
    id: 'other',
    label: 'Other',
    icon: '🏢',
    subcategories: ['Other'],
  },
]

export const PAYMENT_MODE_OPTIONS = [
  { id: 'cash',          label: 'Cash' },
  { id: 'upi',           label: 'UPI (GPay / PhonePe / Paytm)' },
  { id: 'card',          label: 'Card' },
  { id: 'bank_transfer', label: 'Bank Transfer / NEFT' },
]

export const OPEN_DAYS_OPTIONS = [
  { id: 'mon', label: 'Mon' },
  { id: 'tue', label: 'Tue' },
  { id: 'wed', label: 'Wed' },
  { id: 'thu', label: 'Thu' },
  { id: 'fri', label: 'Fri' },
  { id: 'sat', label: 'Sat' },
  { id: 'sun', label: 'Sun' },
]
