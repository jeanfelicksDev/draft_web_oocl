"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { MARITIME_COUNTRIES, WORLD_PORTS_BY_COUNTRY } from "@/lib/world-ports-data";

interface LinkedPortSelectorProps {
    // Country (Port of Discharge)
    portCountryValue: string;   // Now holds the actual country name
    onPortCountryChange: (name: string) => void;

    // Port (Place of Delivery)
    portCityValue: string;      // Now holds the actual port name
    onPortCityChange: (name: string) => void;

    portCountryError?: string;
    portCityError?: string;
}

import { SearchableDropdown } from "./SearchableDropdown";

// ─── Main export ─────────────────────────────────────────────────────────────
export function LinkedPortSelector({
    portCountryValue,
    onPortCountryChange,
    portCityValue,
    onPortCityChange,
    portCountryError,
    portCityError,
}: LinkedPortSelectorProps) {

    // Available ports for the selected country
    const availablePorts = portCountryValue
        ? (WORLD_PORTS_BY_COUNTRY[portCountryValue] || [])
        : [];

    // When country is selected
    const handleCountrySelect = (countryName: string) => {
        onPortCountryChange(countryName);
        onPortCityChange(""); // Reset city when country changes
    };

    // When port is selected
    const handlePortSelect = (portName: string) => {
        onPortCityChange(portName);
    };

    return (
        <>
            <div style={{ position: "relative" }}>
                <SearchableDropdown
                    label="Port of Discharge *"
                    options={MARITIME_COUNTRIES}
                    value={portCountryValue}
                    onSelect={handleCountrySelect}
                    placeholder="Sélectionner un pays..."
                    error={portCountryError}
                />
            </div>

            <div style={{ position: "relative" }}>
                <SearchableDropdown
                    label="Place of Delivery *"
                    options={availablePorts}
                    value={portCityValue}
                    onSelect={handlePortSelect}
                    placeholder={portCountryValue ? "Sélectionner un port..." : "⬅ Choisir d'abord un pays"}
                    disabled={!portCountryValue}
                    error={portCityError}
                />
            </div>
        </>
    );
}
