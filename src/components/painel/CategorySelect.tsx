import * as React from "react";
import { useGetCategories } from "@/modules/categories/hooks/use-get-categories";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CategorySelectProps {
  value?: string;
  onChange: (value: string) => void;
  type: string;
}

export function CategorySelect({ value, onChange, type }: CategorySelectProps) {
  const { data: categories, isLoading } = useGetCategories();

  // Filtra categorias pelo tipo
  const filteredCategories = React.useMemo(() => {
    if (!categories) return [];
    return categories.filter((c: any) => c.type.toLowerCase() === type.toLowerCase());
  }, [categories, type]);

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Categoria
      </label>
      <Select value={value} onValueChange={onChange} disabled={isLoading}>
        <SelectTrigger className="glass-input h-12 w-full rounded-xl border-none bg-white/5 px-4 focus:ring-1 focus:ring-white/20">
          <SelectValue placeholder={isLoading ? "Carregando..." : "Selecione uma categoria"} />
        </SelectTrigger>
        <SelectContent className="glass-card border-white/10 bg-surface/95 backdrop-blur-xl">
          {filteredCategories.length === 0 && !isLoading && (
            <div className="p-2 text-sm text-muted-foreground text-center">
              Nenhuma categoria encontrada
            </div>
          )}
          {filteredCategories.map((category: any) => (
            <SelectItem 
              key={category.id} 
              value={category.id}
              className="focus:bg-white/10 focus:text-foreground"
            >
              <div className="flex items-center gap-2">
                {category.color && (
                  <div 
                    className="h-2 w-2 rounded-full" 
                    style={{ backgroundColor: category.color }} 
                  />
                )}
                {category.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
