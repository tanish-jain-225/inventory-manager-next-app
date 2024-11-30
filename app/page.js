"use client";
import Header from "@/app/components/Header";
import { useState, useEffect } from "react";

export default function Home() {
  const [productForm, setProductForm] = useState({});
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [dropdown, setDropdown] = useState([]);
  const [timeoutId, setTimeoutId] = useState(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetching the products when the page is loaded
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true); // Set loading state to true while fetching data
      try {
        const response = await fetch("/api/product");
        const res = await response.json();
        setProducts(res.products);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
      setLoading(false); // Set loading state to false after data is fetched
    };
    fetchProducts();
  }, []);

  const buttonAction = async (action, slug, initialQuantity) => {
    const index = products.findIndex((item) => item.slug === slug);
    const newProducts = [...products];
    const indexDrop = dropdown.findIndex((item) => item.slug === slug);
    const newProductsDrop = [...dropdown];

    if (action === "plus") {
      newProducts[index].quantity = parseInt(initialQuantity) + 1;
      newProductsDrop[indexDrop].quantity = parseInt(initialQuantity) + 1;
    } else {
      newProducts[index].quantity = parseInt(initialQuantity) - 1;
      newProductsDrop[indexDrop].quantity = parseInt(initialQuantity) - 1;
    }

    if (newProducts[index].quantity === 0) {
      newProducts.splice(index, 1);
    }

    if (newProductsDrop[indexDrop].quantity === 0) {
      newProductsDrop.splice(indexDrop, 1);
    }

    setProducts(newProducts);
    setDropdown(newProductsDrop);

    setLoadingAction(true);
    try {
      const response = await fetch("/api/action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action, slug, initialQuantity }),
      });
      await response.json();
    } catch (error) {
      console.error("Error updating product quantity:", error);
    }
    setLoadingAction(false);
  };

  const addProduct = async () => {
    if (
      !productForm.slug ||
      !productForm.quantity ||
      !productForm.price ||
      productForm.quantity <= 0 ||
      productForm.price <= 0
    ) {
      alert("Please fill out all fields correctly!");
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
        const newProduct = await response.json();
        setProducts((prevProducts) => [...prevProducts, newProduct]);
        setProductForm({});
        window.location.reload();
      } else {
        alert("Failed to add product");
      }
    } catch (error) {
      console.error("Error adding product:", error);
    }
  };

  const handleChange = (e) => {
    setProductForm({ ...productForm, [e.target.name]: e.target.value });
  };

  const fetchDropdownProducts = async (newQueryInp) => {
    setLoading(true);
    setDropdown([]);
    try {
      const responseDrop = await fetch("/api/search?query=" + newQueryInp);
      const resDrop = await responseDrop.json();
      setDropdown(resDrop.products);
    } catch (error) {
      console.error("Error fetching dropdown products:", error);
    }
    setLoading(false);
  };

  const onDropdownEdit = (value) => {
    const newQueryInp = value;
    setQuery(newQueryInp);

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (newQueryInp === "") {
      setDropdown([]);
    } else {
      const newTimeoutId = setTimeout(() => {
        fetchDropdownProducts(newQueryInp);
      }, 300);
      setTimeoutId(newTimeoutId);
    }
  };
  return (
    <>
      <Header />
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
          />
          {loading && <div className="text-center mt-2">Loading...</div>}
          <ul className="mt-4 space-y-2">
            {dropdown.map((item) => (
              <li
                key={item.slug} // Unique key for each list item
                className="flex justify-between items-center p-2 bg-gray-50 rounded-md shadow-sm"
              >
                <span>
                  <strong>{item.slug}</strong> - {item.quantity} in stock at ₹
                  {item.price}
                </span>
                <div className="flex space-x-2">
                  <button
                    className="px-3 py-1 bg-green-500 text-white rounded-md"
                    disabled={loadingAction}
                    onClick={() =>
                      buttonAction("plus", item.slug, item.quantity)
                    }
                  >
                    +
                  </button>
                  <button
                    className="px-3 py-1 bg-red-500 text-white rounded-md"
                    disabled={loadingAction}
                    onClick={() =>
                      buttonAction("minus", item.slug, item.quantity)
                    }
                  >
                    -
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="container mx-auto p-4 my-4 bg-gray-100 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-gray-700 mb-4">
          Add a Product
        </h1>
        <form className="bg-white p-4 rounded-lg shadow-lg">
          <div className="mb-4">
            <input
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring focus:ring-gray-300"
              name="slug"
              type="text"
              placeholder="Product Name"
              onChange={handleChange}
              value={productForm.slug || ""}
            />
          </div>
          <div className="mb-4">
            <input
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring focus:ring-gray-300"
              name="quantity"
              type="number"
              placeholder="Quantity"
              onChange={handleChange}
              value={productForm.quantity || ""}
            />
          </div>
          <div className="mb-4">
            <input
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring focus:ring-gray-300"
              name="price"
              type="number"
              placeholder="Price"
              onChange={handleChange}
              value={productForm.price || ""}
            />
          </div>
          <button
            type="button"
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md"
            onClick={addProduct}
          >
            Add Product
          </button>
        </form>
      </div>
      <div className="container mx-auto p-4 my-4 bg-gray-100 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-gray-700 mb-4">
          Current Stock
        </h1>
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
              <tr key={product.slug} className="text-center">
                <td className="px-4 py-2 border-b">{product.slug}</td>
                <td className="px-4 py-2 border-b">{product.quantity}</td>
                <td className="px-4 py-2 border-b">₹{product.price}</td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan="3" className="text-center py-4">
                  No products available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
