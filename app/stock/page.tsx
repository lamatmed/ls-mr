"use client";

import { useState, useEffect } from "react";
import { FaBarcode, FaBox, FaMoneyBillWave, FaCalendarAlt, FaCubes } from "react-icons/fa";
import Loader from "../components/Loader";
import { CiBarcode } from "react-icons/ci";
import { getAllProducts } from "../utlis/actions";
import Image from "next/image";
import { StaticImport } from "next/dist/shared/lib/get-img-props";

type Product = {
  image: string | StaticImport;
  id: string;
  code: number;
  name: string;
  quantity: number;
  price_v: number;
  price_a: number;
  expirationDate: string;
  codeBar?: string;
};

const imageList = [
  "/1.jpeg",
  "/2.jpeg",
  "/3.jpeg",
  "/4.jpeg",
  "/5.jpeg",
  "/6.jpeg",
  "/7.jpeg",
  "/8.jpeg",
  "/9.jpeg",
  "/10.jpeg",
];

export default function ProductsList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 8;

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const data = await getAllProducts();
    const formattedData = data.map((product) => ({
      ...product,
      expirationDate: new Date(product.expirationDate).toISOString().split("T")[0],
      codeBar: product.codeBar ?? "",
      image: imageList[Math.floor(Math.random() * imageList.length)], // Sélectionne une image aléatoire
    }));

    setProducts(formattedData);
    setFilteredProducts(formattedData);
    setLoading(false);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    const filtered = products.filter((p) =>
      p.code.toString().includes(e.target.value) ||
      p.codeBar?.toLowerCase().includes(e.target.value.toLowerCase())
    );
    setFilteredProducts(filtered);
    setCurrentPage(1);
  };

  const getExpirationStatus = (expirationDate: string) => {
    const today = new Date();
    const expDate = new Date(expirationDate);
    const timeDiff = expDate.getTime() - today.getTime();
    const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (daysLeft < 0) return <span className="text-red-600 font-bold">⚠️ Expiré</span>;
    if (daysLeft <= 20) return <span className="text-orange-500 font-bold">⚠️ Alerte ({daysLeft} jours restants)</span>;

    return null;
  };

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white mt-5">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">📦 Liste des Produits</h1>

      <input
        className="border p-3 w-full mb-6 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-black text-black"
        type="text"
        placeholder="🔍 Rechercher par code ou code barre..."
        value={search}
        onChange={handleSearch}
      />

      {loading ? (
        <Loader />
      ) : filteredProducts.length === 0 ? (
        <p className="text-center text-gray-500">Aucun produit trouvé.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {currentProducts.map((p) => (
            <div key={p.id} className="bg-white rounded-xl shadow-lg p-5 transition-transform transform hover:scale-105 hover:shadow-xl">
              <Image src={p.image} alt="Produit" className="w-full h-40 object-cover rounded-md mb-4" width={400} height={400}/>
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <FaBox className="text-blue-500 mr-2" /> {p.name}
              </h2>
              <p className="text-gray-600 flex items-center mt-2">
                <CiBarcode className="text-red-400 mr-2" />
                <span className="font-medium">{p.codeBar}</span>
              </p>
              <p className="text-gray-600 flex items-center mt-2">
                <FaBarcode className="text-orange-400 mr-2" /> <span className="font-medium">{p.code}</span>
              </p>
              <p className="text-gray-600 flex items-center mt-2">
                <FaCubes className="text-green-500 mr-2" /> <span className="font-medium">{p.quantity}</span>
              </p>
              <p className="text-gray-600 flex items-center mt-2">
                <FaMoneyBillWave className="text-yellow-500 mr-2" /> <span className="font-medium">{p.price_v} MRU</span>
              </p>
              <p className="text-gray-600 flex items-center mt-2">
                <FaCalendarAlt className="text-red-500 mr-2" /> 
                <span className="font-medium">{p.expirationDate}</span> 
                <span className="ml-2">{getExpirationStatus(p.expirationDate)}</span>
              </p>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center mt-6 space-x-3">
          <button
            className={`px-4 py-2 rounded-lg shadow-md ${currentPage === 1 ? "bg-gray-300 cursor-not-allowed" : "bg-blue-500 text-white hover:bg-blue-600"}`}
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            ⬅️ Précédent
          </button>
          <span className="px-4 py-2 border rounded-lg shadow-md bg-gray-100">{currentPage} / {totalPages}</span>
          <button
            className={`px-4 py-2 rounded-lg shadow-md ${currentPage === totalPages ? "bg-gray-300 cursor-not-allowed" : "bg-blue-500 text-white hover:bg-blue-600"}`}
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Suivant ➡️
          </button>
        </div>
      )}
    </div>
  );
}
