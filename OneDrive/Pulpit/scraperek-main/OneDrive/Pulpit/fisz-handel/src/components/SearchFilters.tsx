import { useState } from 'react';
import { SlidersHorizontal, X, ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import PolandMap, { voivodeships } from '@/components/PolandMap';

const conditions = ['nowy', 'jak nowy', 'dobry', 'używany'] as const;
const locationNames = voivodeships.map((v) => v.name).sort();

export type SortOption = 'newest' | 'oldest' | 'price-asc' | 'price-desc';

export interface Filters {
  search: string;
  priceMin: number;
  priceMax: number;
  conditions: string[];
  location: string | null;
  sort: SortOption;
}

export const defaultFilters: Filters = {
  search: '',
  priceMin: 0,
  priceMax: 10000,
  conditions: [],
  location: null,
  sort: 'newest',
};

interface SearchFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

const sortLabels: Record<SortOption, string> = {
  newest: 'Najnowsze',
  oldest: 'Najstarsze',
  'price-asc': 'Cena: rosnąco',
  'price-desc': 'Cena: malejąco',
};

const SearchFilters = ({ filters, onChange }: SearchFiltersProps) => {
  const [expanded, setExpanded] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const activeCount = [
    filters.priceMin > 0 || filters.priceMax < 10000,
    filters.conditions.length > 0,
    filters.location !== null,
    filters.sort !== 'newest',
  ].filter(Boolean).length;

  const toggleCondition = (c: string) => {
    const next = filters.conditions.includes(c)
      ? filters.conditions.filter((x) => x !== c)
      : [...filters.conditions, c];
    onChange({ ...filters, conditions: next });
  };

  const reset = () => onChange({ ...defaultFilters, search: filters.search });

  return (
    <div className="space-y-3">
      {/* Toggle bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant={expanded ? 'default' : 'outline'}
          size="sm"
          className="gap-2"
          onClick={() => setExpanded(!expanded)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtry
          {activeCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full">
              {activeCount}
            </Badge>
          )}
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </Button>

        <Button
          variant={showMap ? 'default' : 'outline'}
          size="sm"
          className="gap-2"
          onClick={() => setShowMap(!showMap)}
        >
          <MapPin className="h-4 w-4" />
          Mapa
          {filters.location && (
            <Badge variant="secondary" className="ml-1 text-xs rounded-full px-1.5">
              1
            </Badge>
          )}
        </Button>

        {/* Sort */}
        <Select
          value={filters.sort}
          onValueChange={(v) => onChange({ ...filters, sort: v as SortOption })}
        >
          <SelectTrigger className="w-[180px] h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(sortLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={reset} className="gap-1 text-muted-foreground">
            <X className="h-3 w-3" /> Wyczyść
          </Button>
        )}
      </div>

      {/* Map */}
      {showMap && (
        <div className="p-4 rounded-xl border border-border/60 bg-card animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Wybierz województwo
            </h3>
            {filters.location && (
              <button
                onClick={() => onChange({ ...filters, location: null })}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Wyczyść wybór
              </button>
            )}
          </div>
          <PolandMap
            selected={filters.location}
            onSelect={(loc) => onChange({ ...filters, location: loc })}
          />
        </div>
      )}

      {/* Expanded filters */}
      {expanded && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl border bg-card animate-in slide-in-from-top-2 duration-200">
          {/* Price range */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Cena (zł)</label>
            <Slider
              min={0}
              max={10000}
              step={50}
              value={[filters.priceMin, filters.priceMax]}
              onValueChange={([min, max]) => onChange({ ...filters, priceMin: min, priceMax: max })}
            />
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Od"
                value={filters.priceMin || ''}
                onChange={(e) => onChange({ ...filters, priceMin: Number(e.target.value) || 0 })}
                className="h-8 text-sm"
              />
              <Input
                type="number"
                placeholder="Do"
                value={filters.priceMax || ''}
                onChange={(e) => onChange({ ...filters, priceMax: Number(e.target.value) || 10000 })}
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* Condition */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Stan</label>
            <div className="flex flex-wrap gap-2">
              {conditions.map((c) => (
                <button
                  key={c}
                  onClick={() => toggleCondition(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    filters.conditions.includes(c)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-secondary text-muted-foreground border-border hover:bg-accent'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Location dropdown */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Województwo</label>
            <Select
              value={filters.location ?? 'all'}
              onValueChange={(v) => onChange({ ...filters, location: v === 'all' ? null : v })}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Wszystkie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie</SelectItem>
                {locationNames.map((l) => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchFilters;
