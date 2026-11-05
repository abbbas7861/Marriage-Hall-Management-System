import React, { useState, useEffect, useMemo } from 'react';
import {
  UtensilsCrossed,
  ChefHat,
  Plus,
  Coins,
  CheckCircle2,
  Trash2,
  Edit2,
  Search,
  Filter,
  Sparkles,
  DollarSign,
  TrendingUp,
  Clock,
  Layers,
  Crown,
  Briefcase,
  Wallet,
  X,
  FileText,
  AlertCircle,
  HelpCircle,
  Check,
} from 'lucide-react';
import { MenuPackage, Recipe, RecipeIngredient } from '../../types';
import { menuPackagesApi, recipesApi, pantryApi, PantryStockItem } from '../../api/client';

export const KitchenRecipeManager: React.FC = () => {
  const [packages, setPackages] = useState<MenuPackage[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [pantryIngredients, setPantryIngredients] = useState<PantryStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'packages' | 'recipes'>('packages');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [tierFilter, setTierFilter] = useState('All');

  // Recipe Builder Modal State
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [recipeForm, setRecipeForm] = useState({
    dishName: '',
    category: 'Rice & Biryani',
    servingYield: 100,
    prepTimeMinutes: 60,
    recommendedSalePrice: 1000,
    instructions: '',
    ingredients: [] as RecipeIngredient[],
  });

  // Package Modal State
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<MenuPackage | null>(null);
  const [packageForm, setPackageForm] = useState({
    name: '',
    tier: 'Executive' as 'Royal' | 'Executive' | 'Budget' | 'Corporate',
    pricePerHead: 2500,
    costPerHead: 1500,
    description: '',
    includedItems: [] as string[],
    status: 'Active' as 'Active' | 'Inactive',
  });
  const [newDishInput, setNewDishInput] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedPackages, fetchedRecipes, fetchedPantry] = await Promise.all([
        menuPackagesApi.list(),
        recipesApi.list(),
        pantryApi.listItems(),
      ]);
      setPackages(fetchedPackages);
      setRecipes(fetchedRecipes);
      setPantryIngredients(fetchedPantry);
    } catch (err) {
      console.error('Failed to load menu recipes data:', err);
      showToast('Error loading menu and recipe records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Recipe builder ingredient line-item handlers
  const handleAddIngredientLine = (pantryItem?: PantryStockItem) => {
    const newLine: RecipeIngredient = {
      name: pantryItem ? pantryItem.name : '',
      quantity: 1,
      unit: pantryItem ? pantryItem.unit : 'kg',
      unitPrice: pantryItem ? pantryItem.unitPrice : 0,
      cost: pantryItem ? pantryItem.unitPrice * 1 : 0,
    };
    setRecipeForm((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, newLine],
    }));
  };

  const handleUpdateIngredient = (index: number, field: keyof RecipeIngredient, val: string | number) => {
    setRecipeForm((prev) => {
      const updated = [...prev.ingredients];
      const item = { ...updated[index], [field]: val };

      if (field === 'quantity' || field === 'unitPrice') {
        const q = field === 'quantity' ? Number(val) || 0 : item.quantity;
        const p = field === 'unitPrice' ? Number(val) || 0 : item.unitPrice;
        item.cost = q * p;
      }
      updated[index] = item;
      return { ...prev, ingredients: updated };
    });
  };

  const handleRemoveIngredient = (index: number) => {
    setRecipeForm((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  // Live calculated recipe metrics
  const calculatedRecipeBatchCost = useMemo(() => {
    return recipeForm.ingredients.reduce((acc, ing) => acc + (Number(ing.cost) || 0), 0);
  }, [recipeForm.ingredients]);

  const calculatedCostPerPlate = useMemo(() => {
    const yieldCount = Math.max(1, recipeForm.servingYield);
    return Math.round((calculatedRecipeBatchCost / yieldCount) * 100) / 100;
  }, [calculatedRecipeBatchCost, recipeForm.servingYield]);

  const calculatedMarginPct = useMemo(() => {
    const sale = Number(recipeForm.recommendedSalePrice) || 0;
    if (sale <= 0) return 0;
    return Math.round(((sale - calculatedCostPerPlate) / sale) * 1000) / 10;
  }, [recipeForm.recommendedSalePrice, calculatedCostPerPlate]);

  // Open recipe modal
  const handleOpenRecipeModal = (recipe?: Recipe) => {
    if (recipe) {
      setEditingRecipe(recipe);
      setRecipeForm({
        dishName: recipe.dishName,
        category: recipe.category,
        servingYield: recipe.servingYield,
        prepTimeMinutes: recipe.prepTimeMinutes,
        recommendedSalePrice: recipe.recommendedSalePrice,
        instructions: recipe.instructions || '',
        ingredients: recipe.ingredients || [],
      });
    } else {
      setEditingRecipe(null);
      setRecipeForm({
        dishName: '',
        category: 'Rice & Biryani',
        servingYield: 100,
        prepTimeMinutes: 60,
        recommendedSalePrice: 1000,
        instructions: '',
        ingredients: [
          { name: 'Basmati Rice', quantity: 15, unit: 'kg', unitPrice: 390, cost: 5850 },
          { name: 'Meat (Mutton/Chicken)', quantity: 20, unit: 'kg', unitPrice: 1200, cost: 24000 },
          { name: 'Cooking Oil / Ghee', quantity: 3, unit: 'kg', unitPrice: 1500, cost: 4500 },
        ],
      });
    }
    setIsRecipeModalOpen(true);
  };

  // Save Recipe
  const handleSaveRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Partial<Recipe> = {
        dishName: recipeForm.dishName,
        category: recipeForm.category,
        servingYield: recipeForm.servingYield,
        prepTimeMinutes: recipeForm.prepTimeMinutes,
        recommendedSalePrice: recipeForm.recommendedSalePrice,
        instructions: recipeForm.instructions,
        ingredients: recipeForm.ingredients,
        totalBatchCost: calculatedRecipeBatchCost,
        costPerServing: calculatedCostPerPlate,
        marginPct: calculatedMarginPct,
      };

      if (editingRecipe) {
        const updated = await recipesApi.update(editingRecipe.id, payload);
        setRecipes((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        showToast(`Recipe for "${updated.dishName}" updated successfully!`);
      } else {
        const created = await recipesApi.create(payload);
        setRecipes((prev) => [...prev, created]);
        showToast(`Recipe for "${created.dishName}" added to kitchen catalog!`);
      }
      setIsRecipeModalOpen(false);
    } catch (err) {
      console.error('Failed to save recipe:', err);
      showToast('Failed to save recipe.');
    }
  };

  // Open package modal
  const handleOpenPackageModal = (pkg?: MenuPackage) => {
    if (pkg) {
      setEditingPackage(pkg);
      setPackageForm({
        name: pkg.name,
        tier: (pkg.tier as 'Royal' | 'Executive' | 'Budget' | 'Corporate') || 'Executive',
        pricePerHead: pkg.pricePerHead,
        costPerHead: pkg.costPerHead || Math.round(pkg.pricePerHead * 0.6),
        description: pkg.description || '',
        includedItems: pkg.includedItems || [],
        status: pkg.status,
      });
    } else {
      setEditingPackage(null);
      setPackageForm({
        name: '',
        tier: 'Executive',
        pricePerHead: 2500,
        costPerHead: 1500,
        description: '',
        includedItems: ['Chicken Makhni Karahi', 'Mutton Dum Biryani', 'Fresh Roghnai Naan', 'Shahi Kheer'],
        status: 'Active',
      });
    }
    setNewDishInput('');
    setIsPackageModalOpen(true);
  };

  // Save Package
  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Partial<MenuPackage> = {
        name: packageForm.name,
        tier: packageForm.tier,
        pricePerHead: Number(packageForm.pricePerHead) || 0,
        costPerHead: Number(packageForm.costPerHead) || 0,
        profitMarginPct:
          packageForm.pricePerHead > 0
            ? Math.round(
                ((packageForm.pricePerHead - packageForm.costPerHead) / packageForm.pricePerHead) * 1000
              ) / 10
            : 0,
        description: packageForm.description,
        includedItems: packageForm.includedItems,
        status: packageForm.status,
      };

      if (editingPackage) {
        const updated = await menuPackagesApi.update(editingPackage.id, payload);
        setPackages((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        showToast(`Package "${updated.name}" updated!`);
      } else {
        const created = await menuPackagesApi.create(payload);
        setPackages((prev) => [...prev, created]);
        showToast(`Catering package "${created.name}" created!`);
      }
      setIsPackageModalOpen(false);
    } catch (err) {
      console.error('Failed to save package:', err);
      showToast('Failed to save package.');
    }
  };

  // Filtered lists
  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
      if (tierFilter !== 'All' && pkg.tier !== tierFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          pkg.name.toLowerCase().includes(q) ||
          pkg.packageCode?.toLowerCase().includes(q) ||
          pkg.includedItems.some((item) => item.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [packages, tierFilter, searchQuery]);

  const filteredRecipes = useMemo(() => {
    return recipes.filter((rec) => {
      if (categoryFilter !== 'All' && rec.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          rec.dishName.toLowerCase().includes(q) ||
          rec.recipeCode.toLowerCase().includes(q) ||
          rec.ingredients.some((ing) => ing.name.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [recipes, categoryFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-400/40 animate-slide-up">
          <Sparkles className="w-5 h-5 text-emerald-200 animate-pulse" />
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-amber-500/10 via-purple-500/10 to-transparent rounded-full blur-3xl -z-10" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Catering Packages & Dish Recipe Costing
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
              Architect banquet menus (Royal, Executive, Budget) with live per-head cost margin calculations and interactive dish recipe ingredient breakdown.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleOpenPackageModal()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            >
              <Crown className="w-4 h-4 text-amber-400" />
              <span>Create Catering Package</span>
            </button>

            <button
              onClick={() => handleOpenRecipeModal()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Build Dish Recipe</span>
            </button>
          </div>
        </div>

        {/* Switcher Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('packages')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'packages'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Catering Package Master ({packages.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('recipes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'recipes'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <ChefHat className="w-3.5 h-3.5" />
            <span>Dish Recipe Builder & Margins ({recipes.length})</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Catering Package Master */}
      {activeTab === 'packages' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold">Tier:</span>
              {['All', 'Royal', 'Executive', 'Budget'].map((tier) => (
                <button
                  key={tier}
                  onClick={() => setTierFilter(tier)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition ${
                    tierFilter === tier
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>

            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search packages, included dishes..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-1.5 text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Packages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredPackages.map((pkg) => {
              const tierColor =
                pkg.tier === 'Royal'
                  ? 'border-purple-500/40 bg-purple-500/10 text-purple-300'
                  : pkg.tier === 'Executive'
                  ? 'border-sky-500/40 bg-sky-500/10 text-sky-300'
                  : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300';

              const margin =
                pkg.profitMarginPct ||
                (pkg.costPerHead && pkg.costPerHead > 0
                  ? Math.round(((pkg.pricePerHead - pkg.costPerHead) / pkg.pricePerHead) * 1000) / 10
                  : 38.5);

              return (
                <div
                  key={pkg.id}
                  className="bg-slate-900/60 backdrop-blur-md border border-slate-800 hover:border-slate-700 rounded-2xl p-6 transition-all shadow-md flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                          {pkg.packageCode}
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${tierColor}`}
                        >
                          {pkg.tier || 'Executive'} Tier
                        </span>
                      </div>
                      <button
                        onClick={() => handleOpenPackageModal(pkg)}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
                        title="Edit Package"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-white mt-3 leading-tight">
                      {pkg.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {pkg.description || 'Complete banquet catering setup with multi-course dinner service.'}
                    </p>

                    {/* Financial Economics Card */}
                    <div className="mt-4 p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 grid grid-cols-3 gap-2 text-center">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                          Client Price
                        </span>
                        <span className="text-sm font-black text-white">
                          Rs. {pkg.pricePerHead.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-500">per head</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                          Food Cost
                        </span>
                        <span className="text-sm font-bold text-slate-300">
                          Rs. {(pkg.costPerHead || Math.round(pkg.pricePerHead * 0.6)).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-500">est. ingredients</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                          Gross Margin
                        </span>
                        <span className="text-sm font-black text-emerald-400">
                          {margin}%
                        </span>
                        <span className="text-[10px] text-emerald-400/80">profit</span>
                      </div>
                    </div>

                    {/* Included Dishes */}
                    <div className="mt-4">
                      <span className="text-xs font-semibold text-slate-300 block mb-2">
                        Included Menu Dishes ({pkg.includedItems.length}):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {pkg.includedItems.map((dish, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-slate-800/80 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700/60"
                          >
                            {dish}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Active Booking Package
                    </span>
                    <button
                      onClick={() => handleOpenPackageModal(pkg)}
                      className="text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                    >
                      Configure Dishes →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Recipe Builder & Dish Costing */}
      {activeTab === 'recipes' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                'All',
                'Rice & Biryani',
                'Curries & Karahi',
                'Live BBQ',
                'Tandoor & Breads',
                'Desserts & Sweets',
              ].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition ${
                    categoryFilter === cat
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dish recipes, ingredients..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-1.5 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Recipe Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredRecipes.map((recipe) => (
              <div
                key={recipe.id}
                className="bg-slate-900/60 backdrop-blur-md border border-slate-800 hover:border-slate-700 rounded-2xl p-6 transition-all shadow-md flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {recipe.recipeCode}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {recipe.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {recipe.prepTimeMinutes} mins
                      </span>
                      <button
                        onClick={() => handleOpenRecipeModal(recipe)}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
                        title="Edit Recipe"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Yield */}
                  <div className="mt-3 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-base font-bold text-white leading-tight">
                        {recipe.dishName}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Standard Batch Yield: <strong className="text-slate-200">{recipe.servingYield} Servings</strong>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block font-semibold">Cost / Plate</span>
                      <span className="text-lg font-black text-rose-400">
                        Rs. {recipe.costPerServing.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Profit Margin Indicator */}
                  <div className="mt-4 p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 block">Total Batch Cost ({recipe.servingYield} plates):</span>
                      <span className="font-bold text-white">
                        Rs. {recipe.totalBatchCost.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block">Gross Profit Margin:</span>
                      <span className="font-extrabold text-emerald-400">
                        {recipe.marginPct}%
                      </span>
                    </div>
                  </div>

                  {/* Raw Ingredients Breakdown Table */}
                  <div className="mt-4">
                    <span className="text-xs font-semibold text-slate-300 block mb-2">
                      Ingredient Formula Breakdown:
                    </span>
                    <div className="rounded-xl border border-slate-800 overflow-hidden text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                          <tr>
                            <th className="py-2 px-3">Ingredient</th>
                            <th className="py-2 px-3 text-right">Quantity</th>
                            <th className="py-2 px-3 text-right">Cost (Rs.)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-300">
                          {recipe.ingredients.slice(0, 4).map((ing, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/30">
                              <td className="py-1.5 px-3 font-medium text-slate-200">{ing.name}</td>
                              <td className="py-1.5 px-3 text-right text-slate-400">
                                {ing.quantity} {ing.unit}
                              </td>
                              <td className="py-1.5 px-3 text-right font-mono font-semibold text-white">
                                {ing.cost.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                          {recipe.ingredients.length > 4 && (
                            <tr>
                              <td colSpan={3} className="py-1.5 px-3 text-center text-[11px] text-slate-500 italic">
                                + {recipe.ingredients.length - 4} more ingredients
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {recipe.instructions && (
                    <p className="mt-3 text-[11px] text-slate-400 italic line-clamp-2">
                      "{recipe.instructions}"
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Recommended Selling Price: <strong className="text-white">Rs. {recipe.recommendedSalePrice.toLocaleString()}</strong>
                  </span>
                  <button
                    onClick={() => handleOpenRecipeModal(recipe)}
                    className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                  >
                    Edit Formula →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recipe Builder Modal */}
      {isRecipeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
            <button
              onClick={() => setIsRecipeModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ChefHat className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {editingRecipe ? 'Edit Dish Recipe Formula' : 'Build New Dish Recipe & Costing'}
                </h3>
                <p className="text-xs text-slate-400">
                  Itemized raw ingredient quantities, serving yields, and real-time food cost margin calculation.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveRecipe} className="space-y-5">
              {/* Basic Meta */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Dish Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={recipeForm.dishName}
                    onChange={(e) => setRecipeForm({ ...recipeForm, dishName: e.target.value })}
                    placeholder="e.g. Mutton Zafrani Dum Biryani"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={recipeForm.category}
                    onChange={(e) => setRecipeForm({ ...recipeForm, category: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Rice & Biryani">Rice & Biryani</option>
                    <option value="Curries & Karahi">Curries & Karahi</option>
                    <option value="Live BBQ">Live BBQ</option>
                    <option value="Tandoor & Breads">Tandoor & Breads</option>
                    <option value="Desserts & Sweets">Desserts & Sweets</option>
                    <option value="Salad & Accompaniments">Salad & Accompaniments</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Batch Serving Yield *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={recipeForm.servingYield}
                    onChange={(e) =>
                      setRecipeForm({ ...recipeForm, servingYield: Number(e.target.value) || 1 })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-500">Number of plates</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Prep Time (Minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={recipeForm.prepTimeMinutes}
                    onChange={(e) =>
                      setRecipeForm({ ...recipeForm, prepTimeMinutes: Number(e.target.value) || 30 })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Recommended Selling Price (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={recipeForm.recommendedSalePrice}
                    onChange={(e) =>
                      setRecipeForm({
                        ...recipeForm,
                        recommendedSalePrice: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-500">Per plate price</span>
                </div>
              </div>

              {/* Live Cost Summary Bar */}
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 grid grid-cols-3 gap-4 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                    Total Batch Cost
                  </span>
                  <p className="text-lg font-black text-white">
                    Rs. {calculatedRecipeBatchCost.toLocaleString()}
                  </p>
                  <span className="text-[10px] text-slate-500">{recipeForm.ingredients.length} Ingredients</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                    Computed Cost / Plate
                  </span>
                  <p className="text-lg font-black text-rose-400">
                    Rs. {calculatedCostPerPlate.toLocaleString()}
                  </p>
                  <span className="text-[10px] text-slate-500">per guest portion</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                    Gross Profit Margin
                  </span>
                  <p className="text-lg font-black text-emerald-400">
                    {calculatedMarginPct}%
                  </p>
                  <span className="text-[10px] text-emerald-400/80">healthy margin</span>
                </div>
              </div>

              {/* Ingredients Builder */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-300">
                    Required Raw Ingredients:
                  </label>
                  <button
                    type="button"
                    onClick={() => handleAddIngredientLine()}
                    className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Custom Ingredient Line</span>
                  </button>
                </div>

                {/* Quick Add from Pantry Chips */}
                {pantryIngredients.length > 0 && (
                  <div className="mb-3">
                    <span className="text-[11px] text-slate-400 mb-1 block">Quick Add from Pantry Catalog:</span>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {pantryIngredients.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleAddIngredientLine(p)}
                          className="px-2 py-1 rounded-lg text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                        >
                          + {p.name.split(' ')[0]} {p.name.split(' ')[1] || ''} (Rs. {p.unitPrice}/{p.unit})
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {recipeForm.ingredients.map((ing, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/60 grid grid-cols-12 gap-2 items-center text-xs"
                    >
                      <div className="col-span-4">
                        <input
                          type="text"
                          required
                          value={ing.name}
                          onChange={(e) => handleUpdateIngredient(idx, 'name', e.target.value)}
                          placeholder="Ingredient name"
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none"
                        />
                      </div>

                      <div className="col-span-2">
                        <input
                          type="number"
                          step="0.1"
                          required
                          value={ing.quantity}
                          onChange={(e) => handleUpdateIngredient(idx, 'quantity', e.target.value)}
                          placeholder="Qty"
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none font-mono"
                        />
                      </div>

                      <div className="col-span-2">
                        <input
                          type="text"
                          value={ing.unit}
                          onChange={(e) => handleUpdateIngredient(idx, 'unit', e.target.value)}
                          placeholder="Unit (kg/L)"
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-300 text-xs focus:outline-none"
                        />
                      </div>

                      <div className="col-span-3">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-[10px]">
                            Rs.
                          </span>
                          <input
                            type="number"
                            step="1"
                            value={ing.unitPrice}
                            onChange={(e) => handleUpdateIngredient(idx, 'unitPrice', e.target.value)}
                            placeholder="Price"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-6 pr-2 py-1.5 text-white text-xs focus:outline-none font-mono"
                          />
                        </div>
                      </div>

                      <div className="col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveIngredient(idx)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition"
                          title="Delete line"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Preparation Instructions & Chef Notes
                </label>
                <textarea
                  rows={2}
                  value={recipeForm.instructions}
                  onChange={(e) => setRecipeForm({ ...recipeForm, instructions: e.target.value })}
                  placeholder="Key marination times, tandoor temperatures, spice layering..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRecipeModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Recipe & Costing Formula</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Package Configuration Modal */}
      {isPackageModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative my-8">
            <button
              onClick={() => setIsPackageModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {editingPackage ? 'Edit Catering Package' : 'Create New Catering Package'}
                </h3>
                <p className="text-xs text-slate-400">
                  Configure tier, pricing, estimated ingredient costs, and menu dish items.
                </p>
              </div>
            </div>

            <form onSubmit={handleSavePackage} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Package Name *
                </label>
                <input
                  type="text"
                  required
                  value={packageForm.name}
                  onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                  placeholder="e.g. Royal Mughlai Grand Feast"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Catering Tier
                  </label>
                  <select
                    value={packageForm.tier}
                    onChange={(e) =>
                      setPackageForm({
                        ...packageForm,
                        tier: e.target.value as 'Royal' | 'Executive' | 'Budget' | 'Corporate',
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Royal">Royal (Luxury High-End)</option>
                    <option value="Executive">Executive (Standard Banquet)</option>
                    <option value="Budget">Budget (Economical Package)</option>
                    <option value="Corporate">Corporate Gala</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={packageForm.status}
                    onChange={(e) =>
                      setPackageForm({
                        ...packageForm,
                        status: e.target.value as 'Active' | 'Inactive',
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Selling Price / Head (Rs.) *
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    required
                    value={packageForm.pricePerHead}
                    onChange={(e) =>
                      setPackageForm({
                        ...packageForm,
                        pricePerHead: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Estimated Cost / Head (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={packageForm.costPerHead}
                    onChange={(e) =>
                      setPackageForm({
                        ...packageForm,
                        costPerHead: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Live Margin Calculation Badge */}
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700 flex items-center justify-between text-xs">
                <span className="text-slate-400">Calculated Profit Margin:</span>
                <span className="font-extrabold text-emerald-400 text-sm">
                  {packageForm.pricePerHead > 0
                    ? `${Math.round(
                        ((packageForm.pricePerHead - packageForm.costPerHead) /
                          packageForm.pricePerHead) *
                          1000
                      ) / 10}%`
                    : '0%'}
                </span>
              </div>

              {/* Dishes list */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Included Menu Dishes
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newDishInput}
                    onChange={(e) => setNewDishInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newDishInput.trim()) {
                          setPackageForm({
                            ...packageForm,
                            includedItems: [...packageForm.includedItems, newDishInput.trim()],
                          });
                          setNewDishInput('');
                        }
                      }
                    }}
                    placeholder="Type dish name and press Enter or Add"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newDishInput.trim()) {
                        setPackageForm({
                          ...packageForm,
                          includedItems: [...packageForm.includedItems, newDishInput.trim()],
                        });
                        setNewDishInput('');
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                  {packageForm.includedItems.map((dish, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 text-xs bg-slate-800 text-slate-200 px-2.5 py-1 rounded-lg border border-slate-700"
                    >
                      <span>{dish}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setPackageForm({
                            ...packageForm,
                            includedItems: packageForm.includedItems.filter((_, i) => i !== idx),
                          })
                        }
                        className="text-slate-400 hover:text-rose-400"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description / Package Highlights
                </label>
                <textarea
                  rows={2}
                  value={packageForm.description}
                  onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
                  placeholder="e.g. Includes welcome mocktails, live tandoor, and dessert bar..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPackageModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md transition"
                >
                  Save Catering Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

