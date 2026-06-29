import { Badge, CommunityMission, CivicIssue } from "./types";

export const GLOBAL_BADGES: Badge[] = [
  {
    id: "badge_first_report",
    title: "Vigilant Citizen",
    description: "Reported your first community issue.",
    icon: "Eye",
    rarity: "Common"
  },
  {
    id: "badge_three_verifications",
    title: "Truth Seeker",
    description: "Verified three infrastructure issues reported by other citizens.",
    icon: "CheckCircle",
    rarity: "Common"
  },
  {
    id: "badge_first_resolved",
    title: "Civic Resolver",
    description: "Helped resolve an issue successfully in your neighborhood.",
    icon: "Wrench",
    rarity: "Rare"
  },
  {
    id: "badge_impact_50",
    title: "Community Pillar",
    description: "Replaced 50 impact score milestone with outstanding reports.",
    icon: "ShieldAlert",
    rarity: "Epic"
  },
  {
    id: "badge_level_10",
    title: "Local Legend",
    description: "Replaced Level 10 of Citizen Hero.",
    icon: "Award",
    rarity: "Legendary"
  },
  {
    id: "badge_flood_watcher",
    title: "Flood Watcher",
    description: "Successfully verified community drainage structures to prevent storm water flooding.",
    icon: "CloudRain",
    rarity: "Epic"
  },
  {
    id: "badge_road_protector",
    title: "Road Protector",
    description: "Completed full-sector asphalt structural surveys and road hazard patrols.",
    icon: "Milestone",
    rarity: "Epic"
  },
  {
    id: "badge_safety_sentinel",
    title: "Safety Sentinel",
    description: "Identified and secured active electrical risks and critical crosswalk issues.",
    icon: "Zap",
    rarity: "Epic"
  }
];

export const COMMUNITY_MISSIONS: CommunityMission[] = [
  {
    id: "mission_potholes",
    title: "Pothole Patrol",
    description: "Identify and verify 10 major road defects in the city district.",
    xpReward: 350,
    targetCount: 10,
    currentCount: 7,
    status: "Active"
  },
  {
    id: "mission_lights",
    title: "Light the Night",
    description: "Report non-functional streetlights to help improve neighborhood safety.",
    xpReward: 200,
    targetCount: 5,
    currentCount: 4,
    status: "Active"
  },
  {
    id: "mission_park_cleanup",
    title: "Green Guardians",
    description: "Report trash collection overflows or park maintenance issues.",
    xpReward: 500,
    targetCount: 15,
    currentCount: 15,
    status: "Completed"
  }
];

export const INITIAL_ISSUES: CivicIssue[] = [
  {
    id: "issue_1",
    title: "Severe Asphalt Potholes on Highway",
    description: "Deep, jagged pothole craters right in the middle of the dual-lane Western Express Highway, forcing heavy traffic and motorcycles to swerve dangerously. It is about 15cm deep with exposed rebar base.",
    category: "Roads/Potholes",
    severity: "High",
    status: "Verifying",
    latitude: 19.0760,
    longitude: 72.8777,
    address: "Western Express Highway, Goregaon, Mumbai, Maharashtra 400063",
    reporterId: "user_seed_1",
    reporterName: "Marcus Vance",
    reportedAt: "2026-06-23T10:30:00Z",
    verificationsCount: 4,
    upvotes: 18,
    aiConfidence: 0.94,
    aiSummary: "Hazardous road defect detected. High probability of causing suspension damage, motorcycle balance loss, or active highway pileups.",
    responsibleDept: "Municipal Roads Authority",
    contactDetails: {
      phone: "+91 22 2262 0251",
      email: "roads.repair@mumbai.gov.in",
      office: "BMC Headquarters, Fort, Mumbai",
      website: "https://portal.mcgm.gov.in"
    },
    communityImpactScore: 82,
    aqi: 142,
    imageUrl: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "issue_2",
    title: "Dark Streetlamp Grid Intersections",
    description: "Three consecutive high-voltage streetlights are completely dead at this high-density intersection, leaving the main crosswalk in total darkness.",
    category: "Streetlights",
    severity: "Medium",
    status: "In Progress",
    latitude: 28.6139,
    longitude: 77.2090,
    address: "Outer Circle, Connaught Place, New Delhi, Delhi 110001",
    reporterId: "user_seed_2",
    reporterName: "Elena Rostova",
    reportedAt: "2026-06-22T21:15:00Z",
    verificationsCount: 6,
    upvotes: 24,
    aiConfidence: 0.89,
    aiSummary: "Safety visibility hazard identified. Elevated pedestrian vulnerability risks and nighttime security concerns.",
    responsibleDept: "Delhi Electricity Board",
    contactDetails: {
      phone: "+91 11 2341 5200",
      email: "streetlights@delhi.gov.in",
      office: "Electricity Secretariat, Connaught Place, New Delhi",
      website: "https://delhi.gov.in"
    },
    communityImpactScore: 65,
    aqi: 185,
    imageUrl: "https://images.unsplash.com/photo-1509024644558-2f56ce76c490?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "issue_3",
    title: "Severe Drainage Waterlogging & Sewer Leak",
    description: "Pressurized municipal stormwater pipe rupture causing black water to gush onto the main Ring Road sidewalk. Wastes water and creates extensive sludge pools across lanes.",
    category: "Water/Sanitation",
    severity: "High",
    status: "Reported",
    latitude: 12.9716,
    longitude: 77.5946,
    address: "Outer Ring Road, Bellandur, Bengaluru, Karnataka 560103",
    reporterId: "user_seed_3",
    reporterName: "Jared Pine",
    reportedAt: "2026-06-24T05:45:00Z",
    verificationsCount: 1,
    upvotes: 9,
    aiConfidence: 0.91,
    aiSummary: "Infrastructure fluid breach detected. High risk of local water contamination, vector-borne disease, and adjacent highway lane submergence.",
    responsibleDept: "Water Supply & Sewerage Board",
    contactDetails: {
      phone: "+91 80 2223 8888",
      email: "sewerage.complaint@bwssb.gov.in",
      office: "Cauvery Bhavan, KG Road, Bengaluru",
      website: "https://bwssb.karnataka.gov.in"
    },
    communityImpactScore: 78,
    aqi: 95,
    imageUrl: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "issue_4",
    title: "Overflowing Industrial Garbage Bin",
    description: "Commercial secondary waste containers overflowing onto the public walkway, emitting a pungent odor and inviting local rodents and stray animals.",
    category: "Trash/Litter",
    severity: "Low",
    status: "Resolved",
    latitude: 17.3850,
    longitude: 78.4867,
    address: "Madhapur Road, Hitec City, Hyderabad, Telangana 500081",
    reporterId: "user_seed_4",
    reporterName: "Lydia Lopez",
    reportedAt: "2026-06-20T14:10:00Z",
    verificationsCount: 8,
    upvotes: 32,
    aiConfidence: 0.82,
    aiSummary: "Sanitation guideline violation. Elevated local respiratory and biological containment concerns.",
    responsibleDept: "Waste Management Directorate",
    contactDetails: {
      phone: "+91 40 2322 5397",
      email: "sanitation@ghmc.gov.in",
      office: "GHMC Head Office, Tank Bund Road, Hyderabad",
      website: "https://ghmc.gov.in"
    },
    communityImpactScore: 40,
    aqi: 110,
    imageUrl: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "issue_5",
    title: "Malfunctioning Traffic Signals",
    description: "Both signals at the busy intersection are stuck on blinking red, causing gridlock and near-miss collisions for vehicles joining from side avenues.",
    category: "Other",
    severity: "Critical",
    status: "Reported",
    latitude: 13.0827,
    longitude: 80.2707,
    address: "Anna Salai Road, Chennai, Tamil Nadu 600002",
    reporterId: "user_seed_5",
    reporterName: "Rajesh Kumar",
    reportedAt: "2026-06-24T09:15:00Z",
    verificationsCount: 3,
    upvotes: 41,
    aiConfidence: 0.96,
    aiSummary: "Critical traffic regulatory failure. Active risk of high-speed vehicular collisions at major arterial junction.",
    responsibleDept: "City Traffic Police Command",
    contactDetails: {
      phone: "+91 44 2345 2500",
      email: "traffic@chennaipolice.gov.in",
      office: "Traffic Headquarters, Vepery, Chennai",
      website: "https://chennaipolice.gov.in"
    },
    communityImpactScore: 92,
    aqi: 125,
    imageUrl: "https://images.unsplash.com/photo-1510985223380-6927515b196f?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "issue_6",
    title: "Structural Flyover Expansion Joint Fissure",
    description: "Deep concrete crack spreading along the flyover approach pier. Chunks of structural masonry have fallen onto the lower service street.",
    category: "Roads/Potholes",
    severity: "Critical",
    status: "Verifying",
    latitude: 22.5726,
    longitude: 88.3639,
    address: "Howrah Bridge Approach Road, Kolkata, West Bengal 700001",
    reporterId: "user_seed_6",
    reporterName: "Sourav Das",
    reportedAt: "2026-06-24T11:00:00Z",
    verificationsCount: 5,
    upvotes: 55,
    aiConfidence: 0.98,
    aiSummary: "Structural load-bearing failure risk. Immediate engineering intervention required to prevent concrete spalling or structural collapse.",
    responsibleDept: "Public Works Department",
    contactDetails: {
      phone: "+91 33 2214 5110",
      email: "bridge.safety@pwdwb.gov.in",
      office: "Writers' Buildings, Kolkata",
      website: "https://pwd.wb.gov.in"
    },
    communityImpactScore: 96,
    aqi: 165,
    imageUrl: "https://images.unsplash.com/photo-1590483736148-3c1d58740211?auto=format&fit=crop&w=400&q=80"
  }
];
