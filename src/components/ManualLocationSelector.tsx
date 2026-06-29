import React, { useState, useEffect, useMemo } from "react";
import { Country, State, City } from "country-state-city";
import { Search, MapPin, Globe, ChevronDown, Check, Edit2, Plus, CornerDownRight } from "lucide-react";
import { UserLocation } from "../types";

interface ManualLocationSelectorProps {
  onLocationSelected: (location: UserLocation) => void;
  initialLocation?: UserLocation | null;
}

export default function ManualLocationSelector({ onLocationSelected, initialLocation }: ManualLocationSelectorProps) {
  // All countries
  const countries = useMemo(() => Country.getAllCountries(), []);

  // Selection states
  const [countrySearch, setCountrySearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<{ isoCode: string; name: string } | null>(null);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  const [stateSearch, setStateSearch] = useState("");
  const [selectedState, setSelectedState] = useState<{ isoCode: string; name: string } | null>(null);
  const [isManualState, setIsManualState] = useState(false);
  const [manualStateInput, setManualStateInput] = useState("");
  const [showStateDropdown, setShowStateDropdown] = useState(false);

  const [citySearch, setCitySearch] = useState("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [isManualCity, setIsManualCity] = useState(false);
  const [manualCityInput, setManualCityInput] = useState("");
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  const [locality, setLocality] = useState(initialLocation?.locality || "Central District");
  const [pincode, setPincode] = useState(initialLocation?.pincode || "");

  // Load initial location if provided
  useEffect(() => {
    if (initialLocation) {
      const matchCountry = countries.find(c => c.name.toLowerCase() === initialLocation.country?.toLowerCase());
      if (matchCountry) {
        setSelectedCountry({ isoCode: matchCountry.isoCode, name: matchCountry.name });
        
        const states = State.getStatesOfCountry(matchCountry.isoCode);
        const matchState = states.find(s => s.name.toLowerCase() === initialLocation.state?.toLowerCase());
        if (matchState) {
          setSelectedState({ isoCode: matchState.isoCode, name: matchState.name });
          
          const cities = City.getCitiesOfState(matchCountry.isoCode, matchState.isoCode);
          const matchCity = cities.find(c => c.name.toLowerCase() === initialLocation.city?.toLowerCase());
          if (matchCity) {
            setSelectedCity(matchCity.name);
            setIsManualCity(false);
          } else {
            setIsManualCity(true);
            setManualCityInput(initialLocation.city || "");
          }
        } else if (initialLocation.state) {
          setIsManualState(true);
          setManualStateInput(initialLocation.state);
          setIsManualCity(true);
          setManualCityInput(initialLocation.city || "");
        }
      }
    }
  }, [initialLocation, countries]);

  // Derived lists
  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return countries;
    return countries.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()));
  }, [countries, countrySearch]);

  const countryStates = useMemo(() => {
    if (!selectedCountry) return [];
    return State.getStatesOfCountry(selectedCountry.isoCode);
  }, [selectedCountry]);

  const filteredStates = useMemo(() => {
    if (!stateSearch.trim()) return countryStates;
    return countryStates.filter(s => s.name.toLowerCase().includes(stateSearch.toLowerCase()));
  }, [countryStates, stateSearch]);

  const stateCities = useMemo(() => {
    if (!selectedCountry || !selectedState || isManualState) return [];
    return City.getCitiesOfState(selectedCountry.isoCode, selectedState.isoCode);
  }, [selectedCountry, selectedState, isManualState]);

  const filteredCities = useMemo(() => {
    if (!citySearch.trim()) return stateCities;
    return stateCities.filter(c => c.name.toLowerCase().includes(citySearch.toLowerCase()));
  }, [stateCities, citySearch]);

  // Handle Country selection
  const handleSelectCountry = (country: { isoCode: string; name: string }) => {
    setSelectedCountry(country);
    setCountrySearch("");
    setShowCountryDropdown(false);

    // Reset children
    setSelectedState(null);
    setIsManualState(false);
    setManualStateInput("");
    setStateSearch("");

    setSelectedCity("");
    setIsManualCity(false);
    setManualCityInput("");
    setCitySearch("");
  };

  // Handle State selection
  const handleSelectState = (state: { isoCode: string; name: string }) => {
    setSelectedState(state);
    setIsManualState(false);
    setManualStateInput("");
    setStateSearch("");
    setShowStateDropdown(false);

    // Reset city
    setSelectedCity("");
    setIsManualCity(false);
    setManualCityInput("");
    setCitySearch("");
  };

  // Handle manual state choice
  const handleUseManualState = () => {
    setIsManualState(true);
    setSelectedState({ isoCode: "CUSTOM", name: manualStateInput || "Manual State" });
    setShowStateDropdown(false);
    
    // Reset city
    setSelectedCity("");
    setIsManualCity(true);
    setManualCityInput("");
    setCitySearch("");
  };

  // Handle City selection
  const handleSelectCity = (cityName: string) => {
    setSelectedCity(cityName);
    setIsManualCity(false);
    setManualCityInput("");
    setCitySearch("");
    setShowCityDropdown(false);
  };

  // Handle manual city selection
  const handleUseManualCity = () => {
    setIsManualCity(true);
    setSelectedCity("CUSTOM");
    setShowCityDropdown(false);
  };

  // Confirm and assemble UserLocation object
  const handleConfirm = () => {
    if (!selectedCountry) return;

    const countryName = selectedCountry.name;
    const stateName = isManualState ? manualStateInput : (selectedState?.name || "");
    const cityName = isManualCity ? manualCityInput : selectedCity;

    if (!cityName.trim()) return;

    // Estimate coordinates based on selection
    let lat = 20.5937; // Default global/India center fallback
    let lng = 78.9629;

    if (!isManualCity && selectedCountry && selectedState && cityName) {
      // Try to find the city's coordinates
      const citiesOfState = City.getCitiesOfState(selectedCountry.isoCode, selectedState.isoCode);
      const foundCity = citiesOfState.find(c => c.name === cityName);
      if (foundCity && foundCity.latitude && foundCity.longitude) {
        lat = parseFloat(foundCity.latitude);
        lng = parseFloat(foundCity.longitude);
      } else if (selectedState.isoCode !== "CUSTOM") {
        // Fallback to State coordinates
        const statesOfCountry = State.getStatesOfCountry(selectedCountry.isoCode);
        const foundState = statesOfCountry.find(s => s.isoCode === selectedState.isoCode);
        if (foundState && foundState.latitude && foundState.longitude) {
          lat = parseFloat(foundState.latitude);
          lng = parseFloat(foundState.longitude);
        }
      }
    } else if (selectedCountry) {
      // Fallback to Country coordinates
      const foundCountry = countries.find(c => c.isoCode === selectedCountry.isoCode);
      if (foundCountry && foundCountry.latitude && foundCountry.longitude) {
        lat = parseFloat(foundCountry.latitude);
        lng = parseFloat(foundCountry.longitude);
      }
    }

    const finalLocation: UserLocation = {
      latitude: lat,
      longitude: lng,
      city: cityName,
      state: stateName,
      locality: locality || "Central District",
      pincode: pincode || undefined,
      country: countryName,
      source: "manual"
    };

    onLocationSelected(finalLocation);
  };

  const isFormValid = useMemo(() => {
    if (!selectedCountry) return false;
    const hasState = isManualState ? manualStateInput.trim().length > 0 : !!selectedState;
    if (!hasState) return false;
    const hasCity = isManualCity ? manualCityInput.trim().length > 0 : !!selectedCity;
    return hasCity;
  }, [selectedCountry, isManualState, manualStateInput, selectedState, isManualCity, manualCityInput, selectedCity]);

  return (
    <div className="space-y-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-left">
      
      {/* 1. Country Selector */}
      <div className="relative">
        <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
          <Globe className="w-3.5 h-3.5 text-neon-cyan" /> Country *
        </label>
        
        <button
          type="button"
          onClick={() => {
            setShowCountryDropdown(!showCountryDropdown);
            setShowStateDropdown(false);
            setShowCityDropdown(false);
          }}
          className="w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 hover:border-neon-cyan/40 text-left text-sm text-white font-medium flex items-center justify-between transition-all"
        >
          <span className="truncate">{selectedCountry ? selectedCountry.name : "Select Country..."}</span>
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        </button>

        {showCountryDropdown && (
          <div className="absolute z-[100] mt-1 w-full rounded-xl border border-white/10 bg-slate-950 p-2 shadow-2xl backdrop-blur-xl max-h-60 overflow-y-auto">
            <div className="relative mb-2">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search country..."
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-xs focus:outline-none focus:border-neon-cyan/60 text-white"
                autoFocus
              />
            </div>
            <div className="space-y-0.5">
              {filteredCountries.length > 0 ? (
                filteredCountries.map((c) => (
                  <button
                    key={c.isoCode}
                    type="button"
                    onClick={() => handleSelectCountry({ isoCode: c.isoCode, name: c.name })}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-white/[0.05] flex items-center justify-between ${
                      selectedCountry?.isoCode === c.isoCode ? "text-neon-cyan bg-neon-cyan/5" : "text-slate-300"
                    }`}
                  >
                    <span className="truncate">{c.name}</span>
                    {selectedCountry?.isoCode === c.isoCode && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                ))
              ) : (
                <div className="text-[10px] text-slate-500 font-mono text-center py-2">No countries found</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. State Selector */}
      {selectedCountry && (
        <div className="relative">
          <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-neon-purple" /> State / Province *
          </label>

          {isManualState ? (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type State/Province..."
                value={manualStateInput}
                onChange={(e) => {
                  setManualStateInput(e.target.value);
                  setSelectedState({ isoCode: "CUSTOM", name: e.target.value });
                }}
                className="flex-grow px-4 py-2 rounded-xl bg-slate-900/60 border border-white/10 focus:border-neon-purple/60 text-sm focus:outline-none text-white"
              />
              <button
                type="button"
                onClick={() => {
                  setIsManualState(false);
                  setSelectedState(null);
                  setManualStateInput("");
                }}
                className="px-3 rounded-xl bg-white/5 border border-white/10 text-xs hover:bg-white/10 text-slate-300 font-mono"
              >
                List
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setShowStateDropdown(!showStateDropdown);
                setShowCountryDropdown(false);
                setShowCityDropdown(false);
              }}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 hover:border-neon-purple/40 text-left text-sm text-white font-medium flex items-center justify-between transition-all"
            >
              <span className="truncate">{selectedState ? selectedState.name : "Select State/Province..."}</span>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            </button>
          )}

          {showStateDropdown && !isManualState && (
            <div className="absolute z-[99] mt-1 w-full rounded-xl border border-white/10 bg-slate-950 p-2 shadow-2xl backdrop-blur-xl max-h-60 overflow-y-auto">
              <div className="relative mb-2 flex gap-2">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search state..."
                    value={stateSearch}
                    onChange={(e) => setStateSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-xs focus:outline-none focus:border-neon-purple/60 text-white"
                    autoFocus
                  />
                </div>
              </div>
              <div className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsManualState(true);
                    setSelectedState({ isoCode: "CUSTOM", name: "" });
                    setShowStateDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs bg-neon-purple/10 border border-neon-purple/20 text-neon-purple hover:bg-neon-purple/20 flex items-center gap-1.5 mb-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Type state name manually...</span>
                </button>
                {filteredStates.length > 0 ? (
                  filteredStates.map((s) => (
                    <button
                      key={s.isoCode}
                      type="button"
                      onClick={() => handleSelectState({ isoCode: s.isoCode, name: s.name })}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-white/[0.05] flex items-center justify-between ${
                        selectedState?.isoCode === s.isoCode ? "text-neon-purple bg-neon-purple/5" : "text-slate-300"
                      }`}
                    >
                      <span className="truncate">{s.name}</span>
                      {selectedState?.isoCode === s.isoCode && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  ))
                ) : (
                  <div className="text-[10px] text-slate-500 font-mono text-center py-2">No states found</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. City Selector */}
      {selectedCountry && (isManualState || selectedState) && (
        <div className="relative">
          <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <CornerDownRight className="w-3.5 h-3.5 text-emerald-400" /> City / Municipality *
          </label>

          {isManualCity ? (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type City..."
                value={manualCityInput}
                onChange={(e) => setManualCityInput(e.target.value)}
                className="flex-grow px-4 py-2 rounded-xl bg-slate-900/60 border border-white/10 focus:border-emerald-500/60 text-sm focus:outline-none text-white"
              />
              {!isManualState && (
                <button
                  type="button"
                  onClick={() => {
                    setIsManualCity(false);
                    setSelectedCity("");
                    setManualCityInput("");
                  }}
                  className="px-3 rounded-xl bg-white/5 border border-white/10 text-xs hover:bg-white/10 text-slate-300 font-mono"
                >
                  List
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setShowCityDropdown(!showCityDropdown);
                setShowCountryDropdown(false);
                setShowStateDropdown(false);
              }}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 hover:border-emerald-500/40 text-left text-sm text-white font-medium flex items-center justify-between transition-all"
            >
              <span className="truncate">{selectedCity ? selectedCity : "Select City..."}</span>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            </button>
          )}

          {showCityDropdown && !isManualCity && (
            <div className="absolute z-[98] mt-1 w-full rounded-xl border border-white/10 bg-slate-950 p-2 shadow-2xl backdrop-blur-xl max-h-60 overflow-y-auto">
              <div className="relative mb-2">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search city..."
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-xs focus:outline-none focus:border-emerald-500/60 text-white"
                  autoFocus
                />
              </div>
              <div className="space-y-0.5">
                <button
                  type="button"
                  onClick={handleUseManualCity}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 flex items-center gap-1.5 mb-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Type city name manually...</span>
                </button>
                {filteredCities.length > 0 ? (
                  filteredCities.map((cityName) => (
                    <button
                      key={cityName.name}
                      type="button"
                      onClick={() => handleSelectCity(cityName.name)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-white/[0.05] flex items-center justify-between ${
                        selectedCity === cityName.name ? "text-emerald-400 bg-emerald-500/5" : "text-slate-300"
                      }`}
                    >
                      <span className="truncate">{cityName.name}</span>
                      {selectedCity === cityName.name && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  ))
                ) : (
                  <div className="text-[10px] text-slate-500 font-mono text-center py-2">No cities found</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Optional Locality & Pincode details */}
      {selectedCountry && (isManualState || selectedState) && (selectedCity || isManualCity) && (
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-[9px] font-mono text-slate-400 uppercase tracking-wider mb-1">
              Locality / District
            </label>
            <input
              type="text"
              placeholder="e.g. Downtown"
              value={locality}
              onChange={(e) => setLocality(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-slate-900/40 border border-white/5 focus:border-white/20 text-xs focus:outline-none text-white"
            />
          </div>
          <div>
            <label className="block text-[9px] font-mono text-slate-400 uppercase tracking-wider mb-1">
              Postal Code (Pincode)
            </label>
            <input
              type="text"
              placeholder="e.g. 10001"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-slate-900/40 border border-white/5 focus:border-white/20 text-xs focus:outline-none text-white"
            />
          </div>
        </div>
      )}

      {/* 5. Confirmation Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!isFormValid}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-purple disabled:from-slate-800 disabled:to-slate-900 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-display font-black text-xs uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-cyan-950/20 text-center"
        >
          Confirm Sentinel Location
        </button>
      </div>

    </div>
  );
}
