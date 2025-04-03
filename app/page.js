"use client";
import Header from "@/app/components/Header";
import { useState, useEffect } from "react";

/**
 * Home component - Main inventory management dashboard
 * Provides functionality for searching products, adding new products,
 * updating quantities, and displaying current stock levels
 */
export default function Home() {
  // State management for product form and inventory data
  const [productForm, setProductForm] = useState({});
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [dropdown, setDropdown] = useState([]);
  const [timeoutId, setTimeoutId] = useState(null);
  // Replace isClient with mounted pattern to prevent hydration mismatch
  const [mounted, setMounted] = useState(false);
  // Add refreshTrigger to control when to refresh data
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Mark component as mounted after initial render
  useEffect(() => {
    setMounted(true);
  }, []);

  /**
   * Fetch all products from the database when component mounts or refresh is triggered
   */
  useEffect(() => {
    // Skip the fetch on server render
    if (!mounted) return;
    
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/product");
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const res = await response.json();
        setProducts(res.products);
      } catch (error) {
        console.error("Error fetching products:", error);
        // Could add user notification here
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [mounted, refreshTrigger]);

  /**
   * Trigger a data refresh by incrementing the refresh counter
   */
  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  /**
   * Handle quantity changes when increment/decrement buttons are clicked
   * @param {string} action - "plus" or "minus" to indicate quantity change direction
   * @param {string} slug - Product identifier
   * @param {number} initialQuantity - Current quantity before change
   */
  const buttonAction = async (action, slug, initialQuantity) => {
    // Update local state first for responsive UI
    const index = products.findIndex((item) => item.slug === slug);
    const newProducts = [...products];
    const indexDrop = dropdown.findIndex((item) => item.slug === slug);
    const newProductsDrop = [...dropdown];
    
    // Calculate new quantity based on action
    const quantityChange = action === "plus" ? 1 : -1;
    const newQuantity = parseInt(initialQuantity) + quantityChange;
    
    // Update quantities in both arrays
    if (index !== -1) newProducts[index].quantity = newQuantity;
    if (indexDrop !== -1) newProductsDrop[indexDrop].quantity = newQuantity;

    // Remove products with zero quantity
    if (index !== -1 && newProducts[index].quantity === 0) {
      newProducts.splice(index, 1);
      setQuery("");
      setDropdown([]);
    }

    if (indexDrop !== -1 && newProductsDrop[indexDrop].quantity === 0) {
      newProductsDrop.splice(indexDrop, 1);
      // Use refreshData instead of window.location.reload()
      refreshData();
    }

    // Update state
    setProducts(newProducts);
    setDropdown(newProductsDrop);

    // Send update to the server
    setLoadingAction(true);
    try {
      const response = await fetch("/api/action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action, slug, initialQuantity }),
      });
      if (!response.ok) {
        throw new Error(`Failed to update quantity: ${response.status}`);
      }
      await response.json();
    } catch (error) {
      console.error("Error updating product quantity:", error);
      // Revert state changes on error (optional)
    } finally {
      setLoadingAction(false);
    }
  };

  /**
   * Add a new product to the inventory
   */
  const addProduct = async () => {
    // Form validation
    if (!productForm.slug?.trim()) {
      alert("Product name is required");
      return;
    }
    
    if (!productForm.quantity || productForm.quantity <= 0) {
      alert("Quantity must be a positive number");
      return;
    }
    
    if (!productForm.price || productForm.price <= 0) {
      alert("Price must be a positive number");
      return;
    }

    try {
      const response = await fetch("/api/product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productForm),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update local state with the new product
        if (data.product) {
          setProducts(prevProducts => [...prevProducts, data.product]);
        } else if (data.result && data.result.insertedId) {
          // If API doesn't return the product object, construct it from form data
          const newProduct = {
            ...productForm,
            _id: data.result.insertedId
          };
          setProducts(prevProducts => [...prevProducts, newProduct]);
        }
        
        // Reset form
        setProductForm({});
        
        // Refresh data instead of reloading page
        refreshData();
      } else {
        const errorData = await response.json();
        alert(`Failed to add product: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error adding product:", error);
      alert("Failed to add product due to a network error. Please try again.");
    }
  };

  /**
   * Handle form input changes
   * @param {Event} e - Input change event
   */
  const handleChange = (e) => {
    setProductForm({ 
      ...productForm, 
      [e.target.name]: e.target.value 
    });
  };

  /**
   * Fetch products matching search query for dropdown
   * @param {string} newQueryInp - Search query input
   */
  const fetchDropdownProducts = async (newQueryInp) => {
    setLoading(true);
    setDropdown([]);
    // Skip API call if query is empty
    if (newQueryInp.trim() === "") {
      setLoading(false);
      setDropdown([]);
      return;
    }
    // Fetch products from API based on search query
    try {
      const responseDrop = await fetch(`/api/search?query=${encodeURIComponent(newQueryInp.trim())}`);
      if (!responseDrop.ok) {
        throw new Error(`Search request failed with status: ${responseDrop.status}`);
      }
      const resDrop = await responseDrop.json();
      setDropdown(resDrop.products);
    } catch (error) {
      console.error("Error fetching dropdown products:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle search input changes with debounce
   * @param {string} value - Current search input value
   */
  const onDropdownEdit = (value) => {
    const newQueryInp = value;
    setQuery(newQueryInp);

    // Clear any existing timeout to implement debounce
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (newQueryInp === "") {
      setDropdown([]);
    } else {
      // Debounce API calls to reduce unnecessary requests
      const newTimeoutId = setTimeout(() => {
        fetchDropdownProducts(newQueryInp);
      }, 300);
      setTimeoutId(newTimeoutId);
    }
  };
  
  // Return loading state before client-side hydration completes
  if (!mounted) {
    return (
      <>
        <Header />
        <div className="container mx-auto p-4 my-4 text-center">
          <div className="animate-pulse">Loading application...</div>
        </div>
      </>
    );
  }
  
  // Main render once hydration is complete
  return (
    <>
      <Header />
      {/* Search Section */}
      <div className="container mx-auto p-4 my-4 bg-gray-100 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-gray-700 mb-4">
          Search a Product
        </h1>

        <div className="bg-white p-4 rounded-lg shadow-lg">
          <input
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring focus:ring-gray-300"
            type="text"
            placeholder="Search Product"
            value={query}
            onChange={(e) => onDropdownEdit(e.target.value)}
            aria-label="Search for products"
          />
          {loading && <div className="text-center mt-2">Loading...</div>}
          <ul className="mt-4 space-y-2">
            {dropdown.map((item) => (
              <li
                key={item.slug}
                className="flex justify-between items-center p-2 bg-gray-50 rounded-md shadow-sm"
              >
                <span>
                  <strong>{item.slug}</strong> - {item.quantity} in stock at ₹
                  {item.price}
                </span>
                <div className="flex space-x-2">
                  <button
                    className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600"
                    disabled={loadingAction}
                    onClick={() =>
                      buttonAction("plus", item.slug, item.quantity)
                    }
                    aria-label={`Increase quantity of ${item.slug}`}
                  >
                    +
                  </button>
                  <button
                    className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
                    disabled={loadingAction}
                    onClick={() =>
                      buttonAction("minus", item.slug, item.quantity)
                    }
                    aria-label={`Decrease quantity of ${item.slug}`}
                  >
                    -
                  </button>
                </div>
              </li>
            ))}
            {!loading && query && dropdown.length === 0 && (
              <li className="text-center p-2">No matching products found</li>
            )}
          </ul>
        </div>
      </div>
      
      {/* Rest of component remains the same */}
      {/* Add Product Section */}
      <div className="container mx-auto p-4 my-4 bg-gray-100 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-gray-700 mb-4">
          Add a Product
        </h1>
        <form className="bg-white p-4 rounded-lg shadow-lg">
          <div className="mb-4">
            <label htmlFor="product-name" className="block text-sm font-medium text-gray-700 mb-1">
              Product Name
            </label>
            <input
              id="product-name"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring focus:ring-gray-300"
              name="slug"
              type="text"
              placeholder="Product Name"
              onChange={handleChange}
              value={productForm.slug || ""}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="product-quantity" className="block text-sm font-medium text-gray-700 mb-1">
              Quantity
            </label>
            <input
              id="product-quantity"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring focus:ring-gray-300"
              name="quantity"
              type="number"
              min="1"
              placeholder="Quantity"
              onChange={handleChange}
              value={productForm.quantity || ""}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="product-price" className="block text-sm font-medium text-gray-700 mb-1">
              Price (₹)
            </label>
            <input
              id="product-price"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring focus:ring-gray-300"
              name="price"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Price"
              onChange={handleChange}
              value={productForm.price || ""}
            />
          </div>
          
          <button
            type="button"
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 transition-colors"
            onClick={addProduct}
          >
            Add Product
          </button>
        </form>
      </div>
      
      {/* Current Stock Section */}
      <div className="container mx-auto p-4 my-4 bg-gray-100 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-gray-700 mb-4">
          Current Stock
        </h1>
        {loading ? (
          <div className="text-center p-4">Loading inventory data...</div>
        ) : (
          <table className="w-full bg-white border rounded-md shadow-lg">
            <thead className="bg-gray-300 text-gray-700">
              <tr>
                <th className="py-2 px-4 border-b">Product Name</th>
                <th className="py-2 px-4 border-b">Quantity</th>
                <th className="py-2 px-4 border-b">Price</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.slug} className="text-center hover:bg-gray-50">
                  <td className="px-4 py-2 border-b">{product.slug}</td>
                  <td className="px-4 py-2 border-b">{product.quantity}</td>
                  <td className="px-4 py-2 border-b">₹{product.price}</td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan="3" className="text-center py-4">
                    No products available!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}