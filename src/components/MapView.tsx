import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MapPin,
  Filter,
  CheckCircle,
  MessageSquare,
  ThumbsUp,
  Sparkles,
  Search,
  Activity,
  AlertTriangle,
  X,
  Plus,
  Key,
  ExternalLink,
  Map as MapIcon,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  AlertCircle,
  Phone,
  Mail,
  Clock,
  Building,
  Undo2,
  ListFilter,
  Flame,
  Layers,
  Award,
  Zap,
  Globe,
  CornerDownRight
} from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CivicIssue, IssueCategory, IssueSeverity, Comment, UserLocation } from "../types";
import CivicMap from "./CivicMap";
import AgenticCivicPanel from "./AgenticCivicPanel";



// Comprehensive State Civic Data Map matching our interlocking custom Indian SVG
export const STATES_CIVIC_DATA: { [id: string]: {
  id: string;
  name: string;
  healthScore: number;
  activeIssues: number;
  resolvedIssues: number;
  disasterForecasts: string[];
  densityByCategory: { [cat: string]: number };
  cities: { name: string; latitude: number; longitude: number; activeIssuesCount: number }[];
  path: string;
}} = {
  JK: {
    id: "JK",
    name: "Jammu & Kashmir / Ladakh",
    healthScore: 71,
    activeIssues: 6,
    resolvedIssues: 85,
    disasterForecasts: ["Avalanche road clearance alert on NH-44 sectors", "Sub-zero water main rupture forecast in Leh"],
    densityByCategory: { "Roads/Potholes": 3, "Streetlights": 1, "Water/Sanitation": 2, "Trash/Litter": 0, "Graffiti": 0, "Other": 0 },
    cities: [],
    path: "M 210,35 L 240,25 L 265,45 L 260,85 L 225,95 L 210,80 Z"
  },
  PH: {
    id: "PH",
    name: "Punjab / Haryana / HP",
    healthScore: 66,
    activeIssues: 9,
    resolvedIssues: 120,
    disasterForecasts: ["Heavy winter waterlogging on secondary highway tracks", "Aged canal wall seepage warnings"],
    densityByCategory: { "Roads/Potholes": 4, "Streetlights": 2, "Water/Sanitation": 2, "Trash/Litter": 1, "Graffiti": 0, "Other": 0 },
    cities: [],
    path: "M 195,95 L 210,80 L 225,95 L 245,95 L 255,120 L 225,145 L 195,125 Z"
  },
  DL: {
    id: "DL",
    name: "Delhi NCR",
    healthScore: 62,
    activeIssues: 24,
    resolvedIssues: 180,
    disasterForecasts: ["Connaught Place storm water logging during downpours", "High aerosol particulates and AQI alert flags"],
    densityByCategory: { "Roads/Potholes": 8, "Streetlights": 5, "Water/Sanitation": 6, "Trash/Litter": 3, "Graffiti": 1, "Other": 1 },
    cities: [
      { name: "New Delhi", latitude: 28.6139, longitude: 77.2090, activeIssuesCount: 24 }
    ],
    path: "M 235,130 L 245,130 L 245,140 L 235,140 Z" // Highlighted Capital block
  },
  RJ: {
    id: "RJ",
    name: "Rajasthan",
    healthScore: 65,
    activeIssues: 18,
    resolvedIssues: 155,
    disasterForecasts: ["Groundwater supply pressure drops in west desert towns", "High dust buildup causing photo-relay blockages"],
    densityByCategory: { "Roads/Potholes": 5, "Streetlights": 4, "Water/Sanitation": 4, "Trash/Litter": 3, "Graffiti": 1, "Other": 1 },
    cities: [
      { name: "Jaipur", latitude: 26.9124, longitude: 75.7873, activeIssuesCount: 18 }
    ],
    path: "M 145,155 L 195,125 L 225,145 L 215,190 L 165,220 L 130,215 Z"
  },
  GJ: {
    id: "GJ",
    name: "Gujarat",
    healthScore: 85,
    activeIssues: 11,
    resolvedIssues: 340,
    disasterForecasts: ["Grid thermal over-voltage risk in salt flats", "Expressway asphalt expansion fissure scans"],
    densityByCategory: { "Roads/Potholes": 2, "Streetlights": 2, "Water/Sanitation": 3, "Trash/Litter": 2, "Graffiti": 1, "Other": 1 },
    cities: [
      { name: "Ahmedabad", latitude: 23.0225, longitude: 72.5714, activeIssuesCount: 11 }
    ],
    path: "M 105,250 L 125,245 L 130,215 L 165,220 L 175,260 L 155,290 L 105,275 Z"
  },
  MP: {
    id: "MP",
    name: "Madhya Pradesh",
    healthScore: 63,
    activeIssues: 14,
    resolvedIssues: 162,
    disasterForecasts: ["Forest highway structural potholes advisory", "Water main pressure drop alert near central reservoir"],
    densityByCategory: { "Roads/Potholes": 6, "Streetlights": 3, "Water/Sanitation": 3, "Trash/Litter": 1, "Graffiti": 0, "Other": 1 },
    cities: [],
    path: "M 195,230 L 215,190 L 265,185 L 295,245 L 255,305 L 215,280 Z"
  },
  UP: {
    id: "UP",
    name: "Uttar Pradesh",
    healthScore: 52,
    activeIssues: 49,
    resolvedIssues: 280,
    disasterForecasts: ["Grid transformer thermal strain risk in east blocks", "Monsoon sub-grade river embankment washouts"],
    densityByCategory: { "Roads/Potholes": 18, "Streetlights": 10, "Water/Sanitation": 11, "Trash/Litter": 7, "Graffiti": 1, "Other": 2 },
    cities: [
      { name: "Noida", latitude: 28.5355, longitude: 77.3910, activeIssuesCount: 20 },
      { name: "Lucknow", latitude: 26.8467, longitude: 80.9462, activeIssuesCount: 29 }
    ],
    path: "M 225,145 L 255,120 L 265,185 L 295,235 L 345,180 L 295,135 Z"
  },
  BR_JH: {
    id: "BR_JH",
    name: "Bihar / Jharkhand",
    healthScore: 54,
    activeIssues: 25,
    resolvedIssues: 130,
    disasterForecasts: ["Ganges basin storm water drainage backlog warning", "Heavy rust fatigue reports in rural bridge joints"],
    densityByCategory: { "Roads/Potholes": 9, "Streetlights": 5, "Water/Sanitation": 6, "Trash/Litter": 4, "Graffiti": 0, "Other": 1 },
    cities: [],
    path: "M 295,235 L 335,230 L 365,250 L 405,225 L 405,200 L 395,185 L 345,180 Z"
  },
  WB: {
    id: "WB",
    name: "West Bengal",
    healthScore: 58,
    activeIssues: 31,
    resolvedIssues: 145,
    disasterForecasts: ["Howrah flyover joint concrete crack alert status", "Subterranean silt leakage in north sewer conduits"],
    densityByCategory: { "Roads/Potholes": 11, "Streetlights": 6, "Water/Sanitation": 8, "Trash/Litter": 4, "Graffiti": 1, "Other": 1 },
    cities: [
      { name: "Kolkata", latitude: 22.5726, longitude: 88.3639, activeIssuesCount: 31 }
    ],
    path: "M 390,230 L 405,225 L 395,185 L 420,195 L 415,270 L 395,275 Z"
  },
  CG: {
    id: "CG",
    name: "Chhattisgarh",
    healthScore: 66,
    activeIssues: 9,
    resolvedIssues: 92,
    disasterForecasts: ["Industrial water pollution runoff risk tracking"],
    densityByCategory: { "Roads/Potholes": 3, "Streetlights": 2, "Water/Sanitation": 2, "Trash/Litter": 1, "Graffiti": 0, "Other": 1 },
    cities: [],
    path: "M 265,245 L 295,245 L 285,315 L 255,305 Z"
  },
  OR: {
    id: "OR",
    name: "Odisha",
    healthScore: 70,
    activeIssues: 12,
    resolvedIssues: 115,
    disasterForecasts: ["Coastal storm sewer backwash risk indicator"],
    densityByCategory: { "Roads/Potholes": 4, "Streetlights": 3, "Water/Sanitation": 3, "Trash/Litter": 1, "Graffiti": 0, "Other": 1 },
    cities: [],
    path: "M 285,275 L 285,315 L 305,335 L 345,305 L 335,260 Z"
  },
  MH: {
    id: "MH",
    name: "Maharashtra",
    healthScore: 74,
    activeIssues: 38,
    resolvedIssues: 240,
    disasterForecasts: ["Western Express Highway asphalt fatigue and sinkholes", "Mumbai coastal storm flash logging risks"],
    densityByCategory: { "Roads/Potholes": 14, "Streetlights": 8, "Water/Sanitation": 7, "Trash/Litter": 5, "Graffiti": 2, "Other": 2 },
    cities: [
      { name: "Mumbai", latitude: 19.0760, longitude: 72.8777, activeIssuesCount: 28 },
      { name: "Pune", latitude: 18.5204, longitude: 73.8567, activeIssuesCount: 10 }
    ],
    path: "M 150,335 L 155,290 L 215,280 L 255,305 L 245,365 L 175,370 Z"
  },
  TG: {
    id: "TG",
    name: "Telangana",
    healthScore: 79,
    activeIssues: 19,
    resolvedIssues: 190,
    disasterForecasts: ["Grid pressure strain inside central IT clusters", "Storm water blockage advisory near Musi bank"],
    densityByCategory: { "Roads/Potholes": 5, "Streetlights": 4, "Water/Sanitation": 5, "Trash/Litter": 3, "Graffiti": 1, "Other": 1 },
    cities: [
      { name: "Hyderabad", latitude: 17.3850, longitude: 78.4867, activeIssuesCount: 19 }
    ],
    path: "M 215,340 L 225,375 L 265,355 L 255,310 Z"
  },
  KA: {
    id: "KA",
    name: "Karnataka",
    healthScore: 68,
    activeIssues: 42,
    resolvedIssues: 310,
    disasterForecasts: ["Bellandur lake foam overflow and structural drain blocks", "Outer Ring Road sewer line backlog warnings"],
    densityByCategory: { "Roads/Potholes": 16, "Streetlights": 9, "Water/Sanitation": 8, "Trash/Litter": 5, "Graffiti": 1, "Other": 3 },
    cities: [
      { name: "Bengaluru", latitude: 12.9716, longitude: 77.5946, activeIssuesCount: 42 }
    ],
    path: "M 165,405 L 175,370 L 215,365 L 225,410 L 210,470 L 180,445 Z"
  },
  AP: {
    id: "AP",
    name: "Andhra Pradesh",
    healthScore: 73,
    activeIssues: 14,
    resolvedIssues: 150,
    disasterForecasts: ["Coastal delta storm water escape failures"],
    densityByCategory: { "Roads/Potholes": 5, "Streetlights": 3, "Water/Sanitation": 3, "Trash/Litter": 2, "Graffiti": 0, "Other": 1 },
    cities: [],
    path: "M 215,365 L 225,410 L 245,435 L 275,395 L 285,325 L 255,305 Z"
  },
  KL: {
    id: "KL",
    name: "Kerala",
    healthScore: 82,
    activeIssues: 8,
    resolvedIssues: 175,
    disasterForecasts: ["Western Ghat road soil moisture destabilization advisories"],
    densityByCategory: { "Roads/Potholes": 2, "Streetlights": 1, "Water/Sanitation": 3, "Trash/Litter": 1, "Graffiti": 0, "Other": 1 },
    cities: [],
    path: "M 180,445 L 190,480 L 195,455 Z"
  },
  TN: {
    id: "TN",
    name: "Tamil Nadu",
    healthScore: 81,
    activeIssues: 15,
    resolvedIssues: 215,
    disasterForecasts: ["Coastal water logs during seasonal storm depression periods", "Main transit rail track heating warnings"],
    densityByCategory: { "Roads/Potholes": 3, "Streetlights": 3, "Water/Sanitation": 4, "Trash/Litter": 2, "Graffiti": 1, "Other": 2 },
    cities: [
      { name: "Chennai", latitude: 13.0827, longitude: 80.2707, activeIssuesCount: 15 }
    ],
    path: "M 190,495 L 195,455 L 225,410 L 245,435 L 225,495 Z"
  },
  NE: {
    id: "NE",
    name: "Northeast States",
    healthScore: 73,
    activeIssues: 5,
    resolvedIssues: 90,
    disasterForecasts: ["Hill track landslide warning indicators in high-grade lanes"],
    densityByCategory: { "Roads/Potholes": 2, "Streetlights": 1, "Water/Sanitation": 1, "Trash/Litter": 1, "Graffiti": 0, "Other": 0 },
    cities: [],
    path: "M 420,195 L 435,230 L 475,230 L 485,190 L 465,175 Z"
  }
};

// Responsible Authority Lookup
function getAuthorityDetails(category: IssueCategory, city: string) {
  const citySuffix = city ? `, ${city}` : "";
  switch (category) {
    case "Roads/Potholes":
      return {
        name: "Road Maintenance & Highways Department",
        contact: "+91 22 2493 5683",
        email: "road.repairs@state.gov.in",
        website: "https://state.gov.in/roads-and-repairs",
        officeHours: "09:30 AM - 06:00 PM (24/7 Dispatch)",
        officeLocation: `Central Maintenance Depot, Sector 4${citySuffix}`
      };
    case "Streetlights":
      return {
        name: "Electricity & Public Lighting Department",
        contact: "+91 11 2341 4000",
        email: "grid.safety@state.gov.in",
        website: "https://state.gov.in/power-outages",
        officeHours: "10:00 AM - 05:30 PM",
        officeLocation: `Power Grid Division, Sector 2${citySuffix}`
      };
    case "Water/Sanitation":
      return {
        name: "Water Supply & Storm Drainage Board",
        contact: "+91 80 2223 8888",
        email: "drainage.engineering@citywater.gov.in",
        website: "https://citywater.gov.in/drainage-status",
        officeHours: "24/7 Emergency Storm Team",
        officeLocation: `Water Works Center, Lane 12${citySuffix}`
      };
    case "Trash/Litter":
      return {
        name: "Municipal Waste & Sanitation Department",
        contact: "+91 40 2322 0000",
        email: "waste.clearance@citysanitation.gov.in",
        website: "https://citysanitation.gov.in/services",
        officeHours: "06:00 AM - 04:00 PM",
        officeLocation: `Southeastern Waste Resource Hub${citySuffix}`
      };
    default:
      return {
        name: "Municipal General Administration Office",
        contact: "1913 (Toll Free Line)",
        email: "civic.resolutions@city.gov.in",
        website: "https://city.gov.in/citizen-portal",
        officeHours: "09:30 AM - 05:00 PM",
        officeLocation: `City Hall Room 101, Main Block${citySuffix}`
      };
  }
}

function findStateCodeByName(name: string): string | null {
  if (!name) return null;
  const n = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (n.includes("jammu") || n.includes("kashmir") || n.includes("ladakh")) return "JK";
  if (n.includes("punjab") || n.includes("haryana") || n.includes("himachal") || n.includes("chandigarh")) return "PH";
  if (n.includes("delhi") || n.includes("nct")) return "DL";
  if (n.includes("rajasthan")) return "RJ";
  if (n.includes("gujarat") || n.includes("daman") || n.includes("diu") || n.includes("dadra") || n.includes("haveli")) return "GJ";
  if (n.includes("madhyapradesh")) return "MP";
  if (n.includes("uttarpradesh")) return "UP";
  if (n.includes("bihar") || n.includes("jharkhand")) return "BR_JH";
  if (n.includes("westbengal")) return "WB";
  if (n.includes("chhattisgarh")) return "CG";
  if (n.includes("odisha") || n.includes("orissa")) return "OR";
  if (n.includes("maharashtra")) return "MH";
  if (n.includes("telangana")) return "TG";
  if (n.includes("karnataka")) return "KA";
  if (n.includes("andhra")) return "AP";
  if (n.includes("kerala") || n.includes("lakshadweep")) return "KL";
  if (n.includes("tamilnadu") || n.includes("puducherry") || n.includes("pondicherry")) return "TN";
  if (
    n.includes("assam") || n.includes("meghalaya") || n.includes("tripura") ||
    n.includes("mizoram") || n.includes("manipur") || n.includes("nagaland") ||
    n.includes("arunachal") || n.includes("sikkim")
  ) {
    return "NE";
  }
  return null;
}



interface MapViewProps {
  issues: CivicIssue[];
  commentsMap: { [issueId: string]: Comment[] };
  onAddComment: (issueId: string, text: string) => void;
  onAddVerification: (issueId: string, comment?: string) => void;
  onUpvoteIssue: (issueId: string) => void;
  initialSelectedIssue?: CivicIssue | null;
  clearInitialSelectedIssue?: () => void;
  animateIssueId?: string | null;
  clearAnimateIssueId?: () => void;
  userLocation: UserLocation | null;
}

export default function MapView({
  issues,
  commentsMap,
  onAddComment,
  onAddVerification,
  onUpvoteIssue,
  initialSelectedIssue,
  clearInitialSelectedIssue,
  animateIssueId,
  clearAnimateIssueId,
  userLocation
}: MapViewProps) {
  // Navigation level: 1 = India, 2 = State, 3 = City
  const [level, setLevel] = useState<1 | 2 | 3>(1);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  // Search & Filter Panel States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<IssueCategory | "All">("All");
  const [selectedSeverity, setSelectedSeverity] = useState<IssueSeverity | "All">("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");

  const [selectedIssue, setSelectedIssue] = useState<CivicIssue | null>(null);
  const [commentText, setCommentText] = useState("");
  const [verificationComment, setVerificationComment] = useState("");
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [hoveredStateId, setHoveredStateId] = useState<string | null>(null);

  const activeStateData = selectedState ? STATES_CIVIC_DATA[selectedState] : null;

  // Aggregate issues dynamically based on geographic constraints
  const getCityIssues = (cityName: string) => {
    return issues.filter(issue => {
      const addr = issue.address.toLowerCase();
      const cityLower = cityName.toLowerCase();
      // Direct bounding check or keyword text fallback
      if (cityLower === "new delhi" && (Math.abs(issue.latitude - 28.6139) < 1 || addr.includes("delhi") || addr.includes("ncr"))) return true;
      if (cityLower === "mumbai" && (Math.abs(issue.latitude - 19.0760) < 1 || addr.includes("mumbai") || addr.includes("goregaon"))) return true;
      if (cityLower === "bengaluru" && (Math.abs(issue.latitude - 12.9716) < 1 || addr.includes("bengaluru") || addr.includes("bellandur"))) return true;
      if (cityLower === "hyderabad" && (Math.abs(issue.latitude - 17.3850) < 1 || addr.includes("hyderabad") || addr.includes("hitec"))) return true;
      if (cityLower === "chennai" && (Math.abs(issue.latitude - 13.0827) < 1 || addr.includes("chennai") || addr.includes("anna salai"))) return true;
      if (cityLower === "kolkata" && (Math.abs(issue.latitude - 22.5726) < 1 || addr.includes("kolkata") || addr.includes("howrah"))) return true;
      
      return addr.includes(cityLower);
    });
  };

  // State-wide aggregated active issue count
  const getStateIssuesCount = (stateCode: string) => {
    const sData = STATES_CIVIC_DATA[stateCode];
    if (!sData) return 0;
    if (sData.cities.length === 0) return sData.activeIssues; // Default back up count
    return sData.cities.reduce((acc, city) => acc + getCityIssues(city.name).length, 0);
  };

  // Filter calculation for Level 3
  const cityFilteredIssues = selectedCity ? getCityIssues(selectedCity).filter(issue => {
    const matchesSearch = issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          issue.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || issue.category === selectedCategory;
    const matchesSeverity = selectedSeverity === "All" || issue.severity === selectedSeverity;
    const matchesStatus = selectedStatus === "All" || issue.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesSeverity && matchesStatus;
  }) : [];

  // State for GeoJSON state boundaries
  const [geojsonData, setGeojsonData] = useState<any>(null);

  // Helper to generate approximate state boundary polygons for India states as fallback
  const generateFallbackGeoJSON = () => {
    const states = [
      { name: "Jammu & Kashmir / Ladakh", code: "JK", lat: 33.7782, lng: 76.5762, radiusX: 2.2, radiusY: 1.8 },
      { name: "Punjab / Haryana / HP", code: "PH", lat: 31.1471, lng: 75.3412, radiusX: 1.2, radiusY: 1.2 },
      { name: "Delhi NCR", code: "DL", lat: 28.7041, lng: 77.1025, radiusX: 0.4, radiusY: 0.4 },
      { name: "Rajasthan", code: "RJ", lat: 27.0238, lng: 74.2179, radiusX: 2.5, radiusY: 2.5 },
      { name: "Gujarat", code: "GJ", lat: 22.2587, lng: 71.1924, radiusX: 2.0, radiusY: 1.8 },
      { name: "Madhya Pradesh", code: "MP", lat: 22.9734, lng: 78.6569, radiusX: 2.8, radiusY: 2.2 },
      { name: "Uttar Pradesh", code: "UP", lat: 26.8467, lng: 80.9462, radiusX: 2.8, radiusY: 1.8 },
      { name: "Bihar / Jharkhand", code: "BR_JH", lat: 25.0961, lng: 85.3131, radiusX: 1.8, radiusY: 1.2 },
      { name: "West Bengal", code: "WB", lat: 22.9868, lng: 87.8550, radiusX: 1.4, radiusY: 2.0 },
      { name: "Chhattisgarh", code: "CG", lat: 21.2787, lng: 81.8661, radiusX: 1.4, radiusY: 2.2 },
      { name: "Odisha", code: "OR", lat: 20.9517, lng: 83.3986, radiusX: 1.8, radiusY: 1.6 },
      { name: "Maharashtra", code: "MH", lat: 19.7515, lng: 75.7139, radiusX: 2.8, radiusY: 2.0 },
      { name: "Telangana", code: "TG", lat: 18.1124, lng: 79.0193, radiusX: 1.4, radiusY: 1.4 },
      { name: "Karnataka", code: "KA", lat: 15.3173, lng: 75.7139, radiusX: 1.6, radiusY: 2.2 },
      { name: "Tamil Nadu", code: "TN", lat: 11.1271, lng: 78.6569, radiusX: 1.4, radiusY: 1.8 },
      { name: "Kerala", code: "KL", lat: 10.8505, lng: 76.2711, radiusX: 0.8, radiusY: 1.8 }
    ];

    const features = states.map(state => {
      const points: [number, number][] = [];
      const numSides = 8;
      for (let i = 0; i < numSides; i++) {
        const angle = (i * 2 * Math.PI) / numSides;
        const lat = state.lat + state.radiusY * Math.sin(angle);
        const lng = state.lng + state.radiusX * Math.cos(angle);
        points.push([lng, lat]);
      }
      points.push(points[0]);

      return {
        type: "Feature",
        properties: {
          ST_NM: state.name,
          state_name: state.name,
          code: state.code
        },
        geometry: {
          type: "Polygon",
          coordinates: [points]
        }
      };
    });

    return {
      type: "FeatureCollection",
      features
    };
  };

  // Load India GeoJSON state boundaries on mount
  useEffect(() => {
    const geojsonUrl = "https://raw.githubusercontent.com/Anujarya30/Decisions_Clean_India/master/Anuj_Decisions_Clean_India/india_states.geojson";
    const backupUrl = "https://raw.githubusercontent.com/dheeraj-modi/India-GeoJSON/master/India-States.geojson";

    fetch(geojsonUrl)
      .then(res => {
        if (!res.ok) throw new Error("Primary geojson failed to load");
        return res.json();
      })
      .catch(err => {
        console.warn("Primary GeoJSON load failed, attempting backup URL:", err);
        return fetch(backupUrl).then(res => {
          if (!res.ok) throw new Error("Backup geojson failed to load");
          return res.json();
        });
      })
      .then(data => {
        setGeojsonData(data);
      })
      .catch(err => {
        console.warn("Failed to load India GeoJSON from URLs, activating local smart backup boundaries:", err);
        setGeojsonData(generateFallbackGeoJSON());
      });
  }, []);

  // Automated routing if initialSelectedIssue was passed
  useEffect(() => {
    if (initialSelectedIssue) {
      const lat = initialSelectedIssue.latitude;
      const lng = initialSelectedIssue.longitude;
      let targetCity = "New Delhi";
      let targetStateCode = "DL";

      if (Math.abs(lat - 19.0760) < 1 && Math.abs(lng - 72.8777) < 1) {
        targetCity = "Mumbai";
        targetStateCode = "MH";
      } else if (Math.abs(lat - 12.9716) < 1 && Math.abs(lng - 77.5946) < 1) {
        targetCity = "Bengaluru";
        targetStateCode = "KA";
      } else if (Math.abs(lat - 17.3850) < 1 && Math.abs(lng - 78.4867) < 1) {
        targetCity = "Hyderabad";
        targetStateCode = "TG";
      } else if (Math.abs(lat - 13.0827) < 1 && Math.abs(lng - 80.2707) < 1) {
        targetCity = "Chennai";
        targetStateCode = "TN";
      } else if (Math.abs(lat - 22.5726) < 1 && Math.abs(lng - 88.3639) < 1) {
        targetCity = "Kolkata";
        targetStateCode = "WB";
      }

      setSelectedState(targetStateCode);
      setSelectedCity(targetCity);
      setSelectedIssue(initialSelectedIssue);
      setLevel(3);

      if (clearInitialSelectedIssue) {
        clearInitialSelectedIssue();
      }
    }
  }, [initialSelectedIssue]);

  const getSeverityPinBg = (severity: IssueSeverity) => {
    switch (severity) {
      case "Critical": return "#ef4444";
      case "High": return "#f97316";
      case "Medium": return "#eab308";
      default: return "#06b6d4";
    }
  };

  const getSeverityPinBorder = (severity: IssueSeverity) => {
    switch (severity) {
      case "Critical": return "#7f1d1d";
      case "High": return "#7c2d12";
      case "Medium": return "#713f12";
      default: return "#164e63";
    }
  };

  const getSeverityBg = (severity: IssueSeverity) => {
    switch (severity) {
      case "Critical": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "High": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "Medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default: return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case "Resolved": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "In Progress": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "Verified": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "Verifying": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "Reported":
      case "Pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default: return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 65) return "text-amber-400";
    return "text-rose-500";
  };

  const getHealthFill = (score: number, isHovered: boolean) => {
    if (isHovered) {
      if (score >= 80) return "rgba(16, 185, 129, 0.45)";
      if (score >= 65) return "rgba(245, 158, 11, 0.45)";
      return "rgba(239, 68, 68, 0.45)";
    } else {
      if (score >= 80) return "rgba(16, 185, 129, 0.25)";
      if (score >= 65) return "rgba(245, 158, 11, 0.25)";
      return "rgba(239, 68, 68, 0.25)";
    }
  };

  const getHealthStroke = (score: number) => {
    if (score >= 80) return "#10b981";
    if (score >= 65) return "#f59e0b";
    return "#ef4545";
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue || !commentText.trim()) return;
    onAddComment(selectedIssue.id, commentText.trim());
    setCommentText("");
  };

  const handlePostVerification = () => {
    if (!selectedIssue) return;
    onAddVerification(selectedIssue.id, verificationComment.trim());
    setVerificationComment("");
    setShowVerificationModal(false);

    // Update locally selected issue state to render count bump immediately
    setSelectedIssue(prev => prev ? { ...prev, verificationsCount: prev.verificationsCount + 1 } : null);
  };

  const totalNationalIssuesCount = issues.length;
  const averageNationalHealthScore = Math.round(
    Object.values(STATES_CIVIC_DATA).reduce((sum, s) => sum + s.healthScore, 0) /
    Object.keys(STATES_CIVIC_DATA).length
  );

  return (
    <div id="civic-command-center" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative">
      {/* Visual cyber glow grids in back */}
      <div className="absolute top-[10%] right-[5%] w-[400px] h-[400px] bg-neon-purple/5 rounded-full filter blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[10%] left-[-5%] w-[350px] h-[350px] bg-neon-cyan/5 rounded-full filter blur-[120px] pointer-events-none"></div>

      {/* Dynamic Command Center Header / Level Selector */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6 mb-6">
        <div>
          <span className="text-xs font-mono text-neon-cyan tracking-widest uppercase flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-neon-cyan animate-pulse" />
            AI-Powered National Civic Command Center
          </span>
          <h1 className="font-display text-3xl font-extrabold text-white mt-1 flex items-center gap-2">
            Civic Intelligence Portal
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Real-time geospatial state hierarchy tracking. Seamless telemetry analysis across India sectors.
          </p>
        </div>

        {/* Tactical Breadcrumbs Navigation */}
        <div className="flex items-center gap-2 bg-white/[0.02] border border-white/10 px-4 py-2 rounded-xl text-xs font-mono">
          <button
            onClick={() => {
              setLevel(1);
              setSelectedState(null);
              setSelectedCity(null);
              setSelectedIssue(null);
            }}
            className={`transition-colors cursor-pointer ${level === 1 ? "text-neon-cyan font-bold" : "text-slate-400 hover:text-white"}`}
          >
            India Center
          </button>

          {(level >= 2 && activeStateData) && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <button
                onClick={() => {
                  setLevel(2);
                  setSelectedCity(null);
                  setSelectedIssue(null);
                }}
                className={`transition-colors cursor-pointer ${level === 2 ? "text-neon-cyan font-bold" : "text-slate-400 hover:text-white"}`}
              >
                {activeStateData.name}
              </button>
            </>
          )}

          {(level === 3 && selectedCity) && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-neon-purple font-bold">
                {selectedCity} Grid
              </span>
            </>
          )}
        </div>
      </div>

      {/* THREE LAYERS RENDERING SYSTEM */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Telemetry Widgets Panel (lg:span-4) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* LEVEL 1: NATIONAL DATA WIDGETS */}
          <AnimatePresence mode="wait">
            {level === 1 && (
              <motion.div
                key="widgets-level-1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* National Aggregates Block */}
                <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-4">
                  <h3 className="font-display text-sm font-bold text-white flex items-center gap-1.5 border-b border-white/5 pb-2 uppercase tracking-wide">
                    <Globe className="w-4 h-4 text-neon-cyan" />
                    India Telemetry Overview
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/[0.02] border border-white/5 p-3.5 rounded-xl text-center">
                      <span className="text-[10px] font-mono text-slate-500 uppercase">National Health Score</span>
                      <div className="text-2xl font-extrabold text-neon-cyan mt-1 font-mono">
                        {averageNationalHealthScore}%
                      </div>
                      <div className="text-[9px] font-mono text-emerald-400/80 mt-1">
                        Satisfactory Infrastructure
                      </div>
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 p-3.5 rounded-xl text-center">
                      <span className="text-[10px] font-mono text-slate-500 uppercase">Active National Issues</span>
                      <div className="text-2xl font-extrabold text-neon-purple mt-1 font-mono">
                        {totalNationalIssuesCount}
                      </div>
                      <div className="text-[9px] font-mono text-neon-purple/80 mt-1 animate-pulse">
                        ● Real-Time Alerts
                      </div>
                    </div>
                  </div>

                  {/* High Alert Region Radar Ticker */}
                  <div className="bg-rose-500/5 border border-rose-500/15 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-rose-400 font-bold text-[10px] uppercase font-mono mb-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Critical Hazard Zone Active
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Uttar Pradesh (Score: 52%) and Bihar (Score: 54%) report severe drainage/grid fatigue risks under monsoons.
                    </p>
                  </div>
                </div>

                {/* State Civic Performance Standings */}
                <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <h3 className="font-display text-xs font-bold text-slate-400 uppercase tracking-wide">
                      State Infrastructure Index
                    </h3>
                    <span className="text-[10px] font-mono text-neon-cyan">
                      Sorted Highest
                    </span>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {Object.values(STATES_CIVIC_DATA)
                      .sort((a, b) => b.healthScore - a.healthScore)
                      .map((st) => (
                        <div
                          key={st.id}
                          onClick={() => {
                            setSelectedState(st.id);
                            setLevel(2);
                          }}
                          onMouseEnter={() => setHoveredStateId(st.id)}
                          onMouseLeave={() => setHoveredStateId(null)}
                          className={`p-2.5 rounded-xl border flex justify-between items-center cursor-pointer transition-all ${
                            hoveredStateId === st.id
                              ? "bg-neon-cyan/5 border-neon-cyan"
                              : "bg-white/[0.01] border-white/5 hover:bg-white/[0.03] hover:border-white/10"
                          }`}
                        >
                          <div className="space-y-0.5">
                            <h5 className="font-display font-bold text-xs text-white">{st.name}</h5>
                            <span className="text-[9px] font-mono text-slate-500 block">
                              Active: {getStateIssuesCount(st.id)} | Resolved: {st.resolvedIssues}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className={`text-xs font-mono font-bold ${getHealthColor(st.healthScore)}`}>
                              {st.healthScore}%
                            </span>
                            <div className="text-[8px] font-mono text-slate-600 uppercase">Health</div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* LEVEL 2: STATE DATA WIDGETS */}
            {(level === 2 && activeStateData) && (
              <motion.div
                key="widgets-level-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* State Summary Panel */}
                <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] font-mono text-slate-500 uppercase">State Infrastructure Node</span>
                      <h3 className="font-display font-bold text-lg text-white">{activeStateData.name}</h3>
                    </div>
                    <button
                      onClick={() => {
                        setLevel(1);
                        setSelectedState(null);
                      }}
                      className="text-slate-500 hover:text-white p-1 rounded bg-white/5 border border-white/10 transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-mono"
                    >
                      <Undo2 className="w-3.5 h-3.5" /> Back
                    </button>
                  </div>

                  {/* State Stats Block */}
                  <div className="grid grid-cols-3 gap-2 py-2">
                    <div className="bg-white/[0.02] border border-white/5 p-2 rounded-lg text-center">
                      <span className="text-[8px] font-mono text-slate-500 block">HEALTH</span>
                      <span className={`text-sm font-extrabold font-mono ${getHealthColor(activeStateData.healthScore)}`}>
                        {activeStateData.healthScore}%
                      </span>
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 p-2 rounded-lg text-center">
                      <span className="text-[8px] font-mono text-slate-500 block">ACTIVE</span>
                      <span className="text-sm font-extrabold font-mono text-neon-purple">
                        {getStateIssuesCount(activeStateData.id)}
                      </span>
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 p-2 rounded-lg text-center">
                      <span className="text-[8px] font-mono text-slate-500 block">RESOLVED</span>
                      <span className="text-sm font-extrabold font-mono text-emerald-400">
                        {activeStateData.resolvedIssues}
                      </span>
                    </div>
                  </div>

                  {/* State Disaster Forecast List */}
                  <div className="space-y-2 border-t border-white/5 pt-3">
                    <h4 className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      State Disaster Forecasts
                    </h4>

                    {activeStateData.disasterForecasts.map((fc, idx) => (
                      <div key={idx} className="bg-rose-500/[0.02] border border-rose-500/10 p-2.5 rounded-lg flex items-start gap-2">
                        <Flame className="w-3.5 h-3.5 text-rose-500 flex-shrink-0 mt-0.5" />
                        <span className="text-[10px] text-slate-400 leading-normal font-sans">
                          {fc}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Heatmaps by Category Progress Bars */}
                <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
                  <h3 className="font-display text-xs font-bold text-slate-400 uppercase tracking-wide border-b border-white/5 pb-2 flex items-center gap-1">
                    <ListFilter className="w-4 h-4 text-neon-cyan" />
                    Heatmap Density by Category
                  </h3>

                  <div className="space-y-3">
                    {Object.entries(activeStateData.densityByCategory).map(([category, count]) => {
                      const total = Object.values(activeStateData.densityByCategory).reduce((a, b) => a + b, 0) || 1;
                      const percentage = Math.round((count / total) * 100);
                      
                      return (
                        <div key={category} className="space-y-1">
                          <div className="flex justify-between text-[10px] font-mono text-slate-400">
                            <span>{category}</span>
                            <span className="text-white font-bold">{count} reports</span>
                          </div>
                          
                          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-white/5">
                            <div 
                              className="bg-gradient-to-r from-neon-purple to-neon-cyan h-full rounded-full" 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* LEVEL 3: CITY FILTER SIDEBAR */}
            {(level === 3 && selectedCity) && (
              <motion.div
                key="widgets-level-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Search / Filters Interface */}
                <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <h3 className="font-display text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                      <Filter className="w-4 h-4 text-neon-purple" />
                      {selectedCity} Filters
                    </h3>
                    <button
                      onClick={() => {
                        setLevel(2);
                        setSelectedCity(null);
                        setSelectedIssue(null);
                      }}
                      className="text-slate-500 hover:text-white p-1 rounded bg-white/5 border border-white/10 transition-colors cursor-pointer flex items-center gap-1 text-[9px] font-mono"
                    >
                      <Undo2 className="w-3 h-3" /> State Overview
                    </button>
                  </div>

                  {/* Search Title / Location */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search title, street, reference..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/80 border border-white/10 text-[11px] text-white placeholder-slate-500 focus:border-neon-cyan outline-none"
                    />
                  </div>

                  {/* Category dropdown */}
                  <div className="grid grid-cols-1 gap-2.5">
                    <div>
                      <label className="block text-[8px] font-mono text-slate-500 uppercase mb-1">Category</label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-white/10 text-[10px] text-white outline-none focus:border-neon-cyan"
                      >
                        <option value="All">All Categories</option>
                        <option value="Roads/Potholes">Roads / Potholes</option>
                        <option value="Streetlights">Streetlights</option>
                        <option value="Water/Sanitation">Water / Sanitation</option>
                        <option value="Trash/Litter">Trash / Litter</option>
                        <option value="Graffiti">Graffiti</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[8px] font-mono text-slate-500 uppercase mb-1">Severity</label>
                      <select
                        value={selectedSeverity}
                        onChange={(e) => setSelectedSeverity(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-white/10 text-[10px] text-white outline-none focus:border-neon-cyan"
                      >
                        <option value="All">All Severities</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* City Active Issue List Panel */}
                <div className="glass-panel p-4 rounded-2xl border border-white/10 space-y-3">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <h4 className="font-display text-xs font-bold text-slate-400 uppercase tracking-wide">
                      Active Reports ({cityFilteredIssues.length})
                    </h4>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {cityFilteredIssues.length === 0 ? (
                      <p className="text-[10px] text-slate-500 italic p-4 text-center">No matching reports here.</p>
                    ) : (
                      cityFilteredIssues.map(issue => (
                        <div
                          key={issue.id}
                          onClick={() => setSelectedIssue(issue)}
                          className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                            selectedIssue?.id === issue.id
                              ? "bg-neon-purple/10 border-neon-purple"
                              : "bg-white/[0.01] border-white/5 hover:bg-white/[0.03] hover:border-white/10"
                          }`}
                        >
                          <h5 className="font-display font-bold text-xs text-white truncate">{issue.title}</h5>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className={`text-[8px] px-1 py-0.2 rounded font-mono ${getSeverityBg(issue.severity)}`}>
                              {issue.severity}
                            </span>
                            <span className="text-[9px] font-mono text-slate-500 truncate max-w-[150px]">
                              {issue.address}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Center Interactive Map Component Area (lg:span-5) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel rounded-2xl border border-white/10 h-[500px] overflow-hidden bg-slate-950 relative flex flex-col justify-between map-container-breathe">
            {/* Ambient cyber grid scan effect lines */}
            <div className="absolute inset-0 bg-space-grid opacity-[0.06] pointer-events-none z-0"></div>

            {/* Glowing Tactical Network overlay for Level 3 */}
            {level === 3 && cityFilteredIssues.length > 1 && (
              <div className="absolute inset-0 pointer-events-none z-10 opacity-30">
                <svg className="w-full h-full absolute inset-0">
                  <defs>
                    <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#a855f7" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8" />
                    </linearGradient>
                  </defs>
                  {/* Subtle decorative digital mesh vectors connecting center nodes */}
                  <line x1="20%" y1="30%" x2="50%" y2="60%" stroke="url(#glowGrad)" strokeWidth="1.5" strokeDasharray="5,5" className="animate-[pulse_3s_infinite]" />
                  <line x1="50%" y1="60%" x2="80%" y2="40%" stroke="url(#glowGrad)" strokeWidth="1.5" strokeDasharray="5,5" className="animate-[pulse_3s_infinite]" />
                  <circle cx="50%" cy="60%" r="3" fill="#06b6d4" className="animate-ping" />
                </svg>
              </div>
            )}

            <div className="flex-1 w-full h-full relative overflow-hidden bg-slate-950">
              <CivicMap
                issues={level === 3 ? cityFilteredIssues : issues}
                height="100%"
                onSelectIssue={setSelectedIssue}
                selectedIssue={selectedIssue}
                animateIssueId={animateIssueId}
                clearAnimateIssueId={clearAnimateIssueId}
                userLocation={userLocation}
                level={level}
                setLevel={setLevel}
                geojsonData={geojsonData}
                selectedState={selectedState}
                setSelectedState={setSelectedState}
                hoveredStateId={hoveredStateId}
                setHoveredStateId={setHoveredStateId}
                selectedCity={selectedCity}
                setSelectedCity={setSelectedCity}
                defaultLayers={{ markers: true, heatmap: false, aqi: false, risk: false }}
              />

              {/* LEVEL 1: Floating top notification */}
              {level === 1 && (
                <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center bg-slate-950/85 backdrop-blur-md border border-white/10 px-3.5 py-2 rounded-xl">
                  <span className="text-[10px] font-mono text-neon-cyan flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-neon-cyan animate-pulse" />
                    CLICK AN ACCURATE STATE POLYGON TO ZOOM SECTOR
                  </span>
                  <span className="text-[9px] font-mono text-slate-500">REAL GIS OVERLAY</span>
                </div>
              )}

              {/* LEVEL 2: Floating top notification */}
              {level === 2 && activeStateData && (
                <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center bg-slate-950/85 backdrop-blur-md border border-white/10 px-3.5 py-2 rounded-xl">
                  <span className="text-[10px] font-mono text-slate-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-neon-purple animate-pulse" />
                    STATE GEOMETRY ACCURED: <strong className="text-white font-bold">{activeStateData.name}</strong>
                  </span>
                  <button
                    onClick={() => {
                      setLevel(1);
                      setSelectedState(null);
                      setSelectedCity(null);
                      setSelectedIssue(null);
                    }}
                    className="text-[9px] font-mono text-neon-cyan hover:underline cursor-pointer"
                  >
                    OUT TO INDIA
                  </button>
                </div>
              )}

              {/* LEVEL 3: Floating top notification */}
              {level === 3 && selectedCity && (
                <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center bg-slate-950/85 backdrop-blur-md border border-white/10 px-3.5 py-2 rounded-xl">
                  <span className="text-[10px] font-mono text-slate-300 flex items-center gap-1.5">
                    <MapIcon className="w-3.5 h-3.5 text-neon-cyan animate-pulse" />
                    METRO GRID CHASSIS: <strong className="text-white font-bold">{selectedCity}</strong>
                  </span>
                  <button
                    onClick={() => {
                      setLevel(2);
                      setSelectedCity(null);
                      setSelectedIssue(null);
                    }}
                    className="text-[9px] font-mono text-neon-cyan hover:underline cursor-pointer"
                  >
                    UP TO STATE
                  </button>
                </div>
              )}

              {/* Floated Custom Hover Tooltip (Level 1 / 2) */}
              {(level === 1 || level === 2) && hoveredStateId && (
                <div className="absolute bottom-4 left-4 z-20 bg-slate-950/95 text-left border border-white/10 p-3 rounded-xl text-xs font-mono text-white shadow-2xl backdrop-blur-md max-w-[220px]">
                  <div className="font-bold text-white mb-1">
                    {STATES_CIVIC_DATA[hoveredStateId]?.name}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-[10px]">Index Score:</span>
                    <span className={`font-bold ${getHealthColor(STATES_CIVIC_DATA[hoveredStateId]?.healthScore)}`}>
                      {STATES_CIVIC_DATA[hoveredStateId]?.healthScore}%
                    </span>
                  </div>
                  <div className="text-[9px] text-slate-500 mt-1">
                    Active: {getStateIssuesCount(hoveredStateId)} | Resolved: {STATES_CIVIC_DATA[hoveredStateId]?.resolvedIssues}
                  </div>
                </div>
              )}

              {/* Level 2: No cities feedback */}
              {level === 2 && activeStateData && activeStateData.cities.length === 0 && (
                <div className="absolute bottom-4 right-4 z-20 bg-slate-950/95 text-center border border-white/10 p-3 rounded-xl text-[10px] font-mono text-slate-400 shadow-2xl backdrop-blur-md max-w-[200px]">
                  <AlertCircle className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                  <span className="text-white font-bold">RURAL TELEMETRY LOOP</span>
                  <p className="text-[8px] text-slate-500 mt-1 leading-normal">
                    This state uses generalized rural report indexing. No specific cities logged in metropolitan registry.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Active Inspection Details Panel (lg:span-3) */}
        <div className="lg:col-span-3">
          <div className="glass-panel p-5 rounded-2xl border border-white/10 h-[500px] flex flex-col justify-between overflow-y-auto relative">
            
            {/* Dynamic inspector output depending on selected state */}
            {level === 3 && selectedIssue ? (
              <div className="flex flex-col h-full justify-between space-y-4">
                
                {/* Title & Metadata */}
                <div>
                  <div className="flex justify-between items-start gap-1 border-b border-white/5 pb-2">
                    <div>
                      <span className="text-[8px] font-mono text-slate-500 uppercase">TELEMETRY ELEMENT</span>
                      <h3 className="font-display font-extrabold text-xs text-white mt-0.5">{selectedIssue.title}</h3>
                    </div>
                    <button
                      onClick={() => setSelectedIssue(null)}
                      className="text-slate-500 hover:text-white transition-all cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className={`px-1.5 py-0.2 rounded text-[8px] font-mono border ${getSeverityBg(selectedIssue.severity)}`}>
                      {selectedIssue.severity}
                    </span>
                    <span className={`px-1.5 py-0.2 rounded text-[8px] font-mono border ${getStatusBg(selectedIssue.status)}`}>
                      {selectedIssue.status === "Reported" ? "Pending" : selectedIssue.status}
                    </span>
                  </div>

                  {/* Physical Address */}
                  <div className="mt-3 flex items-start gap-1">
                    <MapPin className="w-3.5 h-3.5 text-neon-cyan flex-shrink-0 mt-0.5" />
                    <span className="text-[10px] text-slate-400 font-mono leading-tight">{selectedIssue.address}</span>
                  </div>

                  {/* Core Description block */}
                  <p className="text-slate-300 text-[11px] leading-relaxed mt-3 bg-slate-950/50 p-2.5 rounded-lg border border-white/5 font-sans">
                    {selectedIssue.description}
                  </p>

                  {/* INTEGRATED AUTHORITY DETAILS CARD */}
                  <div className="mt-3.5 border-t border-white/5 pt-3">
                    <div className="flex items-center gap-1.5 text-neon-cyan font-bold text-[9px] uppercase font-mono mb-2">
                      <Building className="w-3.5 h-3.5 text-neon-cyan animate-pulse" />
                      Smart Authority Contact Card
                    </div>

                    {(() => {
                      const auth = getAuthorityDetails(selectedIssue.category, selectedCity || "");
                      return (
                        <div className="bg-white/[0.01] border border-white/5 rounded-xl p-3 text-[10px] space-y-1.5 font-sans">
                          <p className="font-bold text-white flex items-center gap-1">
                            <CornerDownRight className="w-3 h-3 text-neon-cyan" />
                            {auth.name}
                          </p>
                          <div className="flex items-center gap-1 text-slate-400 font-mono text-[9px]">
                            <Phone className="w-3 h-3 text-slate-500" />
                            <span>{auth.contact}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-400 font-mono text-[9px] truncate">
                            <Mail className="w-3 h-3 text-slate-500" />
                            <span className="truncate">{auth.email}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-400 font-mono text-[9px]">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>{auth.officeHours}</span>
                          </div>
                          <div className="flex items-start gap-1 text-slate-500 font-mono text-[8px] leading-tight">
                            <MapPin className="w-3 h-3 text-slate-600 flex-shrink-0 mt-0.5" />
                            <span>{auth.officeLocation}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* AGENTIC AI CIVIC INTEL PANEL */}
                  <div className="mt-4">
                    <AgenticCivicPanel
                      issue={selectedIssue}
                      onVoteSuccess={(issueId, updatedIssue) => {
                        onAddVerification(issueId, "Real-time citizen verification poll response.");
                        setSelectedIssue(updatedIssue);
                      }}
                    />
                  </div>

                  {/* Citizen comments list inside inspector */}
                  <div className="mt-3.5 border-t border-white/5 pt-3 space-y-2">
                    <h5 className="text-[9px] font-mono text-slate-500 uppercase flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-neon-cyan" />
                      Community Comments ({commentsMap[selectedIssue.id]?.length || 0})
                    </h5>

                    <div className="space-y-1.5 max-h-24 overflow-y-auto mb-2 pr-1">
                      {(commentsMap[selectedIssue.id] || []).length === 0 ? (
                        <p className="text-[9px] text-slate-600 italic">No comments filed yet.</p>
                      ) : (
                        commentsMap[selectedIssue.id].map(comment => (
                          <div key={comment.id} className="bg-white/[0.01] p-1.5 rounded border border-white/5">
                            <div className="flex justify-between text-[8px] font-mono">
                              <span className="text-neon-cyan font-bold">{comment.userName}</span>
                              <span className="text-slate-600">{new Date(comment.createdAt).toLocaleTimeString()}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5">{comment.text}</p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Quick submit inline comment */}
                    <form onSubmit={handlePostComment} className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Add community note..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="flex-1 px-2.5 py-1 rounded-lg bg-slate-950 text-[10px] border border-white/10 text-white outline-none focus:border-neon-cyan"
                      />
                      <button
                        type="submit"
                        className="px-2 py-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg text-[9px] font-mono cursor-pointer"
                      >
                        Add
                      </button>
                    </form>
                  </div>
                </div>

                {/* Verification CTA & Upvoting bottom array */}
                <div className="flex gap-1.5 border-t border-white/5 pt-3">
                  <button
                    onClick={() => onUpvoteIssue(selectedIssue.id)}
                    className="flex-1 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-[10px] font-mono text-white flex items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    <ThumbsUp className="w-3.5 h-3.5 text-neon-cyan" />
                    Upvote ({selectedIssue.upvotes})
                  </button>
                  <button
                    onClick={() => setShowVerificationModal(true)}
                    className="flex-1 py-1.5 bg-gradient-to-r from-neon-purple to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-xl text-[10px] font-display font-bold text-white flex items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5 animate-pulse" />
                    Verify ({selectedIssue.verificationsCount})
                  </button>
                </div>

              </div>
            ) : (
              /* DEFAULT ACTIVE INTELLIGENCE REPORT FEED ON INACTIVE NODE */
              <div className="flex flex-col h-full justify-between">
                <div>
                  <h3 className="font-display text-xs font-bold text-slate-400 uppercase tracking-wide border-b border-white/5 pb-2 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-neon-cyan" />
                    National Disaster Feed
                  </h3>
                  
                  <div className="mt-3.5 space-y-3.5">
                    <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1">
                      <div className="flex justify-between items-center text-[8px] font-mono">
                        <span className="text-rose-500 font-bold uppercase flex items-center gap-0.5">
                          <AlertTriangle className="w-3 h-3 text-rose-500" /> Flood Risk High
                        </span>
                        <span className="text-slate-500">Karnataka (KA)</span>
                      </div>
                      <p className="text-[10px] text-slate-300 leading-snug">
                        Bellandur sector drainage structure failures reported. Water logged lanes forecast in next 48 hours.
                      </p>
                    </div>

                    <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1">
                      <div className="flex justify-between items-center text-[8px] font-mono">
                        <span className="text-amber-500 font-bold uppercase flex items-center gap-0.5">
                          <Flame className="w-3 h-3 text-amber-500" /> Sub-grade fissure
                        </span>
                        <span className="text-slate-500">West Bengal (WB)</span>
                      </div>
                      <p className="text-[10px] text-slate-300 leading-snug">
                        Flyover approach concrete cracks reported at Howrah block. Local speed restrictions advised.
                      </p>
                    </div>

                    <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1">
                      <div className="flex justify-between items-center text-[8px] font-mono">
                        <span className="text-amber-400 font-bold uppercase flex items-center gap-0.5">
                          <Zap className="w-3 h-3 text-amber-400" /> Grid Strain Medium
                        </span>
                        <span className="text-slate-500">Uttar Pradesh (UP)</span>
                      </div>
                      <p className="text-[10px] text-slate-300 leading-snug">
                        Over-heat transformer risks detected in eastern suburbs. Partial black-outs anticipated.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950/60 border border-white/5 p-3 rounded-xl text-center space-y-1.5 mt-4">
                  <Award className="w-5 h-5 text-neon-cyan mx-auto animate-pulse" />
                  <p className="text-[9px] font-mono text-slate-400 leading-normal">
                    Select any specific metropolitan city and click on an active issue pin to inspect resident reports, submit verifications, and draft AI complaints.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* VERIFICATION DIALOG MODAL IF ACTIVE */}
      <AnimatePresence>
        {showVerificationModal && selectedIssue && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md glass-panel p-6 rounded-2xl border border-white/10 space-y-4"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <h3 className="font-display font-bold text-sm text-white flex items-center gap-1.5">
                  <CheckCircle className="w-5 h-5 text-neon-cyan animate-pulse" />
                  Resident Verification Terminal
                </h3>
                <button
                  onClick={() => setShowVerificationModal(false)}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                By clicking commit, you declare to municipal authorities that this infrastructural issue is active in your district. You will be awarded <span className="text-amber-400 font-bold">+25 Citizen XP!</span>
              </p>

              <div>
                <label className="block text-[8px] font-mono text-slate-500 uppercase mb-1.5">Verification Note</label>
                <textarea
                  rows={3}
                  value={verificationComment}
                  onChange={(e) => setVerificationComment(e.target.value)}
                  placeholder="e.g. Verified this is still active. Pavement is heavily waterlogged."
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs resize-none bg-slate-950 text-white border border-white/10 outline-none focus:border-neon-cyan"
                ></textarea>
              </div>

              <div className="flex gap-2.5 justify-end pt-2">
                <button
                  onClick={() => setShowVerificationModal(false)}
                  className="px-4 py-2 border border-white/5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-mono transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePostVerification}
                  className="px-5 py-2 bg-gradient-to-r from-neon-purple to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl text-xs font-display font-bold transition-all cursor-pointer"
                >
                  Commit Verification
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
