"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { api } from "@/lib/api-client";
import type { Property } from "@cms-pwa/shared-types";

interface PropertyContextValue {
  properties: Property[];
  current: Property | null;
  setCurrentId: (id: string) => void;
  loading: boolean;
  refresh: () => void;
}

const PropertyContext = createContext<PropertyContextValue | null>(null);
const STORAGE_KEY = "cms_current_property_id";

export function PropertyProvider({ children }: { children: React.ReactNode }) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProperties = () =>
    api
      .get<Property[]>("/properties")
      .then((props) => {
        setProperties(props);
        const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
        const initial = props.find((p) => p.id === stored) || props[0] || null;
        if (initial) setCurrentId(initial.id);
      })
      .catch(() => setProperties([]))
      .finally(() => setLoading(false));

  useEffect(() => {
    fetchProperties();
  }, []);

  const load = () => {
    setLoading(true);
    fetchProperties();
  };

  const updateCurrentId = (id: string) => {
    setCurrentId(id);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, id);
  };

  const current = properties.find((p) => p.id === currentId) || null;

  return (
    <PropertyContext.Provider
      value={{ properties, current, setCurrentId: updateCurrentId, loading, refresh: load }}
    >
      {children}
    </PropertyContext.Provider>
  );
}

export function useProperty() {
  const ctx = useContext(PropertyContext);
  if (!ctx) throw new Error("useProperty must be used within PropertyProvider");
  return ctx;
}
