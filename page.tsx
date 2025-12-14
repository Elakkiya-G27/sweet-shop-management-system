
/home/z/my-project/frontend/src/app/page.tsx


'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { Search, ShoppingCart, Plus, Trash2, Filter, LogIn, UserPlus, Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api';

// Types
interface Sweet {
  id: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  category: string;
  imageUrl?: string;
}

interface User {
  id: string;
  email: string;
  name?: string;
  role: 'USER' | 'ADMIN';
}

interface CartItem {
  sweetId: string;
  quantity: number;
}

// Constants
const CATEGORIES = ['all', 'candy', 'chocolate', 'gummy', 'lollipop', 'hard candy', 'indian sweet', 'dessert', 'other'] as const;

const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23f3f4f6"/%3E%3Ctext x="50%" y="50%" text-anchor="middle" fill="%239ca3af" font-family="Arial" font-size="14"%3E🍬%3C/text%3E%3C/svg%3E';

// Custom hooks
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window !== 'undefined') {
      try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : initialValue;
      } catch {
        return initialValue;
      }
    }
    return initialValue;
  });

  const setItem = useCallback((value: T) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      setStoredValue(value);
    } catch (error) {
      console.error(`Error saving to localStorage:`, error);
    }
  }, [key]);

  const removeItem = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing from localStorage:`, error);
    }
  }, [key, initialValue]);

  return { value: storedValue, setItem, removeItem };
};

// Components
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
  </div>
);

const ErrorBoundary = ({ children, error }: { children: React.ReactNode; error?: Error }) => (
  <div className="p-4 border border-red-200 rounded-lg bg-red-50">
    <h2 className="text-lg font-semibold text-red-800 mb-2">Something went wrong</h2>
    {error && <p className="text-red-600">{error.message}</p>}
    <button
      onClick={() => window.location.reload()}
      className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
    >
      Reload Page
    </button>
  </div>
);

const ProductImage = ({ src, alt, name }: { src?: string; alt: string; name: string }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className="aspect-video bg-gray-100 relative overflow-hidden group">
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      {src ? (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="text-center">
            <div className="text-4xl mb-2">🍬</div>
            <span className="text-sm text-gray-500">{name}</span>
          </div>
        </div>
      )}
    </div>
  );
};

const ProductCard = React.memo(({ 
  sweet, 
  onAddToCart, 
  onDelete, 
  canEdit = false 
}: { 
  sweet: Sweet; 
  onAddToCart: (id: string) => void; 
  onDelete?: (id: string) => void; 
  canEdit?: boolean;
}) => {
  const handleAddToCart = useCallback(() => {
    onAddToCart(sweet.id);
  }, [sweet.id, onAddToCart]);

  const handleDelete = useCallback(() => {
    if (onDelete && window.confirm(`Delete "${sweet.name}"?`)) {
      onDelete(sweet.id);
    }
  }, [sweet.id, onDelete]);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
      <ProductImage 
        src={sweet.imageUrl} 
        alt={sweet.name} 
        name={sweet.name}
      />
      {sweet.quantity === 0 && (
        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center backdrop-blur-sm z-10">
          <Badge variant="destructive" className="text-lg px-4 py-2">
            Out of Stock
          </Badge>
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
            {sweet.name}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="capitalize">
              {sweet.category}
            </Badge>
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        {sweet.description && (
          <CardDescription className="text-gray-600 line-clamp-2">
            {sweet.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex justify-between items-center mb-4">
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-green-600">
              ${sweet.price.toFixed(2)}
            </span>
            <span className="text-sm text-gray-500">
              {sweet.quantity > 0 ? `${sweet.quantity} in stock` : 'Out of stock'}
            </span>
          </div>
          <Button
            onClick={handleAddToCart}
            disabled={sweet.quantity === 0}
            className="flex-1 transition-all duration-200"
            variant={sweet.quantity === 0 ? "secondary" : "default"}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {sweet.quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

ProductCard.displayName = 'ProductCard';

// Main App Component
export default function SweetShop() {
  // State management
  const [sweets, setSweets] = useState<Sweet[]>([]);
  const [filteredSweets, setFilteredSweets] = useState<Sweet[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Form states
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isAddSweetOpen, setIsAddSweetOpen] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ email: '', password: '', name: '' });
  const [sweetForm, setSweetForm] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    category: 'candy'
  });

  // Custom hooks
  const { value: token, setItem: setToken, removeItem: removeToken } = useLocalStorage('token', '');
  const { value: cartItems, setItem: setCartItem } = useLocalStorage('cart', {});

  // Debounced search
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Memoized calculations
  const cartTotal = useMemo(() => {
    return Object.entries(cart).reduce((total, [sweetId, quantity]) => {
      const sweet = sweets.find(s => s.id === sweetId);
      return total + (sweet?.price || 0) * quantity;
    }, 0);
  }, [cart, sweets]);

  const cartItemCount = useMemo(() => {
    return Object.values(cart).reduce((count, quantity) => count + quantity, 0);
  }, [cart]);

  // API calls
  const fetchSweets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.get<Sweet[]>('/sweets');
      setSweets(data);
      setFilteredSweets(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogin = useCallback(async () => {
    try {
      const data = await apiClient.post<{ user: User; token: string }>('/auth/login', loginForm);
      setUser(data.user);
      setToken(data.token);
      setIsLoginOpen(false);
      setLoginForm({ email: '', password: '' });
    } catch (err: any) {
      alert(`Login failed: ${err.message}`);
    }
  }, [loginForm]);

  const handleRegister = useCallback(async () => {
    try {
      const data = await apiClient.post<User>('/auth/register', registerForm);
      setUser(data);
      setIsRegisterOpen(false);
      setRegisterForm({ email: '', password: '', name: '' });
    } catch (err: any) {
      alert(`Registration failed: ${err.message}`);
    }
  }, [registerForm]);

  const handleAddSweet = useCallback(async () => {
    try {
      await apiClient.post('/sweets', sweetForm);
      await fetchSweets();
      setIsAddSweetOpen(false);
      setSweetForm({
        name: '',
        description: '',
        price: '',
        quantity: '',
        category: 'candy'
      });
    } catch (err: any) {
      alert(`Failed to add sweet: ${err.message}`);
    }
  }, [sweetForm, fetchSweets]);

  const handleDeleteSweet = useCallback(async (sweetId: string) => {
    try {
      await apiClient.delete(`/sweets/${sweetId}`);
      await fetchSweets();
    } catch (err: any) {
      alert(`Failed to delete sweet: ${err.message}`);
    }
  }, []);

  const handlePurchase = useCallback(async () => {
    if (Object.keys(cart).length === 0) return;
    
    if (!user) {
      alert('Please login to make a purchase');
      return;
    }

    try {
      const items = Object.entries(cart).map(([sweetId, quantity]) => ({
        sweetId,
        quantity
      }));

      const order = await apiClient.post<{ id: string }>('/orders', { items }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      alert(`Purchase successful! Order ID: ${order.id}`);
      setCart({});
      setCartItem({});
      await fetchSweets();
    } catch (err: any) {
      alert(`Purchase failed: ${err.message}`);
    }
  }, [cart, user, token, fetchSweets]);

  // Filtered sweets
  const filteredSweetsData = useMemo(() => {
    return sweets.filter(sweet => {
      const matchesSearch = !debouncedSearchTerm || 
        sweet.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        sweet.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || sweet.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [sweets, debouncedSearchTerm, selectedCategory]);

  // Effects
  useEffect(() => {
    fetchSweets();
  }, [fetchSweets]);

  useEffect(() => {
    setFilteredSweets(filteredSweetsData);
  }, [filteredSweetsData]);

  // Cart management
  const addToCart = useCallback((sweetId: string) => {
    const newCart = { ...cart };
    newCart[sweetId] = (newCart[sweetId] || 0) + 1;
    setCart(newCart);
    setCartItem(newCart);
  }, [cart, setCartItem]);

  const removeFromCart = useCallback((sweetId: string) => {
    const newCart = { ...cart };
    delete newCart[sweetId];
    setCart(newCart);
    setCartItem(newCart);
  }, [cart, setCartItem]);

  const updateCartQuantity = useCallback((sweetId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(sweetId);
    } else {
      const newCart = { ...cart };
      newCart[sweetId] = quantity;
      setCart(newCart);
      setCartItem(newCart);
    }
  }, [cart, setCartItem]);

  const clearCart = useCallback(() => {
    setCart({});
    setCartItem({});
  }, []);

  if (error) {
    return <ErrorBoundary error={error} />;
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-10 h-10 mr-3">
                <img
                  src="/sweet-shop-logo.png"
                  alt="Sweet Shop Logo"
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
              <h1 className="text-2xl font-bold text-purple-600">Sweet Shop</h1>
            </div>
            
            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">Welcome, {user.name || user.email}</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setUser(null);
                      removeToken();
                    }}
                  >
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <LogIn className="w-4 h-4 mr-2" />
                        Login
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Login</DialogTitle>
                        <DialogDescription>
                          Enter your credentials to access your account
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={loginForm.email}
                            onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                            placeholder="Enter your email"
                          />
                        </div>
                        <div>
                          <Label htmlFor="password">Password</Label>
                          <Input
                            id="password"
                            type="password"
                            value={loginForm.password}
                            onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                            placeholder="Enter your password"
                          />
                        </div>
                        <Button onClick={handleLogin} className="w-full">
                          Login
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Register
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Register</DialogTitle>
                        <DialogDescription>
                          Create a new account to start shopping
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="reg-name">Name</Label>
                          <Input
                            id="reg-name"
                            value={registerForm.name}
                            onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                            placeholder="Enter your name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="reg-email">Email</Label>
                          <Input
                            id="reg-email"
                            type="email"
                            value={registerForm.email}
                            onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                            placeholder="Enter your email"
                          />
                        </div>
                        <div>
                          <Label htmlFor="reg-password">Password</Label>
                          <Input
                            id="reg-password"
                            type="password"
                            value={registerForm.password}
                            onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                            placeholder="Enter your password"
                          />
                        </div>
                        <Button onClick={handleRegister} className="w-full">
                          Register
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
              
              {/* Cart */}
              <div className="relative">
                <ShoppingCart className="w-6 h-6 text-gray-600" />
                {cartItemCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs animate-bounce">
                    {cartItemCount}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search sweets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(category => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {user?.role === 'ADMIN' && (
            <Dialog open={isAddSweetOpen} onOpenChange={setIsAddSweetOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Sweet
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Sweet</DialogTitle>
                  <DialogDescription>
                    Add a new sweet to the inventory
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="sweet-name">Name</Label>
                    <Input
                      id="sweet-name"
                      value={sweetForm.name}
                      onChange={(e) => setSweetForm({ ...sweetForm, name: e.target.value })}
                      placeholder="Sweet name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sweet-description">Description</Label>
                    <Textarea
                      id="sweet-description"
                      value={sweetForm.description}
                      onChange={(e) => setSweetForm({ ...sweetForm, description: e.target.value })}
                      placeholder="Describe the sweet"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="sweet-price">Price</Label>
                      <Input
                        id="sweet-price"
                        type="number"
                        step="0.01"
                        value={sweetForm.price}
                        onChange={(e) => setSweetForm({ ...sweetForm, price: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="sweet-quantity">Quantity</Label>
                      <Input
                        id="sweet-quantity"
                        type="number"
                        value={sweetForm.quantity}
                        onChange={(e) => setSweetForm({ ...sweetForm, quantity: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="sweet-category">Category</Label>
                    <Select value={sweetForm.category} onValueChange={(value) => setSweetForm({ ...sweetForm, category: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.filter(c => c !== 'all').map(category => (
                          <SelectItem key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddSweet} className="w-full">
                    Add Sweet
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Products Grid */}
        <Suspense fallback={<LoadingSpinner />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {filteredSweetsData.map((sweet) => (
              <ProductCard
                key={sweet.id}
                sweet={sweet}
                onAddToCart={addToCart}
                onDelete={user?.role === 'ADMIN' ? handleDeleteSweet : undefined}
                canEdit={user?.role === 'ADMIN'}
              />
            ))}
          </div>
        </Suspense>

        {/* Empty State */}
        {filteredSweetsData.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🍬</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No sweets found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        )}

        {/* Cart Summary */}
        {cartItemCount > 0 && (
          <Card className="sticky bottom-4">
            <CardHeader>
              <CardTitle>Shopping Cart</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                {Object.entries(cart).map(([sweetId, quantity]) => {
                  const sweet = sweets.find(s => s.id === sweetId);
                  return sweet ? (
                    <div key={sweetId} className="flex justify-between items-center py-2 border-b">
                      <div className="flex-1">
                        <span className="font-medium">{sweet.name}</span>
                        <span className="text-sm text-gray-500">x {quantity}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold">${(sweet.price * quantity).toFixed(2)}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateCartQuantity(sweetId, quantity - 1)}
                      >
                        -
                      </Button>
                    </div>
                  ) : null;
                })}
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-xl font-bold text-green-600">${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={clearCart}>
                    Clear Cart
                  </Button>
                  <Button onClick={handlePurchase} size="lg">
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Purchase
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
