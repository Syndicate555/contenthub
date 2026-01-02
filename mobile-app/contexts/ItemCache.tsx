import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Item } from '../types';

interface ItemCacheContextType {
  getItem: (id: string) => Item | undefined;
  setItems: (items: Item[]) => void;
  addItems: (items: Item[]) => void;
  updateItem: (id: string, updates: Partial<Item>) => void;
  removeItem: (id: string) => void;
}

const ItemCacheContext = createContext<ItemCacheContextType | null>(null);

export function ItemCacheProvider({ children }: { children: ReactNode }) {
  const [cache, setCache] = useState<Map<string, Item>>(new Map());

  const getItem = useCallback((id: string): Item | undefined => {
    return cache.get(id);
  }, [cache]);

  const setItems = useCallback((items: Item[]) => {
    const newCache = new Map<string, Item>();
    items.forEach(item => {
      newCache.set(item.id, item);
    });
    setCache(newCache);
  }, []);

  const addItems = useCallback((items: Item[]) => {
    setCache(prev => {
      const newCache = new Map(prev);
      items.forEach(item => {
        newCache.set(item.id, item);
      });
      return newCache;
    });
  }, []);

  const updateItem = useCallback((id: string, updates: Partial<Item>) => {
    setCache(prev => {
      const newCache = new Map(prev);
      const existing = newCache.get(id);
      if (existing) {
        newCache.set(id, { ...existing, ...updates });
      }
      return newCache;
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setCache(prev => {
      const newCache = new Map(prev);
      newCache.delete(id);
      return newCache;
    });
  }, []);

  return (
    <ItemCacheContext.Provider value={{ getItem, setItems, addItems, updateItem, removeItem }}>
      {children}
    </ItemCacheContext.Provider>
  );
}

export function useItemCache() {
  const context = useContext(ItemCacheContext);
  if (!context) {
    throw new Error('useItemCache must be used within an ItemCacheProvider');
  }
  return context;
}
